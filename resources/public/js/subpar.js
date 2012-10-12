(function() {

    // function getIndex(cm) {
    //     return cm.indexFromPos(cm.getCursor());
    // }

    // function goToIndex(cm, i, j) {
    //     if (i!=j)
    //         cm.setCursor(cm.posFromIndex(j));
    // }

    // function openExpression(cm,pair) {
    //     var i = getIndex(cm);
    //     var s = cm.getValue();
    //     if (subpar.core.in_string(s,i)) {
    //         var cur = cm.getCursor();
    //         cm.replaceRange(pair[0],cur);
    //         cm.setCursor(cur.line,cur.ch + 1);
    //     } else {
    //         var cur = cm.getCursor();
    //         var fun = function() {
    //             cm.replaceRange(pair,cur);
    //             cm.setCursor(cur.line,cur.ch + 1);
    //             cm.indentLine(cur.line);
    //         }
    //         cm.compoundChange(fun);
    //     }
    // }

    // function nothingSelected(cm) {
    //     return "" === cm.getSelection()
    // }

    // function forwardDelete(cm) {
    //     if (nothingSelected(cm)) {
    //         var cur = cm.getCursor();
    //         var ind = getIndex(cm);
    //         var str = cm.getValue();
    //         var act = subpar.core.forward_delete(str, ind);
    //         var start1 = cm.posFromIndex(ind);
    //         var end1   = cm.posFromIndex(ind+1)
    //         var start2 = cm.posFromIndex(ind-1);
    //         var end2   = end1;
    //         var start3 = start1;
    //         var end3   = cm.posFromIndex(ind+2)

    //         switch(act)
    //         {
    //         case 0: break;
    //         case 1: cm.replaceRange("",start1,end1); break;
    //         case 2: cm.replaceRange("",start2,end2); break;
    //         case 3: cm.replaceRange("",start3,end3); break;
    //         case 4: cm.setCursor(end1); break;
    //         }
    //     } else {
    //         cm.replaceSelection("");
    //     }
    // }
    // function backwardDelete(cm) {
    //     if (nothingSelected(cm)) {
    //         var cur = cm.getCursor();
    //         var ind = getIndex(cm);
    //         var str = cm.getValue();
    //         var act = subpar.core.backward_delete(str, ind);
    //         var start1   = cm.posFromIndex(ind-1)
    //         var end1 = cm.posFromIndex(ind);
    //         var start2 = start1;
    //         var end2   = cm.posFromIndex(ind+1);
    //         var start3 = cm.posFromIndex(ind-2)
    //         var end3   = end1

    //         switch(act)
    //         {
    //         case 0: break;
    //         case 1: cm.replaceRange("",start1,end1); break;
    //         case 2: cm.replaceRange("",start2,end2); break;
    //         case 3: cm.replaceRange("",start3,end3); break;
    //         case 4: cm.setCursor(start1); break;
    //         }
    //     } else {
    //         cm.replaceSelection("");
    //     }
    // }

    // function doubleQuote(cm) {
    //     var cur = cm.getCursor();
    //     var ind = getIndex(cm);
    //     var str = cm.getValue();
    //     var act = subpar.core.doublequote(str, ind);
    //     switch(act)
    //     {
    //     case 0: openExpression(cm,"\"\""); break;
    //     case 1: cm.replaceRange("\\\"",cur);  break;
    //     case 2: goToIndex(cm,ind,ind+1);          break;
    //     }
    // }

    // function closeExpression(cm) {
    //     var i = getIndex(cm);
    //     var s = cm.getValue();
    //     if (subpar.core.in_string(s,i)) {
    //         var cur = cm.getCursor();
    //         cm.replaceRange(pair[1],cur);
    //         cm.setCursor(cur.line,cur.ch + 1);
    //     } else {
    //         var r = subpar.core.close_expression(s,i);
    //         if (0!=r.length) {
    //             var del         = r[0];
    //             var beg         = r[1];
    //             var end         = r[2];
    //             var dst         = r[3];
    //             if (del) {
    //                 cm.replaceRange("",cm.posFromIndex(beg),cm.posFromIndex(end));
    //             }
    //             // todo: fix. this works except for the simplest case "[| ]"
    //             goToIndex(cm, i, dst);
    //         }
    //     }
    // }
    // ///////////////////////////////////////////////////////////////////////////
    // // movement
    // ///////////////////////////////////////////////////////////////////////////
    // function go(cm,f) {
    //     var i = getIndex(cm);
    //     var s = cm.getValue();
    //     var j = f(s,i);
    //     goToIndex(cm, i, j);
    // }

    // function backwardUp(cm) {
    //     go(cm,subpar.core.backward_up);
    // }

    // function forwardDown(cm) {
    //     go(cm,subpar.core.forward_down);
    // }

    // function backward(cm) {
    //     go(cm,subpar.core.backward);
    // }

    // function forward(cm) {
    //     go(cm,subpar.core.forward);
    // }

    // function backwardDown(cm) {
    //     go(cm,subpar.core.backward_down);
    // }

    // function forwardUp(cm) {
    //     go(cm,subpar.core.forward_up);
    // }
    // ///////////////////////////////////////////////////////////////////////////

    // function forwardSlurp(cm) {
    //     var i = getIndex(cm);
    //     var s = cm.getValue();
    //     var r = subpar.core.forward_slurp(s,i);
        
    //     if (0!=r.length) {
    //         var delimiter   = r[0];
    //         var start       = cm.posFromIndex(r[1]);
    //         var end         = cm.posFromIndex(r[1]+1)
    //         var destination = cm.posFromIndex(r[2]);
    //         var line        = start.line;
    //         var indents     = r[3];
    //         var func = function() {
    //             cm.replaceRange(delimiter,destination);
    //             cm.replaceRange("",start,end);
    //             for (l=line;l<(line+indents);l++) {
    //                 cm.indentLine(l);
    //             }
    //         }
    //         cm.compoundChange(func);
    //     }
    // }

    // function backwardSlurp(cm) {
    //     var i = getIndex(cm);
    //     var s = cm.getValue();
    //     var r = subpar.core.backward_slurp(s,i);
        
    //     if (0!=r.length) {
    //         var delimiter   = r[0];
    //         var start       = cm.posFromIndex(r[1]);
    //         var end         = cm.posFromIndex(r[1]+1)
    //         var destination = cm.posFromIndex(r[2]);
    //         var line        = destination.line;
    //         var indents     = r[3];
    //         var func = function() {
    //             cm.replaceRange("",start,end);
    //             cm.replaceRange(delimiter,destination);
    //             for (l=line;l<(line+indents);l++) {
    //                 cm.indentLine(l);
    //             }
    //         }
    //         cm.compoundChange(func);
    //     }
    // }

    // function backwardBarf(cm) {
    //     var i = getIndex(cm);
    //     var s = cm.getValue();
    //     var r = subpar.core.backward_barf(s,i);
        
    //     if (0!=r.length) {
    //         var dlm         = r[0];
    //         var src         = r[1];
    //         var dst         = r[2];
    //         var pad         = r[3];
    //         var lin         = r[4];
    //         var delimiter   = pad ? " " + dlm : dlm;
    //         var destination = cm.posFromIndex(dst);
    //         var start       = cm.posFromIndex(src);
    //         var end         = cm.posFromIndex(src+1);
    //         var func        = function() {
    //             cm.replaceRange(delimiter,destination);
    //             cm.replaceRange("",start,end);
    //             for (l=start.line;l<(start.line+lin);l++) {
    //                 cm.indentLine(l);
    //             }
    //         }
    //         cm.compoundChange(func);
    //     }
    // }


    // function forwardBarf(cm) {
    //     var i = getIndex(cm);
    //     var s = cm.getValue();
    //     var r = subpar.core.forward_barf(s,i);
        
    //     if (0!=r.length) {
    //         var dlm         = r[0];
    //         var src         = r[1];
    //         var dst         = r[2];
    //         var pad         = r[3];
    //         var lin         = r[4];
    //         var opener      = r[5];
    //         var openLine    = cm.posFromIndex(opener).line;
    //         var delimiter   = pad ? dlm + " " : dlm;
    //         var destination = cm.posFromIndex(dst);
    //         var start       = cm.posFromIndex(src);
    //         var end         = cm.posFromIndex(src+1);
    //         var func        = function() {
    //             cm.replaceRange("",start,end);
    //             cm.replaceRange(delimiter,destination);
    //             for (l=openLine;l<(openLine+lin);l++) {
    //                 cm.indentLine(l);
    //             }
    //         }
    //         cm.compoundChange(func);
    //     }
    // }

    // function spliceDeleteBackward(cm) {
    //     // todo: put the cut on the clipboard
    //     var i = getIndex(cm);
    //     var s = cm.getValue();
    //     var r = subpar.core.splice_killing_backward(s,i);

    //     if (0!=r.length) {
    //         var start    = r[0];
    //         var end      = r[1];
    //         var closer   = r[2];
    //         var reindent = r[3];
    //         var count    = r[4];
    //         var line     = cm.posFromIndex(reindent).line;
    //         var func     = function() {
    //             cm.replaceRange("",cm.posFromIndex(closer),cm.posFromIndex(closer+1));
    //             cm.replaceRange("",cm.posFromIndex(start),cm.posFromIndex(end));
    //             for (l=line;l<(line+count);l++) {
    //                 cm.indentLine(l);
    //             }
    //         }
    //         cm.compoundChange(func);
    //     }
    // }

    // function spliceDeleteForward(cm) {
    //     // todo: put the cut on the clipboard
    //     var i = getIndex(cm);
    //     var s = cm.getValue();
    //     var r = subpar.core.splice_killing_forward(s,i);

    //     if (0!=r.length) {
    //         var opener   = r[0];
    //         var start    = r[1];
    //         var end      = r[2];
    //         var reindent = r[3];
    //         var count    = r[4];
    //         var line     = cm.posFromIndex(reindent).line;
    //         var func     = function() {
    //             cm.replaceRange("",cm.posFromIndex(start),cm.posFromIndex(end));
    //             cm.replaceRange("",cm.posFromIndex(opener),cm.posFromIndex(opener+1));
    //             for (l=line;l<(line+count);l++) {
    //                 cm.indentLine(l);
    //             }
    //         }
    //         cm.compoundChange(func);
    //     }
    // }


    // function splice(cm) {
    //     var i = getIndex(cm);
    //     var s = cm.getValue();
    //     var r = subpar.core.splice(s,i);
    //     if (0!=r.length) {
    //         var opener   = r[0];
    //         var closer   = r[1];
    //         var reindent = r[2];
    //         var count    = r[3];
    //         var line     = cm.posFromIndex(reindent).line;
    //         var func     = function() {
    //             cm.replaceRange("",cm.posFromIndex(closer),cm.posFromIndex(closer+1));
    //             cm.replaceRange("",cm.posFromIndex(opener),cm.posFromIndex(opener+1));
    //             for (l=line;l<(line+count);l++) {
    //                 cm.indentLine(l);
    //             }
    //         }
    //         cm.compoundChange(func);
    //     }
    // }

    // function indentSelection(cm) {
    //     if (cm.somethingSelected()) {
    //         var start = cm.getCursor(true).line;
    //         var end   = cm.getCursor(false).line;
    //         var func  = function() {
    //             for (l=start;l<=end;l++) {
    //                 cm.indentLine(l);
    //             }
    //         }
    //         cm.compoundChange(func);
    //     } else {
    //         var line = cm.getCursor().line;
    //         cm.indentLine(line);
    //     }
    // }
    //Modifiers in this order: Shift-, Cmd-, Ctrl-, and Alt-
    CodeMirror.keyMap.subpar = {
        "Backspace"      : function(cm) {subpar.core.backward_delete(cm)},
        "Delete"         : function(cm) {subpar.core.forward_delete(cm)},
        "Ctrl-D"         : function(cm) {subpar.core.forward_delete(cm)},

        "Shift-9"        : function(cm) {subpar.core.open_expression(cm,"()")},
        "["              : function(cm) {subpar.core.open_expression(cm,"[]")},
        "Shift-["        : function(cm) {subpar.core.open_expression(cm,"{}")},

        "Shift-0"        : function(cm) {subpar.core.close_expression(cm,")")},
        "]"              : function(cm) {subpar.core.close_expression(cm,"]")},
        "Shift-]"        : function(cm) {subpar.core.close_expression(cm,"}")},

        "Shift-'"        : function(cm) {subpar.core.double_quote(cm)},

        "Ctrl-Alt-F"     : function(cm) {subpar.core.forward(cm)},
        "Ctrl-Alt-B"     : function(cm) {subpar.core.backward(cm)},
        "Ctrl-Alt-U"     : function(cm) {subpar.core.backward_up(cm)},
        "Ctrl-Alt-D"     : function(cm) {subpar.core.forward_down(cm)},
        "Ctrl-Alt-P"     : function(cm) {subpar.core.backward_down(cm)},
        "Ctrl-Alt-N"     : function(cm) {subpar.core.forward_up(cm)},// doesn't work for chrome on windows

        "Shift-Ctrl-["   : function(cm) {subpar.core.backward_barf(cm)},
        "Ctrl-Alt-Right" : function(cm) {subpar.core.backward_barf(cm)},
        "Ctrl-]"         : function(cm) {subpar.core.backward_barf(cm)},

        "Shift-Ctrl-]"   : function(cm) {subpar.core.forward_barf(cm)},
        "Ctrl-Left"      : function(cm) {subpar.core.forward_barf(cm)},

        "Shift-Ctrl-9"   : function(cm) {subpar.core.backward_slurp(cm)},
        "Ctrl-Alt-Left"  : function(cm) {subpar.core.backward_slurp(cm)},
        "Ctrl-["         : function(cm) {subpar.core.backward_slurp(cm)},

        "Shift-Ctrl-0"   : function(cm) {subpar.core.forward_slurp(cm)},// todo key combination didn't work in chrome on windows
        "Ctrl-Right"     : function(cm) {subpar.core.forward_slurp(cm)},

        //todo add padding space if necessary for all splices
        "Alt-Up"         : function(cm) {subpar.core.splice_delete_backward(cm)},
        "Alt-Down"       : function(cm) {subpar.core.splice_delete_forward(cm)},
        "Alt-S"          : function(cm) {subpar.core.splice(cm)},
        //todo wrap expression in round, square, curly.
        "Ctrl-Alt-\\"    : function(cm) {subpar.core.indent_selection(cm)},
        fallthrough: ["basic", "emacs"] // not sure if this is right
    };

})();
