# SubPar

SubPar is an approximate implementation of a subset of
[ParEdit](http://emacswiki.org/emacs/ParEdit) for
[CodeMirror](http://codemirror.net/).

## Demo

[Here is a page that hosts a demo.](http://htmlpreview.github.com/?https://github.com/achengs/subpar/blob/master/demo/normal.html)

## Usage

Here are the steps I took to create [the demo example](http://htmlpreview.github.com/?https://github.com/achengs/subpar/blob/master/demo/normal.html).

1. Started with a copy of one of the dmeo pages from CodeMirror, like
[this one](http://codemirror.net/mode/clojure/index.html).
2. Used [the CodeMirror compression
page](http://codemirror.net/doc/compress.html) to get a minified
bundle of codemirror.js, clojure.js, emacs.js (wasn't sure whether
emacs was necessary but included it anyway).
3. Included the resulting codemirror-compressed.js file in my page's header with a script tag.
4. Included resources/public/js/subpar.core.debug.js and
resources/public/js/subpar.js. (subpar.core.js is supposed to be a
minified version but I think I found a difference in the behavior and
I want to investigate that before recommending its use) 
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
  * Backward Barf: Shift-Ctrl-[ or Ctrl-Alt-Right
  * Forward Barf: Shift-Ctrl-] or Ctrl-Left
  * Backward Slurp: Shift-Ctrl-9 or Ctrl-Alt-Left
  * Forward Slurp: Shift-Ctrl-0 or Ctrl-Right
* Splicing
  * Splice: Alt-S
  * Splice Delete Backward: Alt-Up
  * Splice Delete Forward: Alt-Down
* Indentation
  * Indent Selection: Ctrl-Alt-\

Bug reports are definitely welcome. I'll need to add Cmd versions to
support Mac OS.

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