# SubPar

SubPar is a 2012 implementation of a subset of
[ParEdit](http://emacswiki.org/emacs/ParEdit) for
[CodeMirror](http://codemirror.net/) in ClojureScript. 

SubPar discovers where all forms and siblings start and end, and uses those positions for ParEdit operations.

SubPar is not suitable for handling large files, because it parses the entire file for each operation.
The original ParEdit plugin for LightTable at the time (2012!) scanned only a maximum distance from the cursor in either direction. So valid code could trick it.
Also back then, CodeMirror did not provide the nature of the current cursor position (code vs comment vs string).

(I came up with a better alternative which is more maintainable and supports incremental parsing to avoid parsing the whole file repeatedly. 
The rest of the project has not been refactored to use it yet. 
The new code is in better.cljs and macros.cljc.)

## Demo

[Here is a page that hosts a demo.](http://htmlpreview.github.io/?https://github.com/achengs/subpar/blob/update-demo-url/demo/normal.html)

You might have to reload the demo page to get the source code to load inside the CodeMirror.

## Usage

Here are the steps I took to create [the demo example](http://htmlpreview.github.io/?https://github.com/achengs/subpar/blob/master/demo/normal.html).

1. Started with a copy of one of the demo pages from CodeMirror, like
[this one](http://codemirror.net/mode/clojure/index.html).
2. Used [the CodeMirror compression
page](http://codemirror.net/doc/compress.html) to get a minified
bundle of codemirror.js, clojure.js, emacs.js (wasn't sure whether
emacs was necessary but included it anyway).
3. Included the resulting codemirror-compressed.js file in my page's header with a script tag.
4. Included resources/public/js/subpar.core.js and
resources/public/js/subpar.js. (If you find an issue and wish to investigate, you can subpar.core.debug.js instead for non-minified symbols.) 
5. Set the keyMap option to "subpar"

## Features / Keys

* Delimiters
  * Backspace, Delete, Ctrl-D handle these: () {} [] "" \
  * Delimiters are created in pairs: () {} [] ""
  * Typing a closing delimiter moves past it after deleting any whitespace at the end of the current list
* Movement
  * Forward: Ctrl-Alt-F
  * Backward: Ctrl-Alt-B
  * Backward Up: Ctrl-Alt-U
  * Forward Down: Ctrl-Alt-D
  * Backward Down: Ctrl-Alt-P
  * Forward Up: Ctrl-Alt-N
* Barf / Slurp
  * Backward Barf: Shift-Ctrl-[ or Ctrl-Alt-Right or Ctrl-]
  * Forward Barf: Shift-Ctrl-] or Ctrl-Left
  * Backward Slurp: Shift-Ctrl-9 or Ctrl-Alt-Left or Ctrl-[
  * Forward Slurp: Shift-Ctrl-0 or Ctrl-Right
* Splicing
  * Splice: Alt-S
  * Splice Delete Backward: Alt-Up
  * Splice Delete Forward: Alt-Down

## Customization

You can change the key shortcuts by editing your copy of
resources/public/js/subpar.js 

## Making Changes

The project is laid out just like [the advanced
example](https://github.com/emezeske/lein-cljsbuild/tree/master/example-projects/advanced)
in [emezeske /
lein-cljsbuild](https://github.com/emezeske/lein-cljsbuild). Working
with this project requires the same things as the advanced example
([Leiningen](https://github.com/technomancy/leiningen) 1.7.0 or
higher, [PhantomJS](http://www.phantomjs.org)).

The resources/public/js/subpar.core.js file is generated. Bug fixes
and improvements should go in the following files:

1. src-cljs/subpar/core.cljs (stuff related to parsing and finding
things goes here)
2. resources/public/js/subpar.js (stuff directly dealing with
CodeMirror's API goes here, including changes to the keymap)

If src-cljs/subpar/core.cljs is changed, you can generate a new
resources/public/js/subpar.core.js by compiling (or also by running
the tests, see below).

## Running the Tests

The unit tests live in `test-cljs`. To run the unit tests, you need
[PhantomJS](http://www.phantomjs.org). 

    $ lein cljsbuild test unit

See the `phantom/unit-test.js` file for more details on how PhantomJS
is configured to make this work.

## License

See [MIT License file](https://github.com/achengs/subpar/blob/master/LICENSE).
