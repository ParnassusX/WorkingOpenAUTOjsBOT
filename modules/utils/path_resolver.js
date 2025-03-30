/**
 * Path Resolver Utility for OpenAutoJS
 * 
 * Provides functions to resolve module paths correctly regardless of execution context
 */

// Base path for the emulator environment
var emulatorBasePath = "/storage/emulated/0/SubwayBot/";

module.exports = {
    /**
     * Resolves a module path to an absolute path
     * @param {string} relativePath - Relative path to the module
     * @param {string} basePath - Optional base path override
     * @return {string} Absolute path to the module
     */
    resolveModulePath: function(relativePath, basePath) {
        // Use provided base path or default to emulator base path
        var base = basePath || emulatorBasePath;
        
        // Handle paths that are already absolute
        if (relativePath.startsWith('/')) {
            return relativePath;
        }
        
        // Handle relative paths
        if (relativePath.startsWith('./')) {
            relativePath = relativePath.substring(2);
        }
        
        // Ensure base path ends with a slash
        if (!base.endsWith('/')) {
            base += '/';
        }
        
        return base + relativePath;
    },
    
    /**
     * Gets the absolute path for a module in the testing directory
     * @param {string} moduleName - Name of the module file
     * @return {string} Absolute path to the module
     */
    getTestingModulePath: function(moduleName) {
        return this.resolveModulePath('modules/testing/' + moduleName);
    },
    
    /**
     * Gets the absolute path for a module in the modules directory
     * @param {string} moduleName - Name of the module file
     * @return {string} Absolute path to the module
     */
    getModulePath: function(moduleName) {
        return this.resolveModulePath('modules/' + moduleName);
    },
    
    /**
     * Gets the base path for the project
     * @return {string} Base path for the project
     */
    getBasePath: function() {
        return emulatorBasePath;
    },
    
    /**
     * Sets the base path for the project
     * @param {string} newBasePath - New base path to use
     */
    setBasePath: function(newBasePath) {
        if (newBasePath && typeof newBasePath === 'string') {
            emulatorBasePath = newBasePath;
            if (!emulatorBasePath.endsWith('/')) {
                emulatorBasePath += '/';
            }
        }
    }
};