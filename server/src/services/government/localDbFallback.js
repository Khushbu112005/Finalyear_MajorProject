const { services: localServices, sources: localSources } = require("../../data/governmentSeedData");
const findServices = (filter = {}) => localServices.filter(s => (!filter.verificationStatus?.$ne || s.verificationStatus !== filter.verificationStatus.$ne) && (!filter.categories?.$in || filter.categories.$in.some(c => s.categories.includes(c))) && (!filter.$or || !filter.$or.some(x => x.state) || s.jurisdiction === "central" || s.jurisdiction === "All" || filter.$or.some(x => x.state === s.state)) && (!filter.department || s.department === filter.department) && (!filter.serviceType || s.serviceType === filter.serviceType));
const findServiceById = id => localServices.find(s => s._id === id || s.serviceId === id) || null;
const findSources = (filter = {}) => filter.sourceId?.$in ? localSources.filter(s => filter.sourceId.$in.includes(s.sourceId)) : [...localSources];
const findSourceById = id => localSources.find(s => s.sourceId === id) || null;
const getDistinct = field => [...new Set(localServices.flatMap(s => Array.isArray(s[field]) ? s[field] : s[field] ? [s[field]] : []))];
module.exports = { localServices, localSources, findServices, findServiceById, findSources, findSourceById, getDistinct };
