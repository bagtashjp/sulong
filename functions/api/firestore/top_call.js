import jwt from 'jsonwebtoken';
export default class FirestoreRest {
    constructor(env) {
        this.projectId = env.FIRESTORE_PROJECT_ID;
        this.clientEmail = env.FIRESTORE_CLIENT_EMAIL;
        this.privateKey = env.FIRESTORE_PRIVATE_KEY.replace(/\\n/g, '\n');
        this.tokenCache = null;
        this.tokenExpiry = 0;
    }

    async getAccessToken() {
        const now = Math.floor(Date.now() / 1000);
        if (this.tokenCache && now < this.tokenExpiry - 60) return this.tokenCache;

        const payload = {
            iss: this.clientEmail,
            scope: "https://www.googleapis.com/auth/datastore",
            aud: "https://oauth2.googleapis.com/token",
            iat: now,
            exp: now + 3600
        };

        const token = jwt.sign(payload, this.privateKey, { algorithm: "RS256" });

        const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: token
            })
        });

        const data = await res.json();
        this.tokenCache = data.access_token;
        this.tokenExpiry = now + data.expires_in;
        return this.tokenCache;
    }

    getBaseUrl() {
        return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
    }

    toFields(obj) {
        const fields = {};
        for (const key in obj) {
            const val = obj[key];
            if (typeof val === "string") fields[key] = { stringValue: val };
            else if (typeof val === "number") fields[key] = { integerValue: val };
            else if (val instanceof Date) fields[key] = { timestampValue: val.toISOString() };
            else if (val?.latitude && val?.longitude) fields[key] = { geoPointValue: val };
            else if (val === null) fields[key] = { nullValue: null };
            else if (typeof val === "boolean") fields[key] = { booleanValue: val };
            else fields[key] = { stringValue: JSON.stringify(val) }; // fallback
        }
        return fields;
    }

    async getDoc(collection, docId) {
        const token = await this.getAccessToken();
        const res = await fetch(`${this.getBaseUrl()}/${collection}/${docId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return { id: docId, ...this.fromFields(data.fields) };
    }

    async getDocs(collection, queryBody = {}) {
        const token = await this.getAccessToken();
        const url = `${this.getBaseUrl()}/${collection}:runQuery`;
        const body = {
            structuredQuery: {
                from: [{ collectionId: collection }],
                ...queryBody
            }
        };
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const results = await res.json();
        return results
            .filter(r => r.document)
            .map(r => ({
                id: r.document.name.split("/").pop(),
                ...this.fromFields(r.document.fields)
            }));
    }

    async setDoc(collection, docId, data) {
        const token = await this.getAccessToken();
        const res = await fetch(`${this.getBaseUrl()}/${collection}/${docId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ fields: this.toFields(data) })
        });
        return await res.json();
    }

    async addDoc(collection, data) {
        const token = await this.getAccessToken();
        const res = await fetch(`${this.getBaseUrl()}/${collection}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ fields: this.toFields(data) })
        });
        return await res.json();
    }

    async updateDoc(collection, docId, data) {
        return this.setDoc(collection, docId, data);
    }

    async deleteDoc(collection, docId) {
        const token = await this.getAccessToken();
        return fetch(`${this.getBaseUrl()}/${collection}/${docId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    async count(collection, whereField = null, whereValue = null) {
        const token = await this.getAccessToken();
        const body = {
            structuredAggregationQuery: {
                aggregation: { count: {} },
                query: {
                    from: [{ collectionId: collection }]
                }
            }
        };
        if (whereField && whereValue !== undefined) {
            body.structuredAggregationQuery.query.where = {
                fieldFilter: {
                    field: { fieldPath: whereField },
                    op: "EQUAL",
                    value: { stringValue: whereValue }
                }
            };
        }

        const res = await fetch(`${this.getBaseUrl()}:runAggregationQuery`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        return parseInt(data[0]?.aggregateFields?.count?.integerValue || 0);
    }

    // Converts Firestore REST fields back to JS object
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
            else obj[key] = null;
        }
        return obj;
    }
}
