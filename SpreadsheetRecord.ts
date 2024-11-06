type SpreadsheetRecord<TRecord> = TRecord & {
    createdAt: Date;
    updatedAt: Date;
};
