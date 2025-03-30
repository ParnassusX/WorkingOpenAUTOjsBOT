/**
 * Duplicate Detection Utility for Subway Surfers Bot
 * Helps identify potential code duplication across modules
 * 
 * This utility provides functions to detect similar code patterns,
 * function signatures, and implementation duplications to maintain
 * code quality as the project grows.
 */

module.exports = {
    /**
     * Configuration for duplicate detection
     */
    config: {
        // Similarity threshold for considering code as duplicate (0.0-1.0)
        similarityThreshold: 0.8,
        
        // Minimum line count to consider for duplication analysis
        minLineCount: 5,
        
        // File extensions to analyze
        fileExtensions: [".js"],
        
        // Directories to exclude from analysis
        excludeDirs: ["node_modules", ".git"],
        
        // Enable function signature comparison
        compareFunctionSignatures: true,
        
        // Enable content similarity analysis
        compareContentSimilarity: true
    },
    
    /**
     * Initializes the duplicate detector with custom configuration
     * @param {Object} customConfig - Optional custom configuration
     */
    initialize: function(customConfig) {
        console.log("Initializing duplicate detection utility...");
        
        // Merge custom config if provided
        if (customConfig) {
            for (var key in customConfig) {
                if (this.config.hasOwnProperty(key)) {
                    this.config[key] = customConfig[key];
                }
            }
        }
        
        console.log("Duplicate detection utility initialized");
    },
    
    /**
     * Analyzes a directory for potential code duplications
     * @param {string} basePath - Base directory path to analyze
     * @param {boolean} recursive - Whether to analyze subdirectories
     * @return {Array} List of potential duplications found
     */
    analyzeDirectory: function(basePath, recursive) {
        console.log("Analyzing directory for duplications: " + basePath);
        
        var results = [];
        var fileContents = {};
        var fileList = [];
        
        try {
            // Get list of files to analyze
            fileList = this.getFileList(basePath, recursive);
            console.log("Found " + fileList.length + " files to analyze");
            
            // Read file contents
            for (var i = 0; i < fileList.length; i++) {
                var filePath = fileList[i];
                try {
                    var content = files.read(filePath);
                    fileContents[filePath] = content;
                } catch (e) {
                    console.error("Error reading file " + filePath + ": " + e.message);
                }
            }
            
            // Compare files for duplications
            results = this.compareFiles(fileContents);
            
            console.log("Analysis complete. Found " + results.length + " potential duplications");
        } catch (e) {
            console.error("Error analyzing directory: " + e.message);
        }
        
        return results;
    },
    
    /**
     * Gets a list of files to analyze from a directory
     * @param {string} basePath - Base directory path
     * @param {boolean} recursive - Whether to include subdirectories
     * @return {Array} List of file paths
     */
    getFileList: function(basePath, recursive) {
        var fileList = [];
        
        try {
            var files = this.listFiles(basePath);
            
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var filePath = basePath + "/" + file;
                
                // Check if it's a directory
                if (this.isDirectory(filePath)) {
                    // Skip excluded directories
                    if (this.config.excludeDirs.indexOf(file) !== -1) {
                        continue;
                    }
                    
                    // Process subdirectory if recursive is enabled
                    if (recursive) {
                        var subFiles = this.getFileList(filePath, recursive);
                        fileList = fileList.concat(subFiles);
                    }
                } else {
                    // Check file extension
                    var extension = this.getFileExtension(file);
                    if (this.config.fileExtensions.indexOf(extension) !== -1) {
                        fileList.push(filePath);
                    }
                }
            }
        } catch (e) {
            console.error("Error getting file list: " + e.message);
        }
        
        return fileList;
    },
    
    /**
     * Lists files in a directory
     * @param {string} dirPath - Directory path
     * @return {Array} List of file names
     */
    listFiles: function(dirPath) {
        try {
            return files.listDir(dirPath);
        } catch (e) {
            console.error("Error listing directory " + dirPath + ": " + e.message);
            return [];
        }
    },
    
    /**
     * Checks if a path is a directory
     * @param {string} path - Path to check
     * @return {boolean} True if path is a directory
     */
    isDirectory: function(path) {
        try {
            return files.isDir(path);
        } catch (e) {
            return false;
        }
    },
    
    /**
     * Gets the file extension from a filename
     * @param {string} filename - Filename to check
     * @return {string} File extension including the dot
     */
    getFileExtension: function(filename) {
        var dotIndex = filename.lastIndexOf(".");
        if (dotIndex === -1) return "";
        return filename.substring(dotIndex);
    },
    
    /**
     * Compares files for potential duplications
     * @param {Object} fileContents - Map of file paths to contents
     * @return {Array} List of potential duplications
     */
    compareFiles: function(fileContents) {
        var results = [];
        var filePaths = Object.keys(fileContents);
        
        // Compare each file with every other file
        for (var i = 0; i < filePaths.length; i++) {
            var fileA = filePaths[i];
            var contentA = fileContents[fileA];
            
            for (var j = i + 1; j < filePaths.length; j++) {
                var fileB = filePaths[j];
                var contentB = fileContents[fileB];
                
                // Compare function signatures if enabled
                if (this.config.compareFunctionSignatures) {
                    var signatureDupes = this.compareFunctionSignatures(fileA, contentA, fileB, contentB);
                    results = results.concat(signatureDupes);
                }
                
                // Compare content similarity if enabled
                if (this.config.compareContentSimilarity) {
                    var contentDupes = this.compareContentSimilarity(fileA, contentA, fileB, contentB);
                    results = results.concat(contentDupes);
                }
            }
        }
        
        return results;
    },
    
    /**
     * Compares function signatures between two files
     * @param {string} fileA - First file path
     * @param {string} contentA - First file content
     * @param {string} fileB - Second file path
     * @param {string} contentB - Second file content
     * @return {Array} List of duplicate function signatures
     */
    compareFunctionSignatures: function(fileA, contentA, fileB, contentB) {
        var results = [];
        
        try {
            // Extract function signatures from both files
            var signaturesA = this.extractFunctionSignatures(contentA);
            var signaturesB = this.extractFunctionSignatures(contentB);
            
            // Compare signatures
            for (var i = 0; i < signaturesA.length; i++) {
                var sigA = signaturesA[i];
                
                for (var j = 0; j < signaturesB.length; j++) {
                    var sigB = signaturesB[j];
                    
                    // Check if signatures match
                    if (this.signatureMatches(sigA.signature, sigB.signature)) {
                        results.push({
                            type: "function_signature",
                            fileA: fileA,
                            fileB: fileB,
                            lineA: sigA.line,
                            lineB: sigB.line,
                            signature: sigA.signature,
                            confidence: 1.0
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Error comparing function signatures: " + e.message);
        }
        
        return results;
    },
    
    /**
     * Extracts function signatures from file content
     * @param {string} content - File content
     * @return {Array} List of function signatures with line numbers
     */
    extractFunctionSignatures: function(content) {
        var signatures = [];
        var lines = content.split("\n");
        
        // Regular expressions for function detection
        var functionRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/g;
        var methodRegex = /([a-zA-Z0-9_$]+)\s*:\s*function\s*\(([^)]*)\)/g;
        var arrowRegex = /([a-zA-Z0-9_$]+)\s*=\s*\(?([^)]*)\)?\s*=>/g;
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var lineNumber = i + 1;
            
            // Check for standard functions
            var funcMatches = line.matchAll(functionRegex);
            for (var match of funcMatches) {
                signatures.push({
                    signature: match[1] + "(" + match[2] + ")",
                    line: lineNumber
                });
            }
            
            // Check for object methods
            var methodMatches = line.matchAll(methodRegex);
            for (var match of methodMatches) {
                signatures.push({
                    signature: match[1] + "(" + match[2] + ")",
                    line: lineNumber
                });
            }
            
            // Check for arrow functions
            var arrowMatches = line.matchAll(arrowRegex);
            for (var match of arrowMatches) {
                signatures.push({
                    signature: match[1] + "(" + match[2] + ")",
                    line: lineNumber
                });
            }
        }
        
        return signatures;
    },
    
    /**
     * Checks if two function signatures match
     * @param {string} sigA - First signature
     * @param {string} sigB - Second signature
     * @return {boolean} True if signatures match
     */
    signatureMatches: function(sigA, sigB) {
        // Remove whitespace and compare
        var normA = sigA.replace(/\s+/g, "");
        var normB = sigB.replace(/\s+/g, "");
        return normA === normB;
    },
    
    /**
     * Compares content similarity between two files
     * @param {string} fileA - First file path
     * @param {string} contentA - First file content
     * @param {string} fileB - Second file path
     * @param {string} contentB - Second file content
     * @return {Array} List of similar content blocks
     */
    compareContentSimilarity: function(fileA, contentA, fileB, contentB) {
        var results = [];
        
        try {
            // Split content into blocks
            var blocksA = this.splitIntoBlocks(contentA);
            var blocksB = this.splitIntoBlocks(contentB);
            
            // Compare blocks for similarity
            for (var i = 0; i < blocksA.length; i++) {
                var blockA = blocksA[i];
                
                // Skip blocks that are too small
                if (blockA.lines.length < this.config.minLineCount) {
                    continue;
                }
                
                for (var j = 0; j < blocksB.length; j++) {
                    var blockB = blocksB[j];
                    
                    // Skip blocks that are too small
                    if (blockB.lines.length < this.config.minLineCount) {
                        continue;
                    }
                    
                    // Calculate similarity
                    var similarity = this.calculateSimilarity(blockA.lines, blockB.lines);
                    
                    // If similarity exceeds threshold, report as potential duplication
                    if (similarity >= this.config.similarityThreshold) {
                        results.push({
                            type: "content_similarity",
                            fileA: fileA,
                            fileB: fileB,
                            startLineA: blockA.startLine,
                            endLineA: blockA.endLine,
                            startLineB: blockB.startLine,
                            endLineB: blockB.endLine,
                            similarity: similarity
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Error comparing content similarity: " + e.message);
        }
        
        return results;
    },
    
    /**
     * Splits file content into logical blocks
     * @param {string} content - File content
     * @return {Array} List of code blocks with line numbers
     */
    splitIntoBlocks: function(content) {
        var blocks = [];
        var lines = content.split("\n");
        var currentBlock = null;
        var bracketCount = 0;
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            var lineNumber = i + 1;
            
            // Skip empty lines and comments
            if (line === "" || line.startsWith("//") || line.startsWith("/*")) {
                continue;
            }
            
            // Start a new block on function declaration or object definition
            if (line.includes("function") || line.includes("= {") || line.includes(": {")) {
                // If we were already in a block, finish it
                if (currentBlock !== null) {
                    blocks.push(currentBlock);
                }
                
                // Start a new block
                currentBlock = {
                    startLine: lineNumber,
                    endLine: lineNumber,
                    lines: [line]
                };
                
                // Count opening brackets
                bracketCount += (line.match(/{/g) || []).length;
                bracketCount -= (line.match(/}/g) || []).length;
            } else if (currentBlock !== null) {
                // Add line to current block
                currentBlock.lines.push(line);
                currentBlock.endLine = lineNumber;
                
                // Count brackets
                bracketCount += (line.match(/{/g) || []).length;
                bracketCount -= (line.match(/}/g) || []).length;
                
                // If bracket count reaches 0, end the block
                if (bracketCount === 0 && line.includes("}")) {
                    blocks.push(currentBlock);
                    currentBlock = null;
                }
            }
        }
        
        // Add the last block if not closed
        if (currentBlock !== null) {
            blocks.push(currentBlock);
        }
        
        return blocks;
    },
    
    /**
     * Calculates similarity between two sets of lines
     * @param {Array} linesA - First set of lines
     * @param {Array} linesB - Second set of lines
     * @return {number} Similarity score (0.0-1.0)
     */
    calculateSimilarity: function(linesA, linesB) {
        // Simple implementation using Jaccard similarity
        var setA = new Set();
        var setB = new Set();
        
        // Normalize and add lines to sets
        for (var i = 0; i < linesA.length; i++) {
            setA.add(this.normalizeLine(linesA[i]));
        }
        
        for (var j = 0; j < linesB.length; j++) {
            setB.add(this.normalizeLine(linesB[j]));
        }
        
        // Calculate intersection size
        var intersection = 0;
        setA.forEach(function(item) {
            if (setB.has(item)) {
                intersection++;
            }
        });
        
        // Calculate union size
        var union = setA.size + setB.size - intersection;
        
        // Return Jaccard similarity
        return union === 0 ? 0 : intersection / union;
    },
    
    /**
     * Normalizes a line for comparison
     * @param {string} line - Line to normalize
     * @return {string} Normalized line
     */
    normalizeLine: function(line) {
        // Remove whitespace, comments, and variable names
        return line
            .replace(/\s+/g, "")
            .replace(/\/\/.*$/g, "")
            .replace(/\/\*.*\*\//g, "")
            .replace(/var\s+[a-zA-Z0-9_$]+/g, "var")
            .replace(/let\s+[a-zA-Z0-9_$]+/g, "let")
            .replace(/const\s+[a-zA-Z0-9_$]+/g, "const");
    },
    
    /**
     * Generates a report of duplications
     * @param {Array} duplications - List of duplications
     * @return {string} Formatted report
     */
    generateReport: function(duplications) {
        var report = "Duplicate Detection Report\n";
        report += "===========================\n\n";
        report += "Found " + duplications.length + " potential duplications\n\n";
        
        // Group by type
        var byType = {};
        for (var i = 0; i < duplications.length; i++) {
            var dupe = duplications[i];
            if (!byType[dupe.type]) {
                byType[dupe.type] = [];
            }
            byType[dupe.type].push(dupe);
        }
        
        // Report function signature duplications
        if (byType.function_signature) {
            report += "Function Signature Duplications: " + byType.function_signature.length + "\n";
            report += "-----------------------------------\n";
            
            for (var j = 0; j < byType.function_signature.length; j++) {
                var sig = byType.function_signature[j];
                report += "Signature: " + sig.signature + "\n";
                report += "  File A: " + sig.fileA + " (line " + sig.lineA + ")\n";
                report += "  File B: " + sig.fileB + " (line " + sig.lineB + ")\n\n";
            }
        }
        
        // Report content similarity duplications
        if (byType.content_similarity) {
            report += "Content Similarity Duplications: " + byType.content_similarity.length + "\n";
            report += "-----------------------------------\n";
            
            for (var k = 0; k < byType.content_similarity.length; k++) {
                var sim = byType.content_similarity[k];
                report += "Similarity: " + (sim.similarity * 100).toFixed(2) + "%\n";
                report += "  File A: " + sim.fileA + " (lines " + sim.startLineA + "-" + sim.endLineA + ")\n";
                report += "  File B: " + sim.fileB + " (lines " + sim.startLineB + "-" + sim.endLineB + ")\n\n";
            }
        }
        
        return report;
    },
    
    /**
     * Saves a duplication report to a file
     * @param {Array} duplications - List of duplications
     * @param {string} outputPath - Path to save the report
     * @return {boolean} Success status
     */
    saveReport: function(duplications, outputPath) {
        try {
            var report = this.generateReport(duplications);
            files.write(outputPath, report);
            console.log("Duplication report saved to: " + outputPath);
            return true;
        } catch (e) {
            console.error("Error saving duplication report: " + e.message);
            return false;
        }
    }
};