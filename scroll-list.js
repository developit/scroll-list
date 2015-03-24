/** @example
 *	var list = new ScrollList({
 *		// use `transform:translateY()` instead of `top` to offset contents?
 *		useTransforms : false,
 *		// debounce scroll events using requestAnimationFrame()?
 *		bufferedScrolling : true,
 *		// provide a DOM node to clone, used as a template for each row
 *		template : document.getElementById('#row-template')[0].content.firstElementChild
 *	});
 *	// insert the list into an element:
 *	list.insertInto(document.body);
 *	
 *  // generate and display 1,000,000 rows
 *  var mil = [];
 *  for (var i=1e6; i--; ) {
 *      mil[i] = {a:i+'a', b:i+'b', c:i+'c'};
 *  }
 *  list.setData(mil);
 */
function ScrollList(opts) {
    events.EventEmitter.call(this);
    this.cache = {};
    this.data = [];
    this.rows = [];
    util.extend(this, opts || {});
    
    var base = this.base = document.createElement('div'),
        evt = this.handleEvent.bind(this);
    base.className = 'scroll-list';
    base.addEventListener('scroll', this.scrolled.bind(this))
    this.proxyEvents.forEach(function(t) {
        base.addEventListener(t, evt);
    });

    this.height = document.createElement('div');
    this.height.className = 'height';
    base.appendChild(this.height);

    this.inner = document.createElement('div');
    this.inner.className = 'inner';
    base.appendChild(this.inner);
}

util.inherits(ScrollList, events.EventEmitter);

util.extend(ScrollList.prototype, {
    proxyEvents : [
        'click', 'mousedown', 'mouseup',
        'touchstart', 'touchend',
        'rightclick', 'contextmenu'
    ],

    setData : function(data) {
        this.cache = {};
        this.data = data;
        this.update();
    },

    resized : function() {
        this.cache = {};
        this.update();
    },

    render : function(data) {
        if (data) return this.setData(data);
        this.update();
    },

    scrolled : function() {
        var update = this._update;
        if (this.bufferedScrolling) {
            if (!this._update) {
                this._update = this.update.bind(this);
            }
            if (!this.scrollTimer) {
                this.scrollTimer = true;
                requestAnimationFrame(this._update);
            }
        }
        else {
            this.update();
        }
    },

    handleEvent : function(e) {
        var type = String(e.type).replace(/^on/g,''),
            t = e.target,
            r;
        do {
            if (t.rowData) {
                r = this.emit('row'+type, {
                    target : e.target,
                    currentTarget : t,
                    row : t,
                    data : t.rowData
                });
                if (!r) e.stopPropagation();
                return r;
            }
        } while( (t=t.parentNode) && t!==this.base );
    },

    createRow : function() {
        return this.template.cloneNode(true);
    },

    updateRow : function(el, data, index) {
        var even = index%2===0,
            i, child, tpl, d, c;
        if (this.markEven===true && el.classList.contains('selected')!==even) {
            el.classList[even?'add':'remove']('even');
        }
        if (el.classList.contains('selected')!==!!data.selected) {
            el.classList[data.selected?'add':'remove']('selected');
        }
        for (i=el.children.length; i--; ) {
            child = el.children[i];
            tpl = child.getAttribute('tpl');
            if (tpl) {
                d = data[tpl];
                if (d===null || d===undefined) d='';
                if (d!==child._text) {
                    child._text = d;
                    c = child.firstChild;
                    if (c) {
                        c.textContent = d;
                    }
                    else {
                        child.textContent = d;
                    }
                }
            }
        }
    },

    insertInto : function(parent) {
        parent.appendChild(this.base);
    },

    rowHeight : function() {
        return (this.rows[0] || this.createRow()).offsetHeight;
    },

    _createRow : function() {
        var el = this.createRow();
        this.rows.push(el);
        this.inner.appendChild(el);
        return el;
    },

    update : function() {
        var b = this.base,
            resultSet = this.inner,
            dataHeight = this.height,
            empty = {},
            cache = this.cache,
            st = b.scrollTop || 0,
            rh = cache.rh || (cache.rh = this.rowHeight() || 1),
            innerHeight = cache.ih || (cache.ih = resultSet.offsetHeight),
            index = Math.floor(st / rh),
            numDisplayed = Math.floor(innerHeight/rh)+1,
            len = this.data.length,
            max = Math.ceil( Math.min(Math.max(0, len), numDisplayed) ),
            startOffset = 0,
            endOffset = 0,
            indexChange, dataHeightHeight, resultSetTop,
            i, rowEl, row, col, p, v, even;
        
        this.scrollTimer = null;

        if (index<(len-numDisplayed-3)) {
            numDisplayed += 1;
        }
        
        if (typeof this.lastIndex==='number') {
            indexChange = index - this.lastIndex;
            if (indexChange>0 && indexChange<numDisplayed/4) {
                for (i=indexChange; i--; ) {
                    p = this.rows.splice(0, 1)[0];
                    resultSet.appendChild(p);
                    this.rows.push(p);
                }
            }
            if (indexChange<0 && -indexChange<numDisplayed/4) {
                for (i=indexChange; i++; ) {
                    p = this.rows.pop();
                    resultSet.insertBefore(p, resultSet.childNodes[0]);
                    this.rows.splice(0, 0, p);
                }
            }
        }
        
        if (index!==this.lastIndex) {
            if (this.indexChangedCallback) {
                this.indexChangedCallback(index, this.lastIndex);
            }
            else {
                this.emit('indexchange', index, this.lastIndex);
            }
            this.lastIndex = index;
        }
        
        dataHeightHeight = rh*len;
        if (dataHeight._height!==rh*len) {
            dataHeight._height = dataHeightHeight;
            dataHeight.style.height = dataHeightHeight + 'px';
        }
        resultSetTop = Math.round((index-startOffset)*rh);
        if (resultSet._top!==resultSetTop) {
            if (this.useTransforms===true) {
                resultSet.style.transform = 'translateY('+resultSetTop+'px)';
            }
            else {
                resultSet.style.top = resultSetTop + 'px';
            }
        }
        
        if (this.rows.length>numDisplayed) {
            for (i=numDisplayed; i<this.rows.length; i++) {
                resultSet.removeChild(this.rows.pop());
            }
        }
        for (i=this.rows.length; i<numDisplayed; i++) {
            this._createRow();
        }
        
        for (i=0; i<Math.min(numDisplayed, len-index); i++) {
            rowEl = this.rows[i];
            row = this.data[index+i];
            rowEl.rowData = row;
            if (row===undefined || row===null) row = empty;
            this.updateRow(rowEl, row, index+i);
        }
    }
});
