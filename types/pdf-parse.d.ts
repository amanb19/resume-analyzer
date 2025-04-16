declare module 'pdf-parse' {
    interface PDFParseResult {
        text: string;
    }

    function pdf(buffer: Buffer): Promise<PDFParseResult>;
    export = pdf;
}
