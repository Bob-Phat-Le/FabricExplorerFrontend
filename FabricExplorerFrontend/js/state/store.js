export const connections = {
    allConnections: [],
    activeConnection: null
};
export const fabricItems = [];
export const jobInstancesData = [];

export const replState = {
    database: 'CustomerMirror',
    schema: 'dbo',
    table: 'Customers',

    autoMetadata: true,

    primaryKeys: [
        'CustomerId'
    ],

    payloadFormat: 'Parquet',

    rowMarkerEnabled: true,

    sourceField: 'UpdatedAt',

    changeTypes: [
        'Insert',
        'Update'
    ]
};

export const formState = {
    hasFile: false,

    fileName: 'customers.csv',
    fileSize: '24.8 MB',
    fileType: 'CSV',

    uploadMode: 'Overwrite',

    payloadFormat: 'CSV',

    csvHeader: true,
    csvDelimiter: ',',

    ingestToTable: true,

    targetTable: 'Customers',
    tableLoadMode: 'Append',

    postLoadAction: 'Archive',
    archivePath: '/archive/customers/'
};

export const connectionEditingState = {
    isEdit: false,
    connId: null
};

export function setState(updates) {
    Object.assign(state, updates);
}

export function replaceContents(target, next) {
    target.splice(
        0,
        target.length,
        ...(next ?? [])
    );
}

export const createItemState = {
    selectedType: 'Lakehouse',
    step: 1
};