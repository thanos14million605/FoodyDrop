
exports.applyFiltering = (query, queryString) => {
    const queryObj = {...queryString};
    const excludedFields = ['limit', 'sort', 'page', 'field', 'fields'];

    excludedFields.forEach((el) => delete queryObj[el]);
    
    const queryProperties = Object.keys(queryObj);

    const mongoQuery = {};
    queryProperties.forEach(key => {
        if (key.includes('[')) {
            const [field, value] = key.replace(']', '').split('[');
            const operator = `$${value}`;

            if (mongoQuery[field]) {
                // We check for number, example for price field. VIP
                mongoQuery[field][operator] = isNaN(queryObj[key]) ? queryObj[key] : Number(queryObj[key]);
            } else { 
                mongoQuery[field] = { [operator]: isNaN(queryObj[key]) ? queryObj[key] : Number(queryObj[key]) };
            }

        } else {
            mongoQuery[key] = isNaN(queryObj[key]) ? queryObj[key] : Number(queryObj[key]);
        }
    });
    console.log(mongoQuery);

    return query.find(mongoQuery);
};

exports.applyFieldLimiting = (query, queryString) => {
    if (queryString.fields) {
        const fieldsLimited = queryString.fields.split(',').join(' ');
        return query.select(fieldsLimited);
    } else {
        return query;
    }
};

exports.applySorting = (query, queryString) => {
    if (queryString.sort) {
        const sortBy = queryString.sort.split(',').join(' ');
        return query.sort(sortBy);
    } else {
        return query;
    }
};

exports.applyPagination = (query, queryString) => {
    const page = Number(queryString.page) || 1;
    const limit = Number(queryString.limit) || 4;
    const skip = (page - 1) * limit;

    return query.skip(skip).limit(limit);
};