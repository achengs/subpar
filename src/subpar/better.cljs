(ns subpar.better
  "support for incremental parsing of clojure source code for paredit"
  (:require-macros [subpar.macros :as m])
  (:require [clojure.string :as str]
            [cljsjs.codemirror]
            [cljsjs.codemirror.mode.clojure]
            [cljsjs.codemirror.keymap.emacs]))

(enable-console-print!)

(defn cursor
  "get cur, the position of the cursor"
  ([cm] (.getCursor cm)) ;; get current cursor
  ([cm i] (.posFromIndex cm i))) ;; get cursor for index i

(defn index
  "get the index i for the cursor's position"
  ([cm] (index cm (cursor cm)))
  ([cm cur] (when cur (.indexFromPos cm cur))))

;; sets can be used as predicates. they appear faster than #(= foo %1) at the
;; repl. therefore using sets:

(def opener?       #{ \( \[ \{       })
(def closer?       #{ \) \] \}       })
(def whitespace?   #{ \space \tab \, })
(def newline?      #{ \newline       })
(def semicolon?    #{ \;             })
(def doublequote?  #{ \"             })
(def escape?       #{ \\             })
(def multi-opener? #{ \# \^          })
(def multi-second? #{ \{             })

(defn multi?
  "true if c and next together make the start of a set #{ or metadata chunk ^{"
  [c next]
  (and (multi-opener? c)
       (multi-second? next)))

(declare ;; see comments in spar.macros to learn what these are:
 ;; 'classifiers' 'peekers' and 'steppers'.

 peek-code
 peek-comment
 peek-default
 peek-escaped
 peek-multi
 peek-string
 peek-string-escaped

 ;; steppers know how to represent the current character 'c'.

 step-close
 step-code
 step-comment-start
 step-comment-whitespace
 step-comment-word
 step-escape
 step-escaped
 step-multi
 step-multi-second
 step-newline
 step-open
 step-string
 step-string-end
 step-string-escape
 step-string-escaped
 step-string-newline
 step-string-start
 step-string-whitespace
 step-whitespace)


;; below are the classifiers:

;; the only reason we pass the 'next' character is to handle cases like
;; #{:sets} and ^{:doc "metadata"} by looking one position past the '#' and '^'

(defn classify-code
  "interprets the next character 'c' while we are in code (vs a string
  etc) and a multi-char opener such as #{:a :set} is NOT possible."
  [c next]
  (condp #(%1 %2) c
    whitespace?  step-whitespace
    newline?     step-newline
    opener?      step-open
    closer?      step-close
    doublequote? step-string-start
    semicolon?   step-comment-start
    escape?      step-escape
    nil?         nil
    step-code))

(defn classify-default
  "interprets the next character 'c' while we are in code (vs a string etc) and
  a multi-char opener such as #{:a :set} is possible"
  [c next]
  (if (multi? c next)
    step-multi
    (classify-code c next)))

(defn classify-escaped
  "interprets the next character 'c' when we are supposed to escape it"
  [c next] (when c step-escaped))

(defn classify-string
  "interprets the next character 'c' while we are in a string"
  [c next]
  (condp #(%1 %2) c
    escape?      step-string-escape
    doublequote? step-string-end
    newline?     step-string-newline
    whitespace?  step-string-whitespace
    nil?         nil ;; at the end of the code we're parsing
    step-string))

(defn classify-multi
  "interprets the next character 'c' while we are already expecting { because
  it's a multi-char opener like for sets #{} and metadata ^{:doc ...}"
  [c next]
  (condp #(%1 %2) c
    multi-second? step-multi-second
    nil? nil
    (classify-default c next)))

(defn classify-string-escaped
  "interprets the next character 'c' while we are in a string, escaping"
  [c next] (when c step-string-escaped))

(defn classify-comment
  "interprets the next character 'c' while we are in a comment"
  [c next]
  (condp #(%1 %2) c
    newline?    step-newline
    whitespace? step-comment-whitespace
    semicolon?  step-comment-start
    nil?        nil
    step-comment-word))

;; haven't figured out if it's possible to use code->peeker in the
;; implementation of 'defs' to avoid having to pass in the peeker as
;; the last arg here.

(m/defs step-close              \) -1 peek-default)
(m/defs step-code               \.  0 peek-code)
(m/defs step-comment-start      \;  0 peek-comment)
(m/defs step-comment-whitespace \c  0 peek-comment)
(m/defs step-comment-word       \C  0 peek-comment)
(m/defs step-escape             \e  0 peek-escaped)
(m/defs step-escaped            \E  0 peek-default)
(m/defs step-multi              \#  1 peek-multi)
(m/defs step-multi-second       \{  0 peek-default)
(m/defs step-newline            \n  0 peek-default)
(m/defs step-open               \(  1 peek-default)
(m/defs step-string             \S  0 peek-string)
(m/defs step-string-end         \"  0 peek-default)
(m/defs step-string-escape      \t  0 peek-string-escaped)
(m/defs step-string-escaped     \T  0 peek-string)
(m/defs step-string-newline     \N  0 peek-string)
(m/defs step-string-start       \'  0 peek-string)
(m/defs step-string-whitespace  \s  0 peek-string)
(m/defs step-whitespace     \space  0 peek-default)

(m/defp peek-default        classify-default)
(m/defp peek-code           classify-code)
(m/defp peek-multi          classify-multi)
(m/defp peek-escaped        classify-escaped)
(m/defp peek-comment        classify-comment)
(m/defp peek-string         classify-string)
(m/defp peek-string-escaped classify-string-escaped)

(def code->peeker
  ^{:doc "maps letter codes to the right peeker"}
  {\) peek-default
   \. peek-code
   \; peek-comment
   \c peek-comment
   \C peek-comment
   \e peek-escaped
   \E peek-default
   \# peek-multi
   \{ peek-default
   \n peek-default
   \( peek-default
   \S peek-string
   \' peek-string
   \t peek-string-escaped
   \T peek-string
   \N peek-string
   \" peek-default
   \s peek-string
   \space peek-default})

(defn parse
  "parse clojure source 's' using 'peeker' to interpret the first
  character, with 'code' and 'depth' as the accumulated result. to
  parse an updated section from code mirror, you'd have to pick the
  right peeker given the character code at the start of the section,
  and pass in the 'code' and 'depth' of the source from its start all
  the way up to the section. then prepend that to the tail which is
  the parsed result of the source that occurs after the updated
  section. the code and depth at the end of the parsed edit needs to
  match the beginning of the tail."
  ([s]        (parse s peek-default))
  ([s peeker] (parse s peeker "" [] 0))
  ([s peeker code depth next-depth]
   ;; (println "parse")
   ;; (println (str "s \"" s "\""))
   ;; (println "peeker" peeker)
   ;; (println (str "code \"" code "\""))
   ;; (println "depth" depth)
   ;; (println "ndepth" next-depth)

   ;; TODO profile
   (trampoline peeker code depth next-depth s)))

(def plain-typing-mode (atom true))

(def code (atom ""))

(def depth (atom []))

(defn change-state
  "change code and depth atoms"
  [c d]
  (reset! code c)
  (reset! depth d))

(defn reject [change]
  (println "rejecting change: unbalanced parens")
  (.cancel change))

(defn get-next-depth
  "gets the next depth at 'i' given 'depth' or 0 if 'i' is not in range"
  [i depth]
  (if (< i (count depth)) (nth depth i) 0))

(defn get-peeker
  "gets the right peeker at 'i' given 'code' or the default peeker if
  'i' is at the beginning of the buffer."
  [i code]
  (if (>= i 0)
    (code->peeker (nth code i))
    peek-default))

(defn ^:export init
  "parses 'cm' initial contents to set up our state"
  [cm]
  (->> cm .getValue parse (apply change-state))
  (when (and (not-empty @depth)
             (not (zero? (last @depth))))
    (js/alert "unbalanced parens. behavior undefined!")))

(defn ^:export before-change
  "inspect change before it happens. assuming there's only one blurb
  per change to parse. also assuming all change events keep the code
  balanced/valid, or that we can cancel any invalid change. this
  assumption could be false if some other code wants to change the
  code mirror instance's content!"
  [cm change]
  ;; (.log js/console change)
  ;; there are four indices of interest in the existing code, before
  ;; the proposed change is applied: a b c d.
  ;;
  ;; the change is from 'b' to 'c' -- you can think of the user
  ;; putting the cursor at 'b' and selecting up until 'c' and then
  ;; pasting in a string 's' as the replacement.
  ;;
  ;; the position just before the change is 'a' and it tells
  ;; us how to interpret the first character of the change, according
  ;; to the mapping code->peeker.
  ;;
  ;; 'd' is the position just to the
  ;; right of the change. the result of parsing the proposed change
  ;; should leave us at the same depth as what the existing code had
  ;; at 'd'. otherwise the proposed change causes an imbalance in
  ;; parens and we can cancel the change.
  ;;
  ;; 's' is the change as a string. so the proposed change is a string
  ;; 's' that replaces whatever is from 'b' (inclusive) to 'c'
  ;; (exclusive).
  ;;
  (let [code0 @code
        depth0 @depth
        b (.indexFromPos cm (.-from change))
        c (.indexFromPos cm (.-to change))
        d (inc c)
        a (dec b)
        [code1 depth1] (parse
                        (str/join \newline (.-text change))
                        (get-peeker a code0)
                        (subs code0 0 b)
                        (subvec depth0 0 b)
                        (get-next-depth b depth0))]
    (if (= (get-next-depth c depth0) ;; depth expected.
           (or (last depth1) 0))     ;; depth resulting from parse.
      (change-state
       (str code1 (subs code0 c))
       (into (if (empty? depth1) depth1 (pop depth1))
             (subvec depth0 c)))
      (reject change))))
;; todo: (|) backspace ()

(defn ^:export toggle-mode
  "switch between plain typing mode and paredit"
  [cm]
  (swap! plain-typing-mode not)
  (.setOption cm "lineNumbers" @plain-typing-mode))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; paredit-open-round (
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn ^:export open-round
  "paredit-open-round exposed for keymap. unlike traditional emacs paredit, this
  supports brackets [] {} () but not double-quote."
  ([cm] (open-round cm "("))
  ([cm c]
   (let [code @code, depth @depth, i (index cm (cursor cm))]
     (js/alert (str "i is " i "code:" (count code ) "depth:" (count depth))))))

(comment
  (let [{:keys [type left-char right-char]} (get-info cm)]
    (cond
      ;; escaping the next character:
      (= "\\" left-char) (insert cm c)

      ;; typing in a comment or string as-is:
      (comment-or-string? type) (insert cm c)

      ;; insert a pair, pad with a space to the left and/or right if necessary,
      ;; and move the cursor into the pair before returning:
      :else
      (let [need-left-padding (and (not= " " left-char)
                                   (not (opener? left-char)))
            need-right-padding (and (not= " " right-char)
                                    (not (closer? right-char)))]
        (insert cm
                (str (when need-left-padding " ")
                     c (pair c)
                     (when need-right-padding " "))
                (if need-right-padding -2 -1))))))
