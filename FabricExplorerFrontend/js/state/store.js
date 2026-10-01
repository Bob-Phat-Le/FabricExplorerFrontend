// Shared UI state. Các mảng được giữ nguyên tham chiếu (const) và thay nội dung bằng replaceContents()
// để mọi module đang import đều thấy dữ liệu mới sau khi gọi API.
// export const savedConnections = [];   // GET /connections
// export const fabricItems = [];        // GET /items
// export const jobInstancesData = [];   // GET /items/:id/jobs

// export const replState = {
//     database: 'CustomerMirror',
//     schema: 'dbo',
//     table: 'Customers',
//     autoMetadata: true,
//     primaryKeys: ['CustomerId'],
//     payloadFormat: 'Parquet',
//     rowMarkerEnabled: true,
//     sourceField: 'UpdatedAt',
//     changeTypes: ['Insert', 'Update']
// };

// export const formState = {
//     hasFile: false,
//     fileName: 'customers.csv',
//     fileSize: '24.8 MB',
//     fileType: 'CSV',
//     uploadMode: 'Overwrite',
//     payloadFormat: 'CSV',
//     csvHeader: true,
//     csvDelimiter: ',',
//     ingestToTable: true,
//     targetTable: 'Customers',
//     tableLoadMode: 'Append',
//     postLoadAction: 'Archive',
//     archivePath: '/archive/customers/'
// };

// export const oauthModalState = {
//     isEdit: false,
//     connId: null,
// }

// export const createItemState = { selectedType: 'Lakehouse', step: 1 };

// export function replaceContents(arr, next) { arr.splice(0, arr.length, ...(next || [])); }
// export function getActiveConnection() { return savedConnections.find(c => c.isActive) || savedConnections[0] || null; }



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