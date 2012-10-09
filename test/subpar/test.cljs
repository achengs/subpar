(ns subpar.test
  (:require [subpar.test.tests :as tests]))

(def success 0)

(defn ^:export run []
  (.log js/console "Subpar tests started.")
  (tests/run)
  success)
