var fileRegEx = /\.[^\.]*?$/i;

class PathResolver {
    private _folderDelimiter;
    private _path: string;
    constructor(path: string, options?) {
        options = options || {};

        if (typeof path !== "string") {
            throw new Error();
        }

        this._folderDelimiter = options.folderDelimiter || "/";
        this._path = path;
    }

    private _removeFileFromPath() {
        var path = this._path;
        var pathParts = path.split(this._folderDelimiter);
        var lastDirectory = pathParts[pathParts.length - 1];

        var value = lastDirectory.match(fileRegEx);

        if (value) {
            pathParts.pop();
        }

        return pathParts.join(this._folderDelimiter);
    };

    private _addLastSlashIfNeeded(path) {
        if (path.lastIndexOf(this._folderDelimiter) !== path.length - 1) {
            path += this._folderDelimiter;
        }

        return path;
    }

    private _removeFirstSlashIfNeeded(path) {
        if (path.indexOf(this._folderDelimiter) === 0) {
            path = path.substring(1);
        }

        return path;
    }

    private _resolveLocalRelativePath(toPath) {
        if (toPath.indexOf("." + this._folderDelimiter) === 0) {
            toPath = toPath.substring(2);
        }

        return toPath;
    }

    private _resolveParentRelativePath(toPath) {
        var pathParts = this._path.split(this._folderDelimiter);
        var toPathParts = toPath.split(this._folderDelimiter);

        while (toPathParts[0] === "..") {
            pathParts.pop();
            toPathParts.shift();
        }

        var root = this._addLastSlashIfNeeded(pathParts.join(this._folderDelimiter));
        root = root === "" ? this._folderDelimiter : root;

        toPath = this._removeFirstSlashIfNeeded(toPathParts.join(this._folderDelimiter));
        this._path = root + toPath;

        return this._path;
    }

    resolve(toPath) {
        if (toPath.substring(0, 1) === this._folderDelimiter) {
            return this._path = toPath;
        }

        this._path = this._removeFileFromPath();

        toPath = this._resolveLocalRelativePath(toPath);
        return this._resolveParentRelativePath(toPath);

    }

    toString() {
        return this._path;
    }

    getPath() {
        return this._path;
    }

    setPath(value) {
        if (typeof value === "string") {
            this._path = value;
        }
    }
}

export = PathResolver;


    
