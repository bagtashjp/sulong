import * as jose from 'jose';

const TOKEN_TTL = 3600;

export default class FirestoreREST {
    constructor(env) {
        this.env = env;
        this.projectId = env.FIRESTORE_PROJECT_ID;
        this.clientEmail = env.FIRESTORE_CLIENT_EMAIL;
        this.privateKey = env.FIRESTORE_PRIVATE_KEY.replace(/\\n/g, '\n');
        this.kv = env.SERVER_TOKEN_KV;
    }

    async getAccessToken() {
        //console.log("Getting access token...");
        const cached = await this.kv.get('access_token');
        if (cached) {
            //console.log("Using cached access token:", cached);
            return cached;
        }
        //console.log("Cached token not found, generating new token...");
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iss: this.clientEmail,
            scope: "https://www.googleapis.com/auth/datastore",
            aud: "https://oauth2.googleapis.com/token",
            iat: now,
            exp: now + TOKEN_TTL
        };

        const jwt = await new jose.SignJWT(payload)
            .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
            .sign(await jose.importPKCS8(this.privateKey, 'RS256'));
        console.log("Generated JWT:", jwt);
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt
            })
        });

        const data = await res.json();
        if (!data.access_token) throw new Error('Failed to get access token');

        await this.kv.put('access_token', data.access_token, { expirationTtl: TOKEN_TTL - 60 });
        return data.access_token;
    }

    getBaseUrl() {
        return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
    }

    toFields(obj) {
        const fields = {};
        for (const key in obj) {
            const val = obj[key];
            if (val === undefined) {
                continue;
            }

            if (typeof val === 'string') fields[key] = { stringValue: val };
            else if (Number.isInteger(val)) fields[key] = { integerValue: String(val) };
            else if (typeof val === 'number') fields[key] = { doubleValue: val };
            else if (val instanceof Date) fields[key] = { timestampValue: val.toISOString() };
            else if (val?.latitude !== undefined && val?.longitude !== undefined) fields[key] = { geoPointValue: val };
            else if (val === null) fields[key] = { nullValue: null };
            else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
            // Custom change to handle vector arrays (number[]) for embeddings
            else if (Array.isArray(val) && val.every(v => typeof v === 'number')) {
                fields[key] = {
                    arrayValue: { 
                        values: val.map(v => ({ doubleValue: v })) 
                    }
                };
            }
            else if (Array.isArray(val)) fields[key] = { arrayValue: { values: val.map(v => this.toFields({ v }).v) } };
            else if (typeof val === 'object') fields[key] = { mapValue: { fields: this.toFields(val) } };
            else fields[key] = { stringValue: String(val) };
        }
        return fields;
    }

    fromFields(fields) {
        const obj = {};
        for (const key in fields) {
            const val = fields[key];
            if (val.stringValue !== undefined) obj[key] = val.stringValue;
            else if (val.integerValue !== undefined) obj[key] = parseInt(val.integerValue);
            else if (val.doubleValue !== undefined) obj[key] = parseFloat(val.doubleValue);
            else if (val.timestampValue !== undefined) obj[key] = new Date(val.timestampValue);
            else if (val.geoPointValue) obj[key] = val.geoPointValue;
            else if (val.booleanValue !== undefined) obj[key] = val.booleanValue;
            // Custom change to handle vector arrays (number[]) coming back from Firestore
            else if (val.arrayValue?.values && val.arrayValue.values.every(v => v.doubleValue !== undefined)) {
                 obj[key] = val.arrayValue.values.map(v => v.doubleValue);
            }
            else if (val.arrayValue?.values) obj[key] = val.arrayValue.values.map(v => this.fromFields({ v }).v);
            else if (val.mapValue?.fields) obj[key] = this.fromFields(val.mapValue.fields);
            else obj[key] = null;
        }
        return obj;
    }

    async firestoreRequest(method, path, body = null) {
        const token = await this.getAccessToken();
        const url = `${this.getBaseUrl()}/${path}`;
        const res = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Firestore Error: ${res.status} ${res.statusText} ${JSON.stringify(err)}`);
        }

        // Check for empty body
        const text = await res.text();
        if (text) {
            try {
                return JSON.parse(text);
            } catch (e) {
                throw new Error(`Firestore Error: Failed to parse JSON response. Status: ${res.status}. Response: ${text}`);
            }
        }
        return null;
    }

    async getDoc(fullPath, docId) {
        try {
            const data = await this.firestoreRequest('GET', `${fullPath}/${docId}`);
            const id = data.name.split('/').pop();
            return { id, ...this.fromFields(data.fields) };
        } catch (error) {
            return null;
        }
    }

    // The getDocs method queries a collection specified by the full path.
    async getDocs(fullPath, queryBody = {}) {
        const body = {
            structuredQuery: {
                from: [{ collectionId: fullPath }],
                ...queryBody
            }
        };

        const results = await this.firestoreRequest('POST', ':runQuery', body);

        return results
            .filter(r => r.document)
            .map(r => ({
                id: r.document.name.split('/').pop(),
                ...this.fromFields(r.document.fields)
            }));
    }
    
    // --- NEW METHOD FOR VECTOR SEARCH ---
    /**
     * Executes a vector similarity search on a collection, optionally pre-filtered by a 'where' clause.
     * @param {string} fullPath The collection ID (e.g., 'posts').
     * @param {number[]} queryVector The vector to search for (e.g., the embedding of the user's query).
     * @param {{limit: number, vectorField: string, distanceMeasure: 'EUCLIDEAN'|'COSINE'|'DOT_PRODUCT', distanceResultField?: string, distanceThreshold?: number, where?: object}} options
     * @returns {Promise<object[]>} Array of documents, including the distanceResultField if specified.
     */
    // ...
    async vectorFinder(fullPath, queryVector, options) {
        const { 
            limit, 
            vectorField, 
            distanceMeasure, 
            distanceResultField, 
            distanceThreshold, 
            where // The `where` filter, formatted for StructuredQuery
        } = options;

        if (!queryVector || !Array.isArray(queryVector) || queryVector.length === 0) {
             throw new Error("queryVector must be a non-empty array of numbers.");
        }

        const body = {
            structuredQuery: {
                from: [{ collectionId: fullPath }],
                // Optional: Include the 'where' filter for pre-filtering (e.g., status == 'published')
                ...(where && { where }), 
                
                // The main vector search configuration
                findNearest: {
                    vectorField: { fieldPath: vectorField },
                    queryVector: { 
                        Vector: {
                            values: queryVector.map(v => ({ doubleValue: v }))
                        }
                    },
                    distanceMeasure: distanceMeasure,
                    limit: limit,
                    ...(distanceResultField && { distanceResultField }),
                    // --- FIX IS HERE ---
                    ...(distanceThreshold !== undefined && { 
                        distanceThreshold: distanceThreshold // Pass the raw number
                    })
                }
            }
        };

        const results = await this.firestoreRequest('POST', ':runQuery', body);

        return results
            .filter(r => r.document)
            .map(r => ({
                id: r.document.name.split('/').pop(),
                ...this.fromFields(r.document.fields)
            }));
    }
    // --- END NEW METHOD ---

    // The addDoc method adds a new document to the collection at the specified path.
    async addDoc(fullPath, data) {
        // fullPath: e.g., 'users/user123/bookmarks'
        // The API automatically generates an ID.
        return this.firestoreRequest('POST', fullPath, { fields: this.toFields(data) });
    }

    // The setDoc method creates or overwrites a document at the specified path/ID.
    async setDoc(fullPath, docId, data) {
        // fullPath: e.g., 'users/user123/bookmarks'
        // docId: e.g., 'post456'
        return this.firestoreRequest('PATCH', `${fullPath}/${docId}`, { fields: this.toFields(data) });
    }

    // updateDoc and deleteDoc should also use the full collection path and docId.
    // They are already written to construct the path as `${collection}/${docId}`, 
    // so they will work as long as you pass the correct collection path.
    async updateDoc(fullPath, docId, data) {
        const queryParams = Object.keys(data).map(key => ['updateMask.fieldPaths', key]);
        const searchString = new URLSearchParams(queryParams).toString();

        return this.firestoreRequest(
            'PATCH',
            `${fullPath}/${docId}?${searchString}`, // fullPath/docId/
            { fields: this.toFields(data) }
        );
    }

    async deleteDoc(fullPath, docId) {
        return await this.firestoreRequest('DELETE', `${fullPath}/${docId}`);
    }

    async count(fullCollectionPath, whereField = null, whereOp = 'EQUAL', whereValue = null) {
        const body = {
            structuredAggregationQuery: {
                structuredQuery: {
                    // Use the full path for the collectionId
                    from: [{ collectionId: fullCollectionPath }]
                },
                aggregations: [
                    {
                        count: {},
                        alias: 'count_result'
                    }
                ]
            }
        };

        if (whereField && whereValue !== undefined) {
            const operator = whereOp.toUpperCase();


            if (operator === 'IN' || operator === 'NOT_IN') {
                if (!Array.isArray(whereValue)) {
                    throw new Error("Firestore 'IN' or 'NOT_IN' operator requires an array of values.");
                }

                const valuesArray = whereValue.map(v => this.toFields({ v }).v);

                body.structuredAggregationQuery.structuredQuery.where = {
                    inFilter: {
                        field: { fieldPath: whereField },
                        op: operator, // 'IN' or 'NOT_IN'
                        values: valuesArray
                    }
                };

            }
            else {
                const filterValue = this.toFields({ val: whereValue }).val;

                body.structuredAggregationQuery.structuredQuery.where = {
                    fieldFilter: {
                        field: { fieldPath: whereField },
                        op: operator, // e.g., 'EQUAL', 'NOT_EQUAL'
                        value: filterValue
                    }
                };
            }
        }
        // --- End Filtering Logic ---

        const res = await this.firestoreRequest('POST', `:runAggregationQuery`, body);

        // Correct response parsing: nested under 'result' and using the alias 'count_result'
        const countValue = res[0]?.result?.aggregateFields?.count_result?.integerValue;

        return parseInt(countValue || 0);
    }
}