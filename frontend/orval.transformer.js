/**
 * Orval custom transformer to fix file upload type definitions
 * Converts old Swagger 2.0 "type: file" to OpenAPI 3.x format
 */

module.exports = (spec) => {
    console.log('🔧 Running custom Orval transformer...');

    // Traverse all paths and fix file upload schemas
    if (spec.paths) {
        Object.keys(spec.paths).forEach((path) => {
            const pathItem = spec.paths[path];

            Object.keys(pathItem).forEach((method) => {
                if (method === 'parameters') return; // Skip path-level parameters

                const operation = pathItem[method];

                // Check for requestBody with multipart/form-data
                if (
                    operation.requestBody &&
                    operation.requestBody.content &&
                    operation.requestBody.content['multipart/form-data']
                ) {
                    const mediaType = operation.requestBody.content['multipart/form-data'];

                    // Check if schema has type: "file" (old Swagger 2.0 format)
                    if (mediaType.schema && mediaType.schema.type === 'file') {
                        console.log(`  ✓ Fixed ${method.toUpperCase()} ${path}`);

                        // Replace with proper OpenAPI 3.x schema
                        mediaType.schema = {
                            type: 'object',
                            properties: {
                                file: {
                                    type: 'string',
                                    format: 'binary',
                                    description: 'File to upload'
                                }
                            },
                            required: ['file']
                        };
                    }
                }
            });
        });
    }

    console.log('✨ Transformer completed\n');
    return spec;
};
