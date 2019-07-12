# SubPar

SubPar is an approximate implementation of a subset of
[ParEdit](http://emacswiki.org/emacs/ParEdit) for
[CodeMirror](http://codemirror.net/). 

SubPar is written in ClojureScript. Its basic idea is to discover where all forms and siblings start and end, and use those positions for ParEdit operations.

The approach in this implementation is not suitable (note) for handling large files, because it parses the entire file for each operation. 
(*note:* _I came up with a better alternative which is more maintainable and supports incremental parsing to avoid parsing the whole file repeatedly.
The rest of the project has not been refactored to use it yet. The new code is in better.cljs and macros.cljc._)

The reason it parses the entire file is because the original ParEdit plugin for LightTable at the time (2012!) scanned only a max distance from the cursor in either direction. So it seemed possible that particular constructs could trick it. I wanted to try an implementation that could not be tricked.

It's possible that the CodeMirror editor (now) exposes the nature of the current position (are you inside a comment or a string or normal code?). That would support a fool-proof approach that doesn't have to parse the entire file.

This exercise was also a test of "don't optimize for performance until it proves necessary." Of course, it was known ahead of time that parsing the whole file would make each operation's cost depend on the size of the file, compared to LightTable ParEdit's approach. But what wasn't known was: how bad could it be?

## Demo

[Here is a page that hosts a demo.](http://htmlpreview.github.com/?https://github.com/achengs/subpar/blob/master/demo/normal.html)

You might have to reload the demo page to get the source code to load inside the CodeMirror.

## Usage

Here are the steps I took to create [the demo example](http://htmlpreview.github.com/?https://github.com/achengs/subpar/blob/master/demo/normal.html).

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
* Indentation
  * Indent Selection: Ctrl-Alt-\

Bug reports are definitely welcome.

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
