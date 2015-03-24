ScrollList
==========

> An infinitely scrollable list/datagrid.  
> Throw millions of rows at it, it won't even affect performance.  
> [JSFiddle Demo](http://jsfiddle.net/developit/j8swt8zb/)


Usage
-----

```js
var list = new ScrollList({
	// use `transform:translateY()` instead of `top` to offset contents?
	useTransforms : false,
	
	// debounce scroll events using requestAnimationFrame()?
	bufferedScrolling : true,
	
	// provide a DOM node to clone, used as a template for each row
	template : document.getElementById('row-template').content.firstElementChild
});

// insert the list into an element:
list.insertInto(document.body);

// generate and display 1,000,000 rows
var mil = [];
for (var i=1e6; i--; ) {
    mil[i] = {a:i+'a', b:i+'b', c:i+'c'};
}
list.setData(mil);

// later on, select a row:
list.data[5].selected = true;
list.update();
```
