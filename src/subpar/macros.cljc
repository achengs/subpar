(ns subpar.macros)

;; we parse code by peeking (p) at the next position, and then taking
;; the right step (s). so we have defp and defs. together they
;; constitute a finite state machine where we peek to pick a
;; transition, and then step along that transition.

(defmacro defs ;; 's' for stepper
  "a stepper updates the accumulated result with one more position.
  the accumulated result has two parts: [1] a character code 'c' for
  what is at this position and [2] the depth at this position. (for
  paredit operations where we need to find openers, closers, and where
  the depth goes to 0, we'll scan depth.) finally a stepper returns a
  function that would call the 'next-peeker' on the rest of the code
  to parse. a stepper is basically a transition in a finite state
  machine. steppers return functions so we can use trampoline to have
  constant vs linear call depth."
  [name c depth-delta next-peeker]
  `(defn ~name [code# depth# d# r#]
     #(~next-peeker
       (str code# ~c)
       (conj depth# d#)
       (+ d# ~depth-delta)
       r#)))

(defmacro defp ;; 'p' for peeker
  "a peeker asks the 'classifier' for the right stepper (transition),
  and then applies it. if there is no stepper (because we've reached
  the end of what we're parsing), then the peeker returns the
  accumulated result. a peeker is basically the edge-picker for a
  state in a finite state machine."
  [name classifier]
  `(defn ~name [code# depth# next-depth# [c# & r#]]
     (if-let [stepper# (~classifier c# (first r#))]
       (stepper# code# depth# next-depth# r#)
       [code# (conj depth# next-depth#)])))
