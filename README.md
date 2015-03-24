ScrollList
==========

> An infinitely scrollable list/datagrid.  
> Throw millions of rows at it, it won't even affect performance.

Usage
-----

```js
var list = new ScrollList({
	// use `transform:translateY()` instead of `top` to offset contents?
	useTransforms : false,
	
	// debounce scroll events using requestAnimationFrame()?
	bufferedScrolling : true,
	
	// provide a DOM node to clone, used as a template for each row
	template : document.getElementById('#row-template')[0].content.firstElementChild
});

// insert the list into an element:
list.insertInto(document.body);

// generate and display 1,000,000 rows
var mil = new Array(1e7).map(function(e, i){ return {a:i+'a', b:i+'b', c:i+'c'}; });
list.setData(mil);

// later on, select a row:
list.data[5].selected = true;
list.update();
```
