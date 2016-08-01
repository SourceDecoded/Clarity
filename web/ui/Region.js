class Region {
    constructor(t, r, b, l) {
        this.setRegion(t, r, b, l);
    }
    contains(region) {
        return (region.left >= this.left &&
            region.right <= this.right &&
            region.top >= this.top &&
            region.bottom <= this.bottom);
    }
    getArea() {
        return ((this.bottom - this.top) * (this.right - this.left));
    }
    intersect(region) {
        var t = Math.max(this.top, region.top), r = Math.min(this.right, region.right), b = Math.min(this.bottom, region.bottom), l = Math.max(this.left, region.left);
        if (b >= t && r >= l) {
            return new Region(t, r, b, l);
        }
        else {
            return null;
        }
    }
    setTop(val) {
        if (typeof val === "number" && this.bottom >= val) {
            var oldValue = this.top;
            this.setRegion(val, this.right, this.bottom, this.left);
        }
    }
    setRight(val) {
        if (typeof val === "number" && val >= this.left) {
            this.setRegion(this.top, val, this.bottom, this.left);
        }
    }
    setBottom(val) {
        if (typeof val === "number" && val >= this.top) {
            this.setRegion(this.top, this.right, val, this.left);
        }
    }
    setLeft(val) {
        if (typeof val === "number" && this.right >= val) {
            this.setRegion(this.top, this.right, this.bottom, val);
        }
    }
    setX(x) {
        return this.setLeft(x);
    }
    setY(y) {
        return this.setTop(y);
    }
    setWidth(val) {
        if (typeof val === "number" && val >= 0) {
            this.setRegion(this.top, this.left + val, this.bottom, this.left);
        }
    }
    setHeight(val) {
        if (typeof val === "number" && val >= 0) {
            this.setRegion(this.top, this.right, this.top + val, this.left);
        }
    }
    setRegionTo(region) {
        var oldTopValue = this.top;
        var oldLeftValue = this.left;
        var oldRightValue = this.right;
        var oldBottomValue = this.bottom;
        var oldWidthValue = this.width;
        var oldHeightValue = this.height;
        this.setRegion(region.top, region.right, region.bottom, region.left);
    }
    setRegion(top, right, bottom, left) {
        if (bottom >= top && right >= left) {
            this.top = top;
            this.y = top;
            this[1] = top;
            this.right = right;
            this.bottom = bottom;
            this.left = left;
            this.x = left;
            this[0] = left;
            this.width = this.right - this.left;
            this.height = this.bottom - this.top;
        }
        else {
            throw new Error("Invalid Region Instantiation: top=" + top + ", right=" + right + ", bottom=" + bottom + ", left=" + left + ".");
        }
    }
    moveToPoint(x, y) {
        this.setRegion(y, x + this.width, y + this.height, x);
    }
    union(region) {
        var t = Math.min(this.top, region.top), r = Math.max(this.right, region.right), b = Math.max(this.bottom, region.bottom), l = Math.min(this.left, region.left);
        return new Region(t, r, b, l);
    }
    equals(region) {
        return (region.top === this.top && region.right === this.right && region.bottom === this.bottom && region.left === this.left) ? true : false;
    }
    toString() {
        return ("Region {" +
            "top: " + this.top +
            ", right: " + this.right +
            ", bottom: " + this.bottom +
            ", left: " + this.left +
            ", height: " + this.height +
            ", width: " + this.width +
            "}");
    }
    copy() {
        return new Region(this.top, this.right, this.bottom, this.left);
    }
}
//# sourceMappingURL=Region.js.map