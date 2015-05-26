(defproject subpar "0.0.0"
  :description "an approximate subset of paredit for codemirror"
  :dependencies [[org.clojure/clojure "1.7.0-beta2"]
                 [org.clojure/clojurescript "0.0-3269"]]
  :plugins [[lein-cljsbuild "1.0.6"]]
  :cljsbuild
            {:builds
             [{:source-paths ["src"],
               :id "prod",
               :compiler
                             {:externs ["resources/private/js/codemirror-externs.js"],
                              :optimizations :advanced,
                              :output-to "resources/public/js/subpar.core.js",
                              :pretty-print false}}
              {:source-paths ["test"],
               :id "test",
               :compiler
                             {:externs ["resources/private/js/codemirror-externs.js"],
                              :optimizations :whitespace,
                              :output-to "resources/private/js/unit-test.js",
                              :pretty-print true}}
              {:source-paths ["src"],
               :id "dev",
               :compiler
                             {:externs ["resources/private/js/codemirror-externs.js"],
                              :optimizations :whitespace,
                              :output-to "resources/public/js/subpar.core.debug.js",
                              :pretty-print true}}],
             :test-commands
             {"unit"
              ["phantomjs"
               "phantom/unit-test.js"
               "resources/private/html/unit-test.html"]}})
