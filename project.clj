(defproject subpar "0.0.0"
  :description "an approximate subset of paredit for codemirror"
  :dependencies [[org.clojure/clojure "1.4.0"]]
  :plugins [[lein-cljsbuild "0.2.7"]]
  :hooks [leiningen.cljsbuild]
  :cljsbuild {
              :test-commands
                                        ; Test command for running the unit tests in "test" (see below).
                                        ;     $ lein cljsbuild test
              {"unit" ["phantomjs"
                       "phantom/unit-test.js"
                       "resources/private/html/unit-test.html"]}
              :builds {
                       :dev
                       {:source-path "src"
                        :jar true
                        :compiler {:output-to "resources/public/js/subpar.core.debug.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}
                       :prod
                       {:source-path "src"
                        :compiler {:output-to "resources/public/js/subpar.core.js"
                                   :optimizations :advanced
                                   :pretty-print false}}
                                        ; This build is for the ClojureScript unit tests that will
                                        ; be run via PhantomJS.  See the phantom/unit-test.js file
                                        ; for details on how it's run.
                       :test
                       {:source-path "test"
                        :compiler {:output-to "resources/private/js/unit-test.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}}})
