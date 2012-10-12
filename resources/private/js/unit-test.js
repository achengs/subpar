var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__15222 = x == null ? null : x;
  if(p[goog.typeOf(x__15222)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__15223__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__15223 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15223__delegate.call(this, array, i, idxs)
    };
    G__15223.cljs$lang$maxFixedArity = 2;
    G__15223.cljs$lang$applyTo = function(arglist__15224) {
      var array = cljs.core.first(arglist__15224);
      var i = cljs.core.first(cljs.core.next(arglist__15224));
      var idxs = cljs.core.rest(cljs.core.next(arglist__15224));
      return G__15223__delegate(array, i, idxs)
    };
    G__15223.cljs$lang$arity$variadic = G__15223__delegate;
    return G__15223
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____15309 = this$;
      if(and__3822__auto____15309) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____15309
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____15310 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15311 = cljs.core._invoke[goog.typeOf(x__2363__auto____15310)];
        if(or__3824__auto____15311) {
          return or__3824__auto____15311
        }else {
          var or__3824__auto____15312 = cljs.core._invoke["_"];
          if(or__3824__auto____15312) {
            return or__3824__auto____15312
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____15313 = this$;
      if(and__3822__auto____15313) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____15313
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____15314 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15315 = cljs.core._invoke[goog.typeOf(x__2363__auto____15314)];
        if(or__3824__auto____15315) {
          return or__3824__auto____15315
        }else {
          var or__3824__auto____15316 = cljs.core._invoke["_"];
          if(or__3824__auto____15316) {
            return or__3824__auto____15316
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____15317 = this$;
      if(and__3822__auto____15317) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____15317
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____15318 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15319 = cljs.core._invoke[goog.typeOf(x__2363__auto____15318)];
        if(or__3824__auto____15319) {
          return or__3824__auto____15319
        }else {
          var or__3824__auto____15320 = cljs.core._invoke["_"];
          if(or__3824__auto____15320) {
            return or__3824__auto____15320
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____15321 = this$;
      if(and__3822__auto____15321) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____15321
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____15322 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15323 = cljs.core._invoke[goog.typeOf(x__2363__auto____15322)];
        if(or__3824__auto____15323) {
          return or__3824__auto____15323
        }else {
          var or__3824__auto____15324 = cljs.core._invoke["_"];
          if(or__3824__auto____15324) {
            return or__3824__auto____15324
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____15325 = this$;
      if(and__3822__auto____15325) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____15325
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____15326 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15327 = cljs.core._invoke[goog.typeOf(x__2363__auto____15326)];
        if(or__3824__auto____15327) {
          return or__3824__auto____15327
        }else {
          var or__3824__auto____15328 = cljs.core._invoke["_"];
          if(or__3824__auto____15328) {
            return or__3824__auto____15328
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____15329 = this$;
      if(and__3822__auto____15329) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____15329
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____15330 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15331 = cljs.core._invoke[goog.typeOf(x__2363__auto____15330)];
        if(or__3824__auto____15331) {
          return or__3824__auto____15331
        }else {
          var or__3824__auto____15332 = cljs.core._invoke["_"];
          if(or__3824__auto____15332) {
            return or__3824__auto____15332
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____15333 = this$;
      if(and__3822__auto____15333) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____15333
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____15334 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15335 = cljs.core._invoke[goog.typeOf(x__2363__auto____15334)];
        if(or__3824__auto____15335) {
          return or__3824__auto____15335
        }else {
          var or__3824__auto____15336 = cljs.core._invoke["_"];
          if(or__3824__auto____15336) {
            return or__3824__auto____15336
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____15337 = this$;
      if(and__3822__auto____15337) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____15337
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____15338 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15339 = cljs.core._invoke[goog.typeOf(x__2363__auto____15338)];
        if(or__3824__auto____15339) {
          return or__3824__auto____15339
        }else {
          var or__3824__auto____15340 = cljs.core._invoke["_"];
          if(or__3824__auto____15340) {
            return or__3824__auto____15340
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____15341 = this$;
      if(and__3822__auto____15341) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____15341
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____15342 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15343 = cljs.core._invoke[goog.typeOf(x__2363__auto____15342)];
        if(or__3824__auto____15343) {
          return or__3824__auto____15343
        }else {
          var or__3824__auto____15344 = cljs.core._invoke["_"];
          if(or__3824__auto____15344) {
            return or__3824__auto____15344
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____15345 = this$;
      if(and__3822__auto____15345) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____15345
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____15346 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15347 = cljs.core._invoke[goog.typeOf(x__2363__auto____15346)];
        if(or__3824__auto____15347) {
          return or__3824__auto____15347
        }else {
          var or__3824__auto____15348 = cljs.core._invoke["_"];
          if(or__3824__auto____15348) {
            return or__3824__auto____15348
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____15349 = this$;
      if(and__3822__auto____15349) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____15349
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____15350 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15351 = cljs.core._invoke[goog.typeOf(x__2363__auto____15350)];
        if(or__3824__auto____15351) {
          return or__3824__auto____15351
        }else {
          var or__3824__auto____15352 = cljs.core._invoke["_"];
          if(or__3824__auto____15352) {
            return or__3824__auto____15352
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____15353 = this$;
      if(and__3822__auto____15353) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____15353
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____15354 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15355 = cljs.core._invoke[goog.typeOf(x__2363__auto____15354)];
        if(or__3824__auto____15355) {
          return or__3824__auto____15355
        }else {
          var or__3824__auto____15356 = cljs.core._invoke["_"];
          if(or__3824__auto____15356) {
            return or__3824__auto____15356
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____15357 = this$;
      if(and__3822__auto____15357) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____15357
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____15358 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15359 = cljs.core._invoke[goog.typeOf(x__2363__auto____15358)];
        if(or__3824__auto____15359) {
          return or__3824__auto____15359
        }else {
          var or__3824__auto____15360 = cljs.core._invoke["_"];
          if(or__3824__auto____15360) {
            return or__3824__auto____15360
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____15361 = this$;
      if(and__3822__auto____15361) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____15361
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____15362 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15363 = cljs.core._invoke[goog.typeOf(x__2363__auto____15362)];
        if(or__3824__auto____15363) {
          return or__3824__auto____15363
        }else {
          var or__3824__auto____15364 = cljs.core._invoke["_"];
          if(or__3824__auto____15364) {
            return or__3824__auto____15364
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____15365 = this$;
      if(and__3822__auto____15365) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____15365
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____15366 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15367 = cljs.core._invoke[goog.typeOf(x__2363__auto____15366)];
        if(or__3824__auto____15367) {
          return or__3824__auto____15367
        }else {
          var or__3824__auto____15368 = cljs.core._invoke["_"];
          if(or__3824__auto____15368) {
            return or__3824__auto____15368
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____15369 = this$;
      if(and__3822__auto____15369) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____15369
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____15370 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15371 = cljs.core._invoke[goog.typeOf(x__2363__auto____15370)];
        if(or__3824__auto____15371) {
          return or__3824__auto____15371
        }else {
          var or__3824__auto____15372 = cljs.core._invoke["_"];
          if(or__3824__auto____15372) {
            return or__3824__auto____15372
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____15373 = this$;
      if(and__3822__auto____15373) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____15373
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____15374 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15375 = cljs.core._invoke[goog.typeOf(x__2363__auto____15374)];
        if(or__3824__auto____15375) {
          return or__3824__auto____15375
        }else {
          var or__3824__auto____15376 = cljs.core._invoke["_"];
          if(or__3824__auto____15376) {
            return or__3824__auto____15376
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____15377 = this$;
      if(and__3822__auto____15377) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____15377
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____15378 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15379 = cljs.core._invoke[goog.typeOf(x__2363__auto____15378)];
        if(or__3824__auto____15379) {
          return or__3824__auto____15379
        }else {
          var or__3824__auto____15380 = cljs.core._invoke["_"];
          if(or__3824__auto____15380) {
            return or__3824__auto____15380
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____15381 = this$;
      if(and__3822__auto____15381) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____15381
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____15382 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15383 = cljs.core._invoke[goog.typeOf(x__2363__auto____15382)];
        if(or__3824__auto____15383) {
          return or__3824__auto____15383
        }else {
          var or__3824__auto____15384 = cljs.core._invoke["_"];
          if(or__3824__auto____15384) {
            return or__3824__auto____15384
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____15385 = this$;
      if(and__3822__auto____15385) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____15385
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____15386 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15387 = cljs.core._invoke[goog.typeOf(x__2363__auto____15386)];
        if(or__3824__auto____15387) {
          return or__3824__auto____15387
        }else {
          var or__3824__auto____15388 = cljs.core._invoke["_"];
          if(or__3824__auto____15388) {
            return or__3824__auto____15388
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____15389 = this$;
      if(and__3822__auto____15389) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____15389
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____15390 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15391 = cljs.core._invoke[goog.typeOf(x__2363__auto____15390)];
        if(or__3824__auto____15391) {
          return or__3824__auto____15391
        }else {
          var or__3824__auto____15392 = cljs.core._invoke["_"];
          if(or__3824__auto____15392) {
            return or__3824__auto____15392
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____15397 = coll;
    if(and__3822__auto____15397) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____15397
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____15398 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15399 = cljs.core._count[goog.typeOf(x__2363__auto____15398)];
      if(or__3824__auto____15399) {
        return or__3824__auto____15399
      }else {
        var or__3824__auto____15400 = cljs.core._count["_"];
        if(or__3824__auto____15400) {
          return or__3824__auto____15400
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____15405 = coll;
    if(and__3822__auto____15405) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____15405
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____15406 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15407 = cljs.core._empty[goog.typeOf(x__2363__auto____15406)];
      if(or__3824__auto____15407) {
        return or__3824__auto____15407
      }else {
        var or__3824__auto____15408 = cljs.core._empty["_"];
        if(or__3824__auto____15408) {
          return or__3824__auto____15408
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____15413 = coll;
    if(and__3822__auto____15413) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____15413
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____15414 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15415 = cljs.core._conj[goog.typeOf(x__2363__auto____15414)];
      if(or__3824__auto____15415) {
        return or__3824__auto____15415
      }else {
        var or__3824__auto____15416 = cljs.core._conj["_"];
        if(or__3824__auto____15416) {
          return or__3824__auto____15416
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____15425 = coll;
      if(and__3822__auto____15425) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____15425
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____15426 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____15427 = cljs.core._nth[goog.typeOf(x__2363__auto____15426)];
        if(or__3824__auto____15427) {
          return or__3824__auto____15427
        }else {
          var or__3824__auto____15428 = cljs.core._nth["_"];
          if(or__3824__auto____15428) {
            return or__3824__auto____15428
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____15429 = coll;
      if(and__3822__auto____15429) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____15429
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____15430 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____15431 = cljs.core._nth[goog.typeOf(x__2363__auto____15430)];
        if(or__3824__auto____15431) {
          return or__3824__auto____15431
        }else {
          var or__3824__auto____15432 = cljs.core._nth["_"];
          if(or__3824__auto____15432) {
            return or__3824__auto____15432
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____15437 = coll;
    if(and__3822__auto____15437) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____15437
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____15438 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15439 = cljs.core._first[goog.typeOf(x__2363__auto____15438)];
      if(or__3824__auto____15439) {
        return or__3824__auto____15439
      }else {
        var or__3824__auto____15440 = cljs.core._first["_"];
        if(or__3824__auto____15440) {
          return or__3824__auto____15440
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____15445 = coll;
    if(and__3822__auto____15445) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____15445
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____15446 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15447 = cljs.core._rest[goog.typeOf(x__2363__auto____15446)];
      if(or__3824__auto____15447) {
        return or__3824__auto____15447
      }else {
        var or__3824__auto____15448 = cljs.core._rest["_"];
        if(or__3824__auto____15448) {
          return or__3824__auto____15448
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____15453 = coll;
    if(and__3822__auto____15453) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____15453
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____15454 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15455 = cljs.core._next[goog.typeOf(x__2363__auto____15454)];
      if(or__3824__auto____15455) {
        return or__3824__auto____15455
      }else {
        var or__3824__auto____15456 = cljs.core._next["_"];
        if(or__3824__auto____15456) {
          return or__3824__auto____15456
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____15465 = o;
      if(and__3822__auto____15465) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____15465
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____15466 = o == null ? null : o;
      return function() {
        var or__3824__auto____15467 = cljs.core._lookup[goog.typeOf(x__2363__auto____15466)];
        if(or__3824__auto____15467) {
          return or__3824__auto____15467
        }else {
          var or__3824__auto____15468 = cljs.core._lookup["_"];
          if(or__3824__auto____15468) {
            return or__3824__auto____15468
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____15469 = o;
      if(and__3822__auto____15469) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____15469
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____15470 = o == null ? null : o;
      return function() {
        var or__3824__auto____15471 = cljs.core._lookup[goog.typeOf(x__2363__auto____15470)];
        if(or__3824__auto____15471) {
          return or__3824__auto____15471
        }else {
          var or__3824__auto____15472 = cljs.core._lookup["_"];
          if(or__3824__auto____15472) {
            return or__3824__auto____15472
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____15477 = coll;
    if(and__3822__auto____15477) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____15477
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____15478 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15479 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____15478)];
      if(or__3824__auto____15479) {
        return or__3824__auto____15479
      }else {
        var or__3824__auto____15480 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____15480) {
          return or__3824__auto____15480
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____15485 = coll;
    if(and__3822__auto____15485) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____15485
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____15486 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15487 = cljs.core._assoc[goog.typeOf(x__2363__auto____15486)];
      if(or__3824__auto____15487) {
        return or__3824__auto____15487
      }else {
        var or__3824__auto____15488 = cljs.core._assoc["_"];
        if(or__3824__auto____15488) {
          return or__3824__auto____15488
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____15493 = coll;
    if(and__3822__auto____15493) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____15493
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____15494 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15495 = cljs.core._dissoc[goog.typeOf(x__2363__auto____15494)];
      if(or__3824__auto____15495) {
        return or__3824__auto____15495
      }else {
        var or__3824__auto____15496 = cljs.core._dissoc["_"];
        if(or__3824__auto____15496) {
          return or__3824__auto____15496
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____15501 = coll;
    if(and__3822__auto____15501) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____15501
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____15502 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15503 = cljs.core._key[goog.typeOf(x__2363__auto____15502)];
      if(or__3824__auto____15503) {
        return or__3824__auto____15503
      }else {
        var or__3824__auto____15504 = cljs.core._key["_"];
        if(or__3824__auto____15504) {
          return or__3824__auto____15504
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____15509 = coll;
    if(and__3822__auto____15509) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____15509
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____15510 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15511 = cljs.core._val[goog.typeOf(x__2363__auto____15510)];
      if(or__3824__auto____15511) {
        return or__3824__auto____15511
      }else {
        var or__3824__auto____15512 = cljs.core._val["_"];
        if(or__3824__auto____15512) {
          return or__3824__auto____15512
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____15517 = coll;
    if(and__3822__auto____15517) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____15517
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____15518 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15519 = cljs.core._disjoin[goog.typeOf(x__2363__auto____15518)];
      if(or__3824__auto____15519) {
        return or__3824__auto____15519
      }else {
        var or__3824__auto____15520 = cljs.core._disjoin["_"];
        if(or__3824__auto____15520) {
          return or__3824__auto____15520
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____15525 = coll;
    if(and__3822__auto____15525) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____15525
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____15526 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15527 = cljs.core._peek[goog.typeOf(x__2363__auto____15526)];
      if(or__3824__auto____15527) {
        return or__3824__auto____15527
      }else {
        var or__3824__auto____15528 = cljs.core._peek["_"];
        if(or__3824__auto____15528) {
          return or__3824__auto____15528
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____15533 = coll;
    if(and__3822__auto____15533) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____15533
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____15534 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15535 = cljs.core._pop[goog.typeOf(x__2363__auto____15534)];
      if(or__3824__auto____15535) {
        return or__3824__auto____15535
      }else {
        var or__3824__auto____15536 = cljs.core._pop["_"];
        if(or__3824__auto____15536) {
          return or__3824__auto____15536
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____15541 = coll;
    if(and__3822__auto____15541) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____15541
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____15542 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15543 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____15542)];
      if(or__3824__auto____15543) {
        return or__3824__auto____15543
      }else {
        var or__3824__auto____15544 = cljs.core._assoc_n["_"];
        if(or__3824__auto____15544) {
          return or__3824__auto____15544
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____15549 = o;
    if(and__3822__auto____15549) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____15549
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____15550 = o == null ? null : o;
    return function() {
      var or__3824__auto____15551 = cljs.core._deref[goog.typeOf(x__2363__auto____15550)];
      if(or__3824__auto____15551) {
        return or__3824__auto____15551
      }else {
        var or__3824__auto____15552 = cljs.core._deref["_"];
        if(or__3824__auto____15552) {
          return or__3824__auto____15552
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____15557 = o;
    if(and__3822__auto____15557) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____15557
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____15558 = o == null ? null : o;
    return function() {
      var or__3824__auto____15559 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____15558)];
      if(or__3824__auto____15559) {
        return or__3824__auto____15559
      }else {
        var or__3824__auto____15560 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____15560) {
          return or__3824__auto____15560
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____15565 = o;
    if(and__3822__auto____15565) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____15565
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____15566 = o == null ? null : o;
    return function() {
      var or__3824__auto____15567 = cljs.core._meta[goog.typeOf(x__2363__auto____15566)];
      if(or__3824__auto____15567) {
        return or__3824__auto____15567
      }else {
        var or__3824__auto____15568 = cljs.core._meta["_"];
        if(or__3824__auto____15568) {
          return or__3824__auto____15568
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____15573 = o;
    if(and__3822__auto____15573) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____15573
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____15574 = o == null ? null : o;
    return function() {
      var or__3824__auto____15575 = cljs.core._with_meta[goog.typeOf(x__2363__auto____15574)];
      if(or__3824__auto____15575) {
        return or__3824__auto____15575
      }else {
        var or__3824__auto____15576 = cljs.core._with_meta["_"];
        if(or__3824__auto____15576) {
          return or__3824__auto____15576
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____15585 = coll;
      if(and__3822__auto____15585) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____15585
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____15586 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____15587 = cljs.core._reduce[goog.typeOf(x__2363__auto____15586)];
        if(or__3824__auto____15587) {
          return or__3824__auto____15587
        }else {
          var or__3824__auto____15588 = cljs.core._reduce["_"];
          if(or__3824__auto____15588) {
            return or__3824__auto____15588
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____15589 = coll;
      if(and__3822__auto____15589) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____15589
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____15590 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____15591 = cljs.core._reduce[goog.typeOf(x__2363__auto____15590)];
        if(or__3824__auto____15591) {
          return or__3824__auto____15591
        }else {
          var or__3824__auto____15592 = cljs.core._reduce["_"];
          if(or__3824__auto____15592) {
            return or__3824__auto____15592
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____15597 = coll;
    if(and__3822__auto____15597) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____15597
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____15598 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15599 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____15598)];
      if(or__3824__auto____15599) {
        return or__3824__auto____15599
      }else {
        var or__3824__auto____15600 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____15600) {
          return or__3824__auto____15600
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____15605 = o;
    if(and__3822__auto____15605) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____15605
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____15606 = o == null ? null : o;
    return function() {
      var or__3824__auto____15607 = cljs.core._equiv[goog.typeOf(x__2363__auto____15606)];
      if(or__3824__auto____15607) {
        return or__3824__auto____15607
      }else {
        var or__3824__auto____15608 = cljs.core._equiv["_"];
        if(or__3824__auto____15608) {
          return or__3824__auto____15608
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____15613 = o;
    if(and__3822__auto____15613) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____15613
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____15614 = o == null ? null : o;
    return function() {
      var or__3824__auto____15615 = cljs.core._hash[goog.typeOf(x__2363__auto____15614)];
      if(or__3824__auto____15615) {
        return or__3824__auto____15615
      }else {
        var or__3824__auto____15616 = cljs.core._hash["_"];
        if(or__3824__auto____15616) {
          return or__3824__auto____15616
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____15621 = o;
    if(and__3822__auto____15621) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____15621
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____15622 = o == null ? null : o;
    return function() {
      var or__3824__auto____15623 = cljs.core._seq[goog.typeOf(x__2363__auto____15622)];
      if(or__3824__auto____15623) {
        return or__3824__auto____15623
      }else {
        var or__3824__auto____15624 = cljs.core._seq["_"];
        if(or__3824__auto____15624) {
          return or__3824__auto____15624
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____15629 = coll;
    if(and__3822__auto____15629) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____15629
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____15630 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15631 = cljs.core._rseq[goog.typeOf(x__2363__auto____15630)];
      if(or__3824__auto____15631) {
        return or__3824__auto____15631
      }else {
        var or__3824__auto____15632 = cljs.core._rseq["_"];
        if(or__3824__auto____15632) {
          return or__3824__auto____15632
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____15637 = coll;
    if(and__3822__auto____15637) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____15637
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____15638 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15639 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____15638)];
      if(or__3824__auto____15639) {
        return or__3824__auto____15639
      }else {
        var or__3824__auto____15640 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____15640) {
          return or__3824__auto____15640
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____15645 = coll;
    if(and__3822__auto____15645) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____15645
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____15646 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15647 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____15646)];
      if(or__3824__auto____15647) {
        return or__3824__auto____15647
      }else {
        var or__3824__auto____15648 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____15648) {
          return or__3824__auto____15648
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____15653 = coll;
    if(and__3822__auto____15653) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____15653
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____15654 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15655 = cljs.core._entry_key[goog.typeOf(x__2363__auto____15654)];
      if(or__3824__auto____15655) {
        return or__3824__auto____15655
      }else {
        var or__3824__auto____15656 = cljs.core._entry_key["_"];
        if(or__3824__auto____15656) {
          return or__3824__auto____15656
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____15661 = coll;
    if(and__3822__auto____15661) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____15661
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____15662 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15663 = cljs.core._comparator[goog.typeOf(x__2363__auto____15662)];
      if(or__3824__auto____15663) {
        return or__3824__auto____15663
      }else {
        var or__3824__auto____15664 = cljs.core._comparator["_"];
        if(or__3824__auto____15664) {
          return or__3824__auto____15664
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____15669 = o;
    if(and__3822__auto____15669) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____15669
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____15670 = o == null ? null : o;
    return function() {
      var or__3824__auto____15671 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____15670)];
      if(or__3824__auto____15671) {
        return or__3824__auto____15671
      }else {
        var or__3824__auto____15672 = cljs.core._pr_seq["_"];
        if(or__3824__auto____15672) {
          return or__3824__auto____15672
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____15677 = d;
    if(and__3822__auto____15677) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____15677
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____15678 = d == null ? null : d;
    return function() {
      var or__3824__auto____15679 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____15678)];
      if(or__3824__auto____15679) {
        return or__3824__auto____15679
      }else {
        var or__3824__auto____15680 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____15680) {
          return or__3824__auto____15680
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____15685 = this$;
    if(and__3822__auto____15685) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____15685
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____15686 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____15687 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____15686)];
      if(or__3824__auto____15687) {
        return or__3824__auto____15687
      }else {
        var or__3824__auto____15688 = cljs.core._notify_watches["_"];
        if(or__3824__auto____15688) {
          return or__3824__auto____15688
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____15693 = this$;
    if(and__3822__auto____15693) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____15693
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____15694 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____15695 = cljs.core._add_watch[goog.typeOf(x__2363__auto____15694)];
      if(or__3824__auto____15695) {
        return or__3824__auto____15695
      }else {
        var or__3824__auto____15696 = cljs.core._add_watch["_"];
        if(or__3824__auto____15696) {
          return or__3824__auto____15696
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____15701 = this$;
    if(and__3822__auto____15701) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____15701
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____15702 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____15703 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____15702)];
      if(or__3824__auto____15703) {
        return or__3824__auto____15703
      }else {
        var or__3824__auto____15704 = cljs.core._remove_watch["_"];
        if(or__3824__auto____15704) {
          return or__3824__auto____15704
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____15709 = coll;
    if(and__3822__auto____15709) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____15709
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____15710 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15711 = cljs.core._as_transient[goog.typeOf(x__2363__auto____15710)];
      if(or__3824__auto____15711) {
        return or__3824__auto____15711
      }else {
        var or__3824__auto____15712 = cljs.core._as_transient["_"];
        if(or__3824__auto____15712) {
          return or__3824__auto____15712
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____15717 = tcoll;
    if(and__3822__auto____15717) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____15717
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____15718 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15719 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____15718)];
      if(or__3824__auto____15719) {
        return or__3824__auto____15719
      }else {
        var or__3824__auto____15720 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____15720) {
          return or__3824__auto____15720
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____15725 = tcoll;
    if(and__3822__auto____15725) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____15725
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____15726 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15727 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____15726)];
      if(or__3824__auto____15727) {
        return or__3824__auto____15727
      }else {
        var or__3824__auto____15728 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____15728) {
          return or__3824__auto____15728
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____15733 = tcoll;
    if(and__3822__auto____15733) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____15733
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____15734 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15735 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____15734)];
      if(or__3824__auto____15735) {
        return or__3824__auto____15735
      }else {
        var or__3824__auto____15736 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____15736) {
          return or__3824__auto____15736
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____15741 = tcoll;
    if(and__3822__auto____15741) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____15741
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____15742 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15743 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____15742)];
      if(or__3824__auto____15743) {
        return or__3824__auto____15743
      }else {
        var or__3824__auto____15744 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____15744) {
          return or__3824__auto____15744
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____15749 = tcoll;
    if(and__3822__auto____15749) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____15749
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____15750 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15751 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____15750)];
      if(or__3824__auto____15751) {
        return or__3824__auto____15751
      }else {
        var or__3824__auto____15752 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____15752) {
          return or__3824__auto____15752
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____15757 = tcoll;
    if(and__3822__auto____15757) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____15757
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____15758 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15759 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____15758)];
      if(or__3824__auto____15759) {
        return or__3824__auto____15759
      }else {
        var or__3824__auto____15760 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____15760) {
          return or__3824__auto____15760
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____15765 = tcoll;
    if(and__3822__auto____15765) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____15765
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____15766 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15767 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____15766)];
      if(or__3824__auto____15767) {
        return or__3824__auto____15767
      }else {
        var or__3824__auto____15768 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____15768) {
          return or__3824__auto____15768
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____15773 = x;
    if(and__3822__auto____15773) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____15773
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____15774 = x == null ? null : x;
    return function() {
      var or__3824__auto____15775 = cljs.core._compare[goog.typeOf(x__2363__auto____15774)];
      if(or__3824__auto____15775) {
        return or__3824__auto____15775
      }else {
        var or__3824__auto____15776 = cljs.core._compare["_"];
        if(or__3824__auto____15776) {
          return or__3824__auto____15776
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____15781 = coll;
    if(and__3822__auto____15781) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____15781
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____15782 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15783 = cljs.core._drop_first[goog.typeOf(x__2363__auto____15782)];
      if(or__3824__auto____15783) {
        return or__3824__auto____15783
      }else {
        var or__3824__auto____15784 = cljs.core._drop_first["_"];
        if(or__3824__auto____15784) {
          return or__3824__auto____15784
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____15789 = coll;
    if(and__3822__auto____15789) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____15789
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____15790 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15791 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____15790)];
      if(or__3824__auto____15791) {
        return or__3824__auto____15791
      }else {
        var or__3824__auto____15792 = cljs.core._chunked_first["_"];
        if(or__3824__auto____15792) {
          return or__3824__auto____15792
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____15797 = coll;
    if(and__3822__auto____15797) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____15797
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____15798 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15799 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____15798)];
      if(or__3824__auto____15799) {
        return or__3824__auto____15799
      }else {
        var or__3824__auto____15800 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____15800) {
          return or__3824__auto____15800
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____15805 = coll;
    if(and__3822__auto____15805) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____15805
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____15806 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15807 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____15806)];
      if(or__3824__auto____15807) {
        return or__3824__auto____15807
      }else {
        var or__3824__auto____15808 = cljs.core._chunked_next["_"];
        if(or__3824__auto____15808) {
          return or__3824__auto____15808
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____15810 = x === y;
    if(or__3824__auto____15810) {
      return or__3824__auto____15810
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__15811__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__15812 = y;
            var G__15813 = cljs.core.first.call(null, more);
            var G__15814 = cljs.core.next.call(null, more);
            x = G__15812;
            y = G__15813;
            more = G__15814;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__15811 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15811__delegate.call(this, x, y, more)
    };
    G__15811.cljs$lang$maxFixedArity = 2;
    G__15811.cljs$lang$applyTo = function(arglist__15815) {
      var x = cljs.core.first(arglist__15815);
      var y = cljs.core.first(cljs.core.next(arglist__15815));
      var more = cljs.core.rest(cljs.core.next(arglist__15815));
      return G__15811__delegate(x, y, more)
    };
    G__15811.cljs$lang$arity$variadic = G__15811__delegate;
    return G__15811
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__15816 = null;
  var G__15816__2 = function(o, k) {
    return null
  };
  var G__15816__3 = function(o, k, not_found) {
    return not_found
  };
  G__15816 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15816__2.call(this, o, k);
      case 3:
        return G__15816__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15816
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__15817 = null;
  var G__15817__2 = function(_, f) {
    return f.call(null)
  };
  var G__15817__3 = function(_, f, start) {
    return start
  };
  G__15817 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__15817__2.call(this, _, f);
      case 3:
        return G__15817__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15817
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__15818 = null;
  var G__15818__2 = function(_, n) {
    return null
  };
  var G__15818__3 = function(_, n, not_found) {
    return not_found
  };
  G__15818 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15818__2.call(this, _, n);
      case 3:
        return G__15818__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15818
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____15819 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____15819) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____15819
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__15832 = cljs.core._count.call(null, cicoll);
    if(cnt__15832 === 0) {
      return f.call(null)
    }else {
      var val__15833 = cljs.core._nth.call(null, cicoll, 0);
      var n__15834 = 1;
      while(true) {
        if(n__15834 < cnt__15832) {
          var nval__15835 = f.call(null, val__15833, cljs.core._nth.call(null, cicoll, n__15834));
          if(cljs.core.reduced_QMARK_.call(null, nval__15835)) {
            return cljs.core.deref.call(null, nval__15835)
          }else {
            var G__15844 = nval__15835;
            var G__15845 = n__15834 + 1;
            val__15833 = G__15844;
            n__15834 = G__15845;
            continue
          }
        }else {
          return val__15833
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__15836 = cljs.core._count.call(null, cicoll);
    var val__15837 = val;
    var n__15838 = 0;
    while(true) {
      if(n__15838 < cnt__15836) {
        var nval__15839 = f.call(null, val__15837, cljs.core._nth.call(null, cicoll, n__15838));
        if(cljs.core.reduced_QMARK_.call(null, nval__15839)) {
          return cljs.core.deref.call(null, nval__15839)
        }else {
          var G__15846 = nval__15839;
          var G__15847 = n__15838 + 1;
          val__15837 = G__15846;
          n__15838 = G__15847;
          continue
        }
      }else {
        return val__15837
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__15840 = cljs.core._count.call(null, cicoll);
    var val__15841 = val;
    var n__15842 = idx;
    while(true) {
      if(n__15842 < cnt__15840) {
        var nval__15843 = f.call(null, val__15841, cljs.core._nth.call(null, cicoll, n__15842));
        if(cljs.core.reduced_QMARK_.call(null, nval__15843)) {
          return cljs.core.deref.call(null, nval__15843)
        }else {
          var G__15848 = nval__15843;
          var G__15849 = n__15842 + 1;
          val__15841 = G__15848;
          n__15842 = G__15849;
          continue
        }
      }else {
        return val__15841
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__15862 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__15863 = arr[0];
      var n__15864 = 1;
      while(true) {
        if(n__15864 < cnt__15862) {
          var nval__15865 = f.call(null, val__15863, arr[n__15864]);
          if(cljs.core.reduced_QMARK_.call(null, nval__15865)) {
            return cljs.core.deref.call(null, nval__15865)
          }else {
            var G__15874 = nval__15865;
            var G__15875 = n__15864 + 1;
            val__15863 = G__15874;
            n__15864 = G__15875;
            continue
          }
        }else {
          return val__15863
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__15866 = arr.length;
    var val__15867 = val;
    var n__15868 = 0;
    while(true) {
      if(n__15868 < cnt__15866) {
        var nval__15869 = f.call(null, val__15867, arr[n__15868]);
        if(cljs.core.reduced_QMARK_.call(null, nval__15869)) {
          return cljs.core.deref.call(null, nval__15869)
        }else {
          var G__15876 = nval__15869;
          var G__15877 = n__15868 + 1;
          val__15867 = G__15876;
          n__15868 = G__15877;
          continue
        }
      }else {
        return val__15867
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__15870 = arr.length;
    var val__15871 = val;
    var n__15872 = idx;
    while(true) {
      if(n__15872 < cnt__15870) {
        var nval__15873 = f.call(null, val__15871, arr[n__15872]);
        if(cljs.core.reduced_QMARK_.call(null, nval__15873)) {
          return cljs.core.deref.call(null, nval__15873)
        }else {
          var G__15878 = nval__15873;
          var G__15879 = n__15872 + 1;
          val__15871 = G__15878;
          n__15872 = G__15879;
          continue
        }
      }else {
        return val__15871
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15880 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__15881 = this;
  if(this__15881.i + 1 < this__15881.a.length) {
    return new cljs.core.IndexedSeq(this__15881.a, this__15881.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15882 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__15883 = this;
  var c__15884 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__15884 > 0) {
    return new cljs.core.RSeq(coll, c__15884 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__15885 = this;
  var this__15886 = this;
  return cljs.core.pr_str.call(null, this__15886)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__15887 = this;
  if(cljs.core.counted_QMARK_.call(null, this__15887.a)) {
    return cljs.core.ci_reduce.call(null, this__15887.a, f, this__15887.a[this__15887.i], this__15887.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__15887.a[this__15887.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__15888 = this;
  if(cljs.core.counted_QMARK_.call(null, this__15888.a)) {
    return cljs.core.ci_reduce.call(null, this__15888.a, f, start, this__15888.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__15889 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__15890 = this;
  return this__15890.a.length - this__15890.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__15891 = this;
  return this__15891.a[this__15891.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__15892 = this;
  if(this__15892.i + 1 < this__15892.a.length) {
    return new cljs.core.IndexedSeq(this__15892.a, this__15892.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15893 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15894 = this;
  var i__15895 = n + this__15894.i;
  if(i__15895 < this__15894.a.length) {
    return this__15894.a[i__15895]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15896 = this;
  var i__15897 = n + this__15896.i;
  if(i__15897 < this__15896.a.length) {
    return this__15896.a[i__15897]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__15898 = null;
  var G__15898__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__15898__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__15898 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__15898__2.call(this, array, f);
      case 3:
        return G__15898__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15898
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__15899 = null;
  var G__15899__2 = function(array, k) {
    return array[k]
  };
  var G__15899__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__15899 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15899__2.call(this, array, k);
      case 3:
        return G__15899__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15899
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__15900 = null;
  var G__15900__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__15900__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__15900 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15900__2.call(this, array, n);
      case 3:
        return G__15900__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15900
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15901 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15902 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__15903 = this;
  var this__15904 = this;
  return cljs.core.pr_str.call(null, this__15904)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15905 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15906 = this;
  return this__15906.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15907 = this;
  return cljs.core._nth.call(null, this__15907.ci, this__15907.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15908 = this;
  if(this__15908.i > 0) {
    return new cljs.core.RSeq(this__15908.ci, this__15908.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15909 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__15910 = this;
  return new cljs.core.RSeq(this__15910.ci, this__15910.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15911 = this;
  return this__15911.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__15915__15916 = coll;
      if(G__15915__15916) {
        if(function() {
          var or__3824__auto____15917 = G__15915__15916.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____15917) {
            return or__3824__auto____15917
          }else {
            return G__15915__15916.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__15915__15916.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__15915__15916)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__15915__15916)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__15922__15923 = coll;
      if(G__15922__15923) {
        if(function() {
          var or__3824__auto____15924 = G__15922__15923.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____15924) {
            return or__3824__auto____15924
          }else {
            return G__15922__15923.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__15922__15923.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15922__15923)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15922__15923)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__15925 = cljs.core.seq.call(null, coll);
      if(s__15925 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__15925)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__15930__15931 = coll;
      if(G__15930__15931) {
        if(function() {
          var or__3824__auto____15932 = G__15930__15931.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____15932) {
            return or__3824__auto____15932
          }else {
            return G__15930__15931.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__15930__15931.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15930__15931)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15930__15931)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__15933 = cljs.core.seq.call(null, coll);
      if(!(s__15933 == null)) {
        return cljs.core._rest.call(null, s__15933)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__15937__15938 = coll;
      if(G__15937__15938) {
        if(function() {
          var or__3824__auto____15939 = G__15937__15938.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____15939) {
            return or__3824__auto____15939
          }else {
            return G__15937__15938.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__15937__15938.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__15937__15938)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__15937__15938)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__15941 = cljs.core.next.call(null, s);
    if(!(sn__15941 == null)) {
      var G__15942 = sn__15941;
      s = G__15942;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__15943__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__15944 = conj.call(null, coll, x);
          var G__15945 = cljs.core.first.call(null, xs);
          var G__15946 = cljs.core.next.call(null, xs);
          coll = G__15944;
          x = G__15945;
          xs = G__15946;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__15943 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15943__delegate.call(this, coll, x, xs)
    };
    G__15943.cljs$lang$maxFixedArity = 2;
    G__15943.cljs$lang$applyTo = function(arglist__15947) {
      var coll = cljs.core.first(arglist__15947);
      var x = cljs.core.first(cljs.core.next(arglist__15947));
      var xs = cljs.core.rest(cljs.core.next(arglist__15947));
      return G__15943__delegate(coll, x, xs)
    };
    G__15943.cljs$lang$arity$variadic = G__15943__delegate;
    return G__15943
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__15950 = cljs.core.seq.call(null, coll);
  var acc__15951 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__15950)) {
      return acc__15951 + cljs.core._count.call(null, s__15950)
    }else {
      var G__15952 = cljs.core.next.call(null, s__15950);
      var G__15953 = acc__15951 + 1;
      s__15950 = G__15952;
      acc__15951 = G__15953;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__15960__15961 = coll;
        if(G__15960__15961) {
          if(function() {
            var or__3824__auto____15962 = G__15960__15961.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____15962) {
              return or__3824__auto____15962
            }else {
              return G__15960__15961.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__15960__15961.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15960__15961)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15960__15961)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__15963__15964 = coll;
        if(G__15963__15964) {
          if(function() {
            var or__3824__auto____15965 = G__15963__15964.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____15965) {
              return or__3824__auto____15965
            }else {
              return G__15963__15964.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__15963__15964.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15963__15964)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15963__15964)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__15968__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__15967 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__15969 = ret__15967;
          var G__15970 = cljs.core.first.call(null, kvs);
          var G__15971 = cljs.core.second.call(null, kvs);
          var G__15972 = cljs.core.nnext.call(null, kvs);
          coll = G__15969;
          k = G__15970;
          v = G__15971;
          kvs = G__15972;
          continue
        }else {
          return ret__15967
        }
        break
      }
    };
    var G__15968 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15968__delegate.call(this, coll, k, v, kvs)
    };
    G__15968.cljs$lang$maxFixedArity = 3;
    G__15968.cljs$lang$applyTo = function(arglist__15973) {
      var coll = cljs.core.first(arglist__15973);
      var k = cljs.core.first(cljs.core.next(arglist__15973));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15973)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15973)));
      return G__15968__delegate(coll, k, v, kvs)
    };
    G__15968.cljs$lang$arity$variadic = G__15968__delegate;
    return G__15968
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__15976__delegate = function(coll, k, ks) {
      while(true) {
        var ret__15975 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__15977 = ret__15975;
          var G__15978 = cljs.core.first.call(null, ks);
          var G__15979 = cljs.core.next.call(null, ks);
          coll = G__15977;
          k = G__15978;
          ks = G__15979;
          continue
        }else {
          return ret__15975
        }
        break
      }
    };
    var G__15976 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15976__delegate.call(this, coll, k, ks)
    };
    G__15976.cljs$lang$maxFixedArity = 2;
    G__15976.cljs$lang$applyTo = function(arglist__15980) {
      var coll = cljs.core.first(arglist__15980);
      var k = cljs.core.first(cljs.core.next(arglist__15980));
      var ks = cljs.core.rest(cljs.core.next(arglist__15980));
      return G__15976__delegate(coll, k, ks)
    };
    G__15976.cljs$lang$arity$variadic = G__15976__delegate;
    return G__15976
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__15984__15985 = o;
    if(G__15984__15985) {
      if(function() {
        var or__3824__auto____15986 = G__15984__15985.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____15986) {
          return or__3824__auto____15986
        }else {
          return G__15984__15985.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__15984__15985.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__15984__15985)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__15984__15985)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__15989__delegate = function(coll, k, ks) {
      while(true) {
        var ret__15988 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__15990 = ret__15988;
          var G__15991 = cljs.core.first.call(null, ks);
          var G__15992 = cljs.core.next.call(null, ks);
          coll = G__15990;
          k = G__15991;
          ks = G__15992;
          continue
        }else {
          return ret__15988
        }
        break
      }
    };
    var G__15989 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15989__delegate.call(this, coll, k, ks)
    };
    G__15989.cljs$lang$maxFixedArity = 2;
    G__15989.cljs$lang$applyTo = function(arglist__15993) {
      var coll = cljs.core.first(arglist__15993);
      var k = cljs.core.first(cljs.core.next(arglist__15993));
      var ks = cljs.core.rest(cljs.core.next(arglist__15993));
      return G__15989__delegate(coll, k, ks)
    };
    G__15989.cljs$lang$arity$variadic = G__15989__delegate;
    return G__15989
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__15995 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__15995;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__15995
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__15997 = cljs.core.string_hash_cache[k];
  if(!(h__15997 == null)) {
    return h__15997
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____15999 = goog.isString(o);
      if(and__3822__auto____15999) {
        return check_cache
      }else {
        return and__3822__auto____15999
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__16003__16004 = x;
    if(G__16003__16004) {
      if(function() {
        var or__3824__auto____16005 = G__16003__16004.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____16005) {
          return or__3824__auto____16005
        }else {
          return G__16003__16004.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__16003__16004.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__16003__16004)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__16003__16004)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__16009__16010 = x;
    if(G__16009__16010) {
      if(function() {
        var or__3824__auto____16011 = G__16009__16010.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____16011) {
          return or__3824__auto____16011
        }else {
          return G__16009__16010.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__16009__16010.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__16009__16010)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__16009__16010)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__16015__16016 = x;
  if(G__16015__16016) {
    if(function() {
      var or__3824__auto____16017 = G__16015__16016.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____16017) {
        return or__3824__auto____16017
      }else {
        return G__16015__16016.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__16015__16016.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__16015__16016)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__16015__16016)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__16021__16022 = x;
  if(G__16021__16022) {
    if(function() {
      var or__3824__auto____16023 = G__16021__16022.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____16023) {
        return or__3824__auto____16023
      }else {
        return G__16021__16022.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__16021__16022.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__16021__16022)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__16021__16022)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__16027__16028 = x;
  if(G__16027__16028) {
    if(function() {
      var or__3824__auto____16029 = G__16027__16028.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____16029) {
        return or__3824__auto____16029
      }else {
        return G__16027__16028.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__16027__16028.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__16027__16028)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__16027__16028)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__16033__16034 = x;
  if(G__16033__16034) {
    if(function() {
      var or__3824__auto____16035 = G__16033__16034.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____16035) {
        return or__3824__auto____16035
      }else {
        return G__16033__16034.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__16033__16034.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__16033__16034)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__16033__16034)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__16039__16040 = x;
  if(G__16039__16040) {
    if(function() {
      var or__3824__auto____16041 = G__16039__16040.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____16041) {
        return or__3824__auto____16041
      }else {
        return G__16039__16040.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__16039__16040.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16039__16040)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16039__16040)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__16045__16046 = x;
    if(G__16045__16046) {
      if(function() {
        var or__3824__auto____16047 = G__16045__16046.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____16047) {
          return or__3824__auto____16047
        }else {
          return G__16045__16046.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__16045__16046.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__16045__16046)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__16045__16046)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__16051__16052 = x;
  if(G__16051__16052) {
    if(function() {
      var or__3824__auto____16053 = G__16051__16052.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____16053) {
        return or__3824__auto____16053
      }else {
        return G__16051__16052.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__16051__16052.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__16051__16052)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__16051__16052)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__16057__16058 = x;
  if(G__16057__16058) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____16059 = null;
      if(cljs.core.truth_(or__3824__auto____16059)) {
        return or__3824__auto____16059
      }else {
        return G__16057__16058.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__16057__16058.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__16057__16058)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__16057__16058)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__16060__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__16060 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__16060__delegate.call(this, keyvals)
    };
    G__16060.cljs$lang$maxFixedArity = 0;
    G__16060.cljs$lang$applyTo = function(arglist__16061) {
      var keyvals = cljs.core.seq(arglist__16061);
      return G__16060__delegate(keyvals)
    };
    G__16060.cljs$lang$arity$variadic = G__16060__delegate;
    return G__16060
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__16063 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__16063.push(key)
  });
  return keys__16063
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__16067 = i;
  var j__16068 = j;
  var len__16069 = len;
  while(true) {
    if(len__16069 === 0) {
      return to
    }else {
      to[j__16068] = from[i__16067];
      var G__16070 = i__16067 + 1;
      var G__16071 = j__16068 + 1;
      var G__16072 = len__16069 - 1;
      i__16067 = G__16070;
      j__16068 = G__16071;
      len__16069 = G__16072;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__16076 = i + (len - 1);
  var j__16077 = j + (len - 1);
  var len__16078 = len;
  while(true) {
    if(len__16078 === 0) {
      return to
    }else {
      to[j__16077] = from[i__16076];
      var G__16079 = i__16076 - 1;
      var G__16080 = j__16077 - 1;
      var G__16081 = len__16078 - 1;
      i__16076 = G__16079;
      j__16077 = G__16080;
      len__16078 = G__16081;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__16085__16086 = s;
    if(G__16085__16086) {
      if(function() {
        var or__3824__auto____16087 = G__16085__16086.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____16087) {
          return or__3824__auto____16087
        }else {
          return G__16085__16086.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__16085__16086.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__16085__16086)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__16085__16086)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__16091__16092 = s;
  if(G__16091__16092) {
    if(function() {
      var or__3824__auto____16093 = G__16091__16092.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____16093) {
        return or__3824__auto____16093
      }else {
        return G__16091__16092.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__16091__16092.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__16091__16092)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__16091__16092)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____16096 = goog.isString(x);
  if(and__3822__auto____16096) {
    return!function() {
      var or__3824__auto____16097 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____16097) {
        return or__3824__auto____16097
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____16096
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____16099 = goog.isString(x);
  if(and__3822__auto____16099) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____16099
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____16101 = goog.isString(x);
  if(and__3822__auto____16101) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____16101
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____16106 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____16106) {
    return or__3824__auto____16106
  }else {
    var G__16107__16108 = f;
    if(G__16107__16108) {
      if(function() {
        var or__3824__auto____16109 = G__16107__16108.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____16109) {
          return or__3824__auto____16109
        }else {
          return G__16107__16108.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__16107__16108.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__16107__16108)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__16107__16108)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____16111 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____16111) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____16111
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____16114 = coll;
    if(cljs.core.truth_(and__3822__auto____16114)) {
      var and__3822__auto____16115 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____16115) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____16115
      }
    }else {
      return and__3822__auto____16114
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__16124__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__16120 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__16121 = more;
        while(true) {
          var x__16122 = cljs.core.first.call(null, xs__16121);
          var etc__16123 = cljs.core.next.call(null, xs__16121);
          if(cljs.core.truth_(xs__16121)) {
            if(cljs.core.contains_QMARK_.call(null, s__16120, x__16122)) {
              return false
            }else {
              var G__16125 = cljs.core.conj.call(null, s__16120, x__16122);
              var G__16126 = etc__16123;
              s__16120 = G__16125;
              xs__16121 = G__16126;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__16124 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16124__delegate.call(this, x, y, more)
    };
    G__16124.cljs$lang$maxFixedArity = 2;
    G__16124.cljs$lang$applyTo = function(arglist__16127) {
      var x = cljs.core.first(arglist__16127);
      var y = cljs.core.first(cljs.core.next(arglist__16127));
      var more = cljs.core.rest(cljs.core.next(arglist__16127));
      return G__16124__delegate(x, y, more)
    };
    G__16124.cljs$lang$arity$variadic = G__16124__delegate;
    return G__16124
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__16131__16132 = x;
            if(G__16131__16132) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____16133 = null;
                if(cljs.core.truth_(or__3824__auto____16133)) {
                  return or__3824__auto____16133
                }else {
                  return G__16131__16132.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__16131__16132.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__16131__16132)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__16131__16132)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__16138 = cljs.core.count.call(null, xs);
    var yl__16139 = cljs.core.count.call(null, ys);
    if(xl__16138 < yl__16139) {
      return-1
    }else {
      if(xl__16138 > yl__16139) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__16138, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__16140 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____16141 = d__16140 === 0;
        if(and__3822__auto____16141) {
          return n + 1 < len
        }else {
          return and__3822__auto____16141
        }
      }()) {
        var G__16142 = xs;
        var G__16143 = ys;
        var G__16144 = len;
        var G__16145 = n + 1;
        xs = G__16142;
        ys = G__16143;
        len = G__16144;
        n = G__16145;
        continue
      }else {
        return d__16140
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__16147 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__16147)) {
        return r__16147
      }else {
        if(cljs.core.truth_(r__16147)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__16149 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__16149, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__16149)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____16155 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____16155) {
      var s__16156 = temp__3971__auto____16155;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__16156), cljs.core.next.call(null, s__16156))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__16157 = val;
    var coll__16158 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__16158) {
        var nval__16159 = f.call(null, val__16157, cljs.core.first.call(null, coll__16158));
        if(cljs.core.reduced_QMARK_.call(null, nval__16159)) {
          return cljs.core.deref.call(null, nval__16159)
        }else {
          var G__16160 = nval__16159;
          var G__16161 = cljs.core.next.call(null, coll__16158);
          val__16157 = G__16160;
          coll__16158 = G__16161;
          continue
        }
      }else {
        return val__16157
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__16163 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__16163);
  return cljs.core.vec.call(null, a__16163)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__16170__16171 = coll;
      if(G__16170__16171) {
        if(function() {
          var or__3824__auto____16172 = G__16170__16171.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____16172) {
            return or__3824__auto____16172
          }else {
            return G__16170__16171.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__16170__16171.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16170__16171)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16170__16171)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__16173__16174 = coll;
      if(G__16173__16174) {
        if(function() {
          var or__3824__auto____16175 = G__16173__16174.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____16175) {
            return or__3824__auto____16175
          }else {
            return G__16173__16174.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__16173__16174.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16173__16174)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16173__16174)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__16176 = this;
  return this__16176.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__16177__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__16177 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16177__delegate.call(this, x, y, more)
    };
    G__16177.cljs$lang$maxFixedArity = 2;
    G__16177.cljs$lang$applyTo = function(arglist__16178) {
      var x = cljs.core.first(arglist__16178);
      var y = cljs.core.first(cljs.core.next(arglist__16178));
      var more = cljs.core.rest(cljs.core.next(arglist__16178));
      return G__16177__delegate(x, y, more)
    };
    G__16177.cljs$lang$arity$variadic = G__16177__delegate;
    return G__16177
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__16179__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__16179 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16179__delegate.call(this, x, y, more)
    };
    G__16179.cljs$lang$maxFixedArity = 2;
    G__16179.cljs$lang$applyTo = function(arglist__16180) {
      var x = cljs.core.first(arglist__16180);
      var y = cljs.core.first(cljs.core.next(arglist__16180));
      var more = cljs.core.rest(cljs.core.next(arglist__16180));
      return G__16179__delegate(x, y, more)
    };
    G__16179.cljs$lang$arity$variadic = G__16179__delegate;
    return G__16179
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__16181__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__16181 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16181__delegate.call(this, x, y, more)
    };
    G__16181.cljs$lang$maxFixedArity = 2;
    G__16181.cljs$lang$applyTo = function(arglist__16182) {
      var x = cljs.core.first(arglist__16182);
      var y = cljs.core.first(cljs.core.next(arglist__16182));
      var more = cljs.core.rest(cljs.core.next(arglist__16182));
      return G__16181__delegate(x, y, more)
    };
    G__16181.cljs$lang$arity$variadic = G__16181__delegate;
    return G__16181
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__16183__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__16183 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16183__delegate.call(this, x, y, more)
    };
    G__16183.cljs$lang$maxFixedArity = 2;
    G__16183.cljs$lang$applyTo = function(arglist__16184) {
      var x = cljs.core.first(arglist__16184);
      var y = cljs.core.first(cljs.core.next(arglist__16184));
      var more = cljs.core.rest(cljs.core.next(arglist__16184));
      return G__16183__delegate(x, y, more)
    };
    G__16183.cljs$lang$arity$variadic = G__16183__delegate;
    return G__16183
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__16185__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__16186 = y;
            var G__16187 = cljs.core.first.call(null, more);
            var G__16188 = cljs.core.next.call(null, more);
            x = G__16186;
            y = G__16187;
            more = G__16188;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__16185 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16185__delegate.call(this, x, y, more)
    };
    G__16185.cljs$lang$maxFixedArity = 2;
    G__16185.cljs$lang$applyTo = function(arglist__16189) {
      var x = cljs.core.first(arglist__16189);
      var y = cljs.core.first(cljs.core.next(arglist__16189));
      var more = cljs.core.rest(cljs.core.next(arglist__16189));
      return G__16185__delegate(x, y, more)
    };
    G__16185.cljs$lang$arity$variadic = G__16185__delegate;
    return G__16185
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__16190__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__16191 = y;
            var G__16192 = cljs.core.first.call(null, more);
            var G__16193 = cljs.core.next.call(null, more);
            x = G__16191;
            y = G__16192;
            more = G__16193;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__16190 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16190__delegate.call(this, x, y, more)
    };
    G__16190.cljs$lang$maxFixedArity = 2;
    G__16190.cljs$lang$applyTo = function(arglist__16194) {
      var x = cljs.core.first(arglist__16194);
      var y = cljs.core.first(cljs.core.next(arglist__16194));
      var more = cljs.core.rest(cljs.core.next(arglist__16194));
      return G__16190__delegate(x, y, more)
    };
    G__16190.cljs$lang$arity$variadic = G__16190__delegate;
    return G__16190
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__16195__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__16196 = y;
            var G__16197 = cljs.core.first.call(null, more);
            var G__16198 = cljs.core.next.call(null, more);
            x = G__16196;
            y = G__16197;
            more = G__16198;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__16195 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16195__delegate.call(this, x, y, more)
    };
    G__16195.cljs$lang$maxFixedArity = 2;
    G__16195.cljs$lang$applyTo = function(arglist__16199) {
      var x = cljs.core.first(arglist__16199);
      var y = cljs.core.first(cljs.core.next(arglist__16199));
      var more = cljs.core.rest(cljs.core.next(arglist__16199));
      return G__16195__delegate(x, y, more)
    };
    G__16195.cljs$lang$arity$variadic = G__16195__delegate;
    return G__16195
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__16200__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__16201 = y;
            var G__16202 = cljs.core.first.call(null, more);
            var G__16203 = cljs.core.next.call(null, more);
            x = G__16201;
            y = G__16202;
            more = G__16203;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__16200 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16200__delegate.call(this, x, y, more)
    };
    G__16200.cljs$lang$maxFixedArity = 2;
    G__16200.cljs$lang$applyTo = function(arglist__16204) {
      var x = cljs.core.first(arglist__16204);
      var y = cljs.core.first(cljs.core.next(arglist__16204));
      var more = cljs.core.rest(cljs.core.next(arglist__16204));
      return G__16200__delegate(x, y, more)
    };
    G__16200.cljs$lang$arity$variadic = G__16200__delegate;
    return G__16200
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__16205__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__16205 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16205__delegate.call(this, x, y, more)
    };
    G__16205.cljs$lang$maxFixedArity = 2;
    G__16205.cljs$lang$applyTo = function(arglist__16206) {
      var x = cljs.core.first(arglist__16206);
      var y = cljs.core.first(cljs.core.next(arglist__16206));
      var more = cljs.core.rest(cljs.core.next(arglist__16206));
      return G__16205__delegate(x, y, more)
    };
    G__16205.cljs$lang$arity$variadic = G__16205__delegate;
    return G__16205
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__16207__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__16207 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16207__delegate.call(this, x, y, more)
    };
    G__16207.cljs$lang$maxFixedArity = 2;
    G__16207.cljs$lang$applyTo = function(arglist__16208) {
      var x = cljs.core.first(arglist__16208);
      var y = cljs.core.first(cljs.core.next(arglist__16208));
      var more = cljs.core.rest(cljs.core.next(arglist__16208));
      return G__16207__delegate(x, y, more)
    };
    G__16207.cljs$lang$arity$variadic = G__16207__delegate;
    return G__16207
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__16210 = n % d;
  return cljs.core.fix.call(null, (n - rem__16210) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__16212 = cljs.core.quot.call(null, n, d);
  return n - d * q__16212
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__16215 = v - (v >> 1 & 1431655765);
  var v__16216 = (v__16215 & 858993459) + (v__16215 >> 2 & 858993459);
  return(v__16216 + (v__16216 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__16217__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__16218 = y;
            var G__16219 = cljs.core.first.call(null, more);
            var G__16220 = cljs.core.next.call(null, more);
            x = G__16218;
            y = G__16219;
            more = G__16220;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__16217 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16217__delegate.call(this, x, y, more)
    };
    G__16217.cljs$lang$maxFixedArity = 2;
    G__16217.cljs$lang$applyTo = function(arglist__16221) {
      var x = cljs.core.first(arglist__16221);
      var y = cljs.core.first(cljs.core.next(arglist__16221));
      var more = cljs.core.rest(cljs.core.next(arglist__16221));
      return G__16217__delegate(x, y, more)
    };
    G__16217.cljs$lang$arity$variadic = G__16217__delegate;
    return G__16217
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__16225 = n;
  var xs__16226 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____16227 = xs__16226;
      if(and__3822__auto____16227) {
        return n__16225 > 0
      }else {
        return and__3822__auto____16227
      }
    }())) {
      var G__16228 = n__16225 - 1;
      var G__16229 = cljs.core.next.call(null, xs__16226);
      n__16225 = G__16228;
      xs__16226 = G__16229;
      continue
    }else {
      return xs__16226
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__16230__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__16231 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__16232 = cljs.core.next.call(null, more);
            sb = G__16231;
            more = G__16232;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__16230 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__16230__delegate.call(this, x, ys)
    };
    G__16230.cljs$lang$maxFixedArity = 1;
    G__16230.cljs$lang$applyTo = function(arglist__16233) {
      var x = cljs.core.first(arglist__16233);
      var ys = cljs.core.rest(arglist__16233);
      return G__16230__delegate(x, ys)
    };
    G__16230.cljs$lang$arity$variadic = G__16230__delegate;
    return G__16230
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__16234__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__16235 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__16236 = cljs.core.next.call(null, more);
            sb = G__16235;
            more = G__16236;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__16234 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__16234__delegate.call(this, x, ys)
    };
    G__16234.cljs$lang$maxFixedArity = 1;
    G__16234.cljs$lang$applyTo = function(arglist__16237) {
      var x = cljs.core.first(arglist__16237);
      var ys = cljs.core.rest(arglist__16237);
      return G__16234__delegate(x, ys)
    };
    G__16234.cljs$lang$arity$variadic = G__16234__delegate;
    return G__16234
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__16238) {
    var fmt = cljs.core.first(arglist__16238);
    var args = cljs.core.rest(arglist__16238);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__16241 = cljs.core.seq.call(null, x);
    var ys__16242 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__16241 == null) {
        return ys__16242 == null
      }else {
        if(ys__16242 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__16241), cljs.core.first.call(null, ys__16242))) {
            var G__16243 = cljs.core.next.call(null, xs__16241);
            var G__16244 = cljs.core.next.call(null, ys__16242);
            xs__16241 = G__16243;
            ys__16242 = G__16244;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__16245_SHARP_, p2__16246_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__16245_SHARP_, cljs.core.hash.call(null, p2__16246_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__16250 = 0;
  var s__16251 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__16251) {
      var e__16252 = cljs.core.first.call(null, s__16251);
      var G__16253 = (h__16250 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__16252)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__16252)))) % 4503599627370496;
      var G__16254 = cljs.core.next.call(null, s__16251);
      h__16250 = G__16253;
      s__16251 = G__16254;
      continue
    }else {
      return h__16250
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__16258 = 0;
  var s__16259 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__16259) {
      var e__16260 = cljs.core.first.call(null, s__16259);
      var G__16261 = (h__16258 + cljs.core.hash.call(null, e__16260)) % 4503599627370496;
      var G__16262 = cljs.core.next.call(null, s__16259);
      h__16258 = G__16261;
      s__16259 = G__16262;
      continue
    }else {
      return h__16258
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__16283__16284 = cljs.core.seq.call(null, fn_map);
  if(G__16283__16284) {
    var G__16286__16288 = cljs.core.first.call(null, G__16283__16284);
    var vec__16287__16289 = G__16286__16288;
    var key_name__16290 = cljs.core.nth.call(null, vec__16287__16289, 0, null);
    var f__16291 = cljs.core.nth.call(null, vec__16287__16289, 1, null);
    var G__16283__16292 = G__16283__16284;
    var G__16286__16293 = G__16286__16288;
    var G__16283__16294 = G__16283__16292;
    while(true) {
      var vec__16295__16296 = G__16286__16293;
      var key_name__16297 = cljs.core.nth.call(null, vec__16295__16296, 0, null);
      var f__16298 = cljs.core.nth.call(null, vec__16295__16296, 1, null);
      var G__16283__16299 = G__16283__16294;
      var str_name__16300 = cljs.core.name.call(null, key_name__16297);
      obj[str_name__16300] = f__16298;
      var temp__3974__auto____16301 = cljs.core.next.call(null, G__16283__16299);
      if(temp__3974__auto____16301) {
        var G__16283__16302 = temp__3974__auto____16301;
        var G__16303 = cljs.core.first.call(null, G__16283__16302);
        var G__16304 = G__16283__16302;
        G__16286__16293 = G__16303;
        G__16283__16294 = G__16304;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16305 = this;
  var h__2192__auto____16306 = this__16305.__hash;
  if(!(h__2192__auto____16306 == null)) {
    return h__2192__auto____16306
  }else {
    var h__2192__auto____16307 = cljs.core.hash_coll.call(null, coll);
    this__16305.__hash = h__2192__auto____16307;
    return h__2192__auto____16307
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__16308 = this;
  if(this__16308.count === 1) {
    return null
  }else {
    return this__16308.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16309 = this;
  return new cljs.core.List(this__16309.meta, o, coll, this__16309.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__16310 = this;
  var this__16311 = this;
  return cljs.core.pr_str.call(null, this__16311)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16312 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16313 = this;
  return this__16313.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16314 = this;
  return this__16314.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16315 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16316 = this;
  return this__16316.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16317 = this;
  if(this__16317.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__16317.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16318 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16319 = this;
  return new cljs.core.List(meta, this__16319.first, this__16319.rest, this__16319.count, this__16319.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16320 = this;
  return this__16320.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16321 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16322 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__16323 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16324 = this;
  return new cljs.core.List(this__16324.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__16325 = this;
  var this__16326 = this;
  return cljs.core.pr_str.call(null, this__16326)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16327 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16328 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16329 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16330 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16331 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16332 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16333 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16334 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16335 = this;
  return this__16335.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16336 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__16340__16341 = coll;
  if(G__16340__16341) {
    if(function() {
      var or__3824__auto____16342 = G__16340__16341.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____16342) {
        return or__3824__auto____16342
      }else {
        return G__16340__16341.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__16340__16341.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__16340__16341)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__16340__16341)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__16343__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__16343 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16343__delegate.call(this, x, y, z, items)
    };
    G__16343.cljs$lang$maxFixedArity = 3;
    G__16343.cljs$lang$applyTo = function(arglist__16344) {
      var x = cljs.core.first(arglist__16344);
      var y = cljs.core.first(cljs.core.next(arglist__16344));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16344)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16344)));
      return G__16343__delegate(x, y, z, items)
    };
    G__16343.cljs$lang$arity$variadic = G__16343__delegate;
    return G__16343
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16345 = this;
  var h__2192__auto____16346 = this__16345.__hash;
  if(!(h__2192__auto____16346 == null)) {
    return h__2192__auto____16346
  }else {
    var h__2192__auto____16347 = cljs.core.hash_coll.call(null, coll);
    this__16345.__hash = h__2192__auto____16347;
    return h__2192__auto____16347
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__16348 = this;
  if(this__16348.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__16348.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16349 = this;
  return new cljs.core.Cons(null, o, coll, this__16349.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__16350 = this;
  var this__16351 = this;
  return cljs.core.pr_str.call(null, this__16351)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16352 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16353 = this;
  return this__16353.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16354 = this;
  if(this__16354.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__16354.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16355 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16356 = this;
  return new cljs.core.Cons(meta, this__16356.first, this__16356.rest, this__16356.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16357 = this;
  return this__16357.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16358 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16358.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____16363 = coll == null;
    if(or__3824__auto____16363) {
      return or__3824__auto____16363
    }else {
      var G__16364__16365 = coll;
      if(G__16364__16365) {
        if(function() {
          var or__3824__auto____16366 = G__16364__16365.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____16366) {
            return or__3824__auto____16366
          }else {
            return G__16364__16365.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__16364__16365.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__16364__16365)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__16364__16365)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__16370__16371 = x;
  if(G__16370__16371) {
    if(function() {
      var or__3824__auto____16372 = G__16370__16371.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____16372) {
        return or__3824__auto____16372
      }else {
        return G__16370__16371.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__16370__16371.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__16370__16371)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__16370__16371)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__16373 = null;
  var G__16373__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__16373__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__16373 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__16373__2.call(this, string, f);
      case 3:
        return G__16373__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16373
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__16374 = null;
  var G__16374__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__16374__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__16374 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16374__2.call(this, string, k);
      case 3:
        return G__16374__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16374
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__16375 = null;
  var G__16375__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__16375__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__16375 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16375__2.call(this, string, n);
      case 3:
        return G__16375__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16375
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__16387 = null;
  var G__16387__2 = function(this_sym16378, coll) {
    var this__16380 = this;
    var this_sym16378__16381 = this;
    var ___16382 = this_sym16378__16381;
    if(coll == null) {
      return null
    }else {
      var strobj__16383 = coll.strobj;
      if(strobj__16383 == null) {
        return cljs.core._lookup.call(null, coll, this__16380.k, null)
      }else {
        return strobj__16383[this__16380.k]
      }
    }
  };
  var G__16387__3 = function(this_sym16379, coll, not_found) {
    var this__16380 = this;
    var this_sym16379__16384 = this;
    var ___16385 = this_sym16379__16384;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__16380.k, not_found)
    }
  };
  G__16387 = function(this_sym16379, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16387__2.call(this, this_sym16379, coll);
      case 3:
        return G__16387__3.call(this, this_sym16379, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16387
}();
cljs.core.Keyword.prototype.apply = function(this_sym16376, args16377) {
  var this__16386 = this;
  return this_sym16376.call.apply(this_sym16376, [this_sym16376].concat(args16377.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__16396 = null;
  var G__16396__2 = function(this_sym16390, coll) {
    var this_sym16390__16392 = this;
    var this__16393 = this_sym16390__16392;
    return cljs.core._lookup.call(null, coll, this__16393.toString(), null)
  };
  var G__16396__3 = function(this_sym16391, coll, not_found) {
    var this_sym16391__16394 = this;
    var this__16395 = this_sym16391__16394;
    return cljs.core._lookup.call(null, coll, this__16395.toString(), not_found)
  };
  G__16396 = function(this_sym16391, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16396__2.call(this, this_sym16391, coll);
      case 3:
        return G__16396__3.call(this, this_sym16391, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16396
}();
String.prototype.apply = function(this_sym16388, args16389) {
  return this_sym16388.call.apply(this_sym16388, [this_sym16388].concat(args16389.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__16398 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__16398
  }else {
    lazy_seq.x = x__16398.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16399 = this;
  var h__2192__auto____16400 = this__16399.__hash;
  if(!(h__2192__auto____16400 == null)) {
    return h__2192__auto____16400
  }else {
    var h__2192__auto____16401 = cljs.core.hash_coll.call(null, coll);
    this__16399.__hash = h__2192__auto____16401;
    return h__2192__auto____16401
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__16402 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16403 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__16404 = this;
  var this__16405 = this;
  return cljs.core.pr_str.call(null, this__16405)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16406 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16407 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16408 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16409 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16410 = this;
  return new cljs.core.LazySeq(meta, this__16410.realized, this__16410.x, this__16410.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16411 = this;
  return this__16411.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16412 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16412.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__16413 = this;
  return this__16413.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__16414 = this;
  var ___16415 = this;
  this__16414.buf[this__16414.end] = o;
  return this__16414.end = this__16414.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__16416 = this;
  var ___16417 = this;
  var ret__16418 = new cljs.core.ArrayChunk(this__16416.buf, 0, this__16416.end);
  this__16416.buf = null;
  return ret__16418
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__16419 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__16419.arr[this__16419.off], this__16419.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__16420 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__16420.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__16421 = this;
  if(this__16421.off === this__16421.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__16421.arr, this__16421.off + 1, this__16421.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__16422 = this;
  return this__16422.arr[this__16422.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__16423 = this;
  if(function() {
    var and__3822__auto____16424 = i >= 0;
    if(and__3822__auto____16424) {
      return i < this__16423.end - this__16423.off
    }else {
      return and__3822__auto____16424
    }
  }()) {
    return this__16423.arr[this__16423.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__16425 = this;
  return this__16425.end - this__16425.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__16426 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16427 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16428 = this;
  return cljs.core._nth.call(null, this__16428.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16429 = this;
  if(cljs.core._count.call(null, this__16429.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__16429.chunk), this__16429.more, this__16429.meta)
  }else {
    if(this__16429.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__16429.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__16430 = this;
  if(this__16430.more == null) {
    return null
  }else {
    return this__16430.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16431 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__16432 = this;
  return new cljs.core.ChunkedCons(this__16432.chunk, this__16432.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16433 = this;
  return this__16433.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__16434 = this;
  return this__16434.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__16435 = this;
  if(this__16435.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__16435.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__16439__16440 = s;
    if(G__16439__16440) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____16441 = null;
        if(cljs.core.truth_(or__3824__auto____16441)) {
          return or__3824__auto____16441
        }else {
          return G__16439__16440.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__16439__16440.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__16439__16440)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__16439__16440)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__16444 = [];
  var s__16445 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__16445)) {
      ary__16444.push(cljs.core.first.call(null, s__16445));
      var G__16446 = cljs.core.next.call(null, s__16445);
      s__16445 = G__16446;
      continue
    }else {
      return ary__16444
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__16450 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__16451 = 0;
  var xs__16452 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__16452) {
      ret__16450[i__16451] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__16452));
      var G__16453 = i__16451 + 1;
      var G__16454 = cljs.core.next.call(null, xs__16452);
      i__16451 = G__16453;
      xs__16452 = G__16454;
      continue
    }else {
    }
    break
  }
  return ret__16450
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__16462 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__16463 = cljs.core.seq.call(null, init_val_or_seq);
      var i__16464 = 0;
      var s__16465 = s__16463;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____16466 = s__16465;
          if(and__3822__auto____16466) {
            return i__16464 < size
          }else {
            return and__3822__auto____16466
          }
        }())) {
          a__16462[i__16464] = cljs.core.first.call(null, s__16465);
          var G__16469 = i__16464 + 1;
          var G__16470 = cljs.core.next.call(null, s__16465);
          i__16464 = G__16469;
          s__16465 = G__16470;
          continue
        }else {
          return a__16462
        }
        break
      }
    }else {
      var n__2527__auto____16467 = size;
      var i__16468 = 0;
      while(true) {
        if(i__16468 < n__2527__auto____16467) {
          a__16462[i__16468] = init_val_or_seq;
          var G__16471 = i__16468 + 1;
          i__16468 = G__16471;
          continue
        }else {
        }
        break
      }
      return a__16462
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__16479 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__16480 = cljs.core.seq.call(null, init_val_or_seq);
      var i__16481 = 0;
      var s__16482 = s__16480;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____16483 = s__16482;
          if(and__3822__auto____16483) {
            return i__16481 < size
          }else {
            return and__3822__auto____16483
          }
        }())) {
          a__16479[i__16481] = cljs.core.first.call(null, s__16482);
          var G__16486 = i__16481 + 1;
          var G__16487 = cljs.core.next.call(null, s__16482);
          i__16481 = G__16486;
          s__16482 = G__16487;
          continue
        }else {
          return a__16479
        }
        break
      }
    }else {
      var n__2527__auto____16484 = size;
      var i__16485 = 0;
      while(true) {
        if(i__16485 < n__2527__auto____16484) {
          a__16479[i__16485] = init_val_or_seq;
          var G__16488 = i__16485 + 1;
          i__16485 = G__16488;
          continue
        }else {
        }
        break
      }
      return a__16479
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__16496 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__16497 = cljs.core.seq.call(null, init_val_or_seq);
      var i__16498 = 0;
      var s__16499 = s__16497;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____16500 = s__16499;
          if(and__3822__auto____16500) {
            return i__16498 < size
          }else {
            return and__3822__auto____16500
          }
        }())) {
          a__16496[i__16498] = cljs.core.first.call(null, s__16499);
          var G__16503 = i__16498 + 1;
          var G__16504 = cljs.core.next.call(null, s__16499);
          i__16498 = G__16503;
          s__16499 = G__16504;
          continue
        }else {
          return a__16496
        }
        break
      }
    }else {
      var n__2527__auto____16501 = size;
      var i__16502 = 0;
      while(true) {
        if(i__16502 < n__2527__auto____16501) {
          a__16496[i__16502] = init_val_or_seq;
          var G__16505 = i__16502 + 1;
          i__16502 = G__16505;
          continue
        }else {
        }
        break
      }
      return a__16496
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__16510 = s;
    var i__16511 = n;
    var sum__16512 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____16513 = i__16511 > 0;
        if(and__3822__auto____16513) {
          return cljs.core.seq.call(null, s__16510)
        }else {
          return and__3822__auto____16513
        }
      }())) {
        var G__16514 = cljs.core.next.call(null, s__16510);
        var G__16515 = i__16511 - 1;
        var G__16516 = sum__16512 + 1;
        s__16510 = G__16514;
        i__16511 = G__16515;
        sum__16512 = G__16516;
        continue
      }else {
        return sum__16512
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__16521 = cljs.core.seq.call(null, x);
      if(s__16521) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__16521)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__16521), concat.call(null, cljs.core.chunk_rest.call(null, s__16521), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__16521), concat.call(null, cljs.core.rest.call(null, s__16521), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__16525__delegate = function(x, y, zs) {
      var cat__16524 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__16523 = cljs.core.seq.call(null, xys);
          if(xys__16523) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__16523)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__16523), cat.call(null, cljs.core.chunk_rest.call(null, xys__16523), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__16523), cat.call(null, cljs.core.rest.call(null, xys__16523), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__16524.call(null, concat.call(null, x, y), zs)
    };
    var G__16525 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16525__delegate.call(this, x, y, zs)
    };
    G__16525.cljs$lang$maxFixedArity = 2;
    G__16525.cljs$lang$applyTo = function(arglist__16526) {
      var x = cljs.core.first(arglist__16526);
      var y = cljs.core.first(cljs.core.next(arglist__16526));
      var zs = cljs.core.rest(cljs.core.next(arglist__16526));
      return G__16525__delegate(x, y, zs)
    };
    G__16525.cljs$lang$arity$variadic = G__16525__delegate;
    return G__16525
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__16527__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__16527 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__16527__delegate.call(this, a, b, c, d, more)
    };
    G__16527.cljs$lang$maxFixedArity = 4;
    G__16527.cljs$lang$applyTo = function(arglist__16528) {
      var a = cljs.core.first(arglist__16528);
      var b = cljs.core.first(cljs.core.next(arglist__16528));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16528)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16528))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16528))));
      return G__16527__delegate(a, b, c, d, more)
    };
    G__16527.cljs$lang$arity$variadic = G__16527__delegate;
    return G__16527
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__16570 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__16571 = cljs.core._first.call(null, args__16570);
    var args__16572 = cljs.core._rest.call(null, args__16570);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__16571)
      }else {
        return f.call(null, a__16571)
      }
    }else {
      var b__16573 = cljs.core._first.call(null, args__16572);
      var args__16574 = cljs.core._rest.call(null, args__16572);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__16571, b__16573)
        }else {
          return f.call(null, a__16571, b__16573)
        }
      }else {
        var c__16575 = cljs.core._first.call(null, args__16574);
        var args__16576 = cljs.core._rest.call(null, args__16574);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__16571, b__16573, c__16575)
          }else {
            return f.call(null, a__16571, b__16573, c__16575)
          }
        }else {
          var d__16577 = cljs.core._first.call(null, args__16576);
          var args__16578 = cljs.core._rest.call(null, args__16576);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__16571, b__16573, c__16575, d__16577)
            }else {
              return f.call(null, a__16571, b__16573, c__16575, d__16577)
            }
          }else {
            var e__16579 = cljs.core._first.call(null, args__16578);
            var args__16580 = cljs.core._rest.call(null, args__16578);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__16571, b__16573, c__16575, d__16577, e__16579)
              }else {
                return f.call(null, a__16571, b__16573, c__16575, d__16577, e__16579)
              }
            }else {
              var f__16581 = cljs.core._first.call(null, args__16580);
              var args__16582 = cljs.core._rest.call(null, args__16580);
              if(argc === 6) {
                if(f__16581.cljs$lang$arity$6) {
                  return f__16581.cljs$lang$arity$6(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581)
                }else {
                  return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581)
                }
              }else {
                var g__16583 = cljs.core._first.call(null, args__16582);
                var args__16584 = cljs.core._rest.call(null, args__16582);
                if(argc === 7) {
                  if(f__16581.cljs$lang$arity$7) {
                    return f__16581.cljs$lang$arity$7(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583)
                  }else {
                    return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583)
                  }
                }else {
                  var h__16585 = cljs.core._first.call(null, args__16584);
                  var args__16586 = cljs.core._rest.call(null, args__16584);
                  if(argc === 8) {
                    if(f__16581.cljs$lang$arity$8) {
                      return f__16581.cljs$lang$arity$8(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585)
                    }else {
                      return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585)
                    }
                  }else {
                    var i__16587 = cljs.core._first.call(null, args__16586);
                    var args__16588 = cljs.core._rest.call(null, args__16586);
                    if(argc === 9) {
                      if(f__16581.cljs$lang$arity$9) {
                        return f__16581.cljs$lang$arity$9(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587)
                      }else {
                        return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587)
                      }
                    }else {
                      var j__16589 = cljs.core._first.call(null, args__16588);
                      var args__16590 = cljs.core._rest.call(null, args__16588);
                      if(argc === 10) {
                        if(f__16581.cljs$lang$arity$10) {
                          return f__16581.cljs$lang$arity$10(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589)
                        }else {
                          return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589)
                        }
                      }else {
                        var k__16591 = cljs.core._first.call(null, args__16590);
                        var args__16592 = cljs.core._rest.call(null, args__16590);
                        if(argc === 11) {
                          if(f__16581.cljs$lang$arity$11) {
                            return f__16581.cljs$lang$arity$11(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591)
                          }else {
                            return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591)
                          }
                        }else {
                          var l__16593 = cljs.core._first.call(null, args__16592);
                          var args__16594 = cljs.core._rest.call(null, args__16592);
                          if(argc === 12) {
                            if(f__16581.cljs$lang$arity$12) {
                              return f__16581.cljs$lang$arity$12(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593)
                            }else {
                              return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593)
                            }
                          }else {
                            var m__16595 = cljs.core._first.call(null, args__16594);
                            var args__16596 = cljs.core._rest.call(null, args__16594);
                            if(argc === 13) {
                              if(f__16581.cljs$lang$arity$13) {
                                return f__16581.cljs$lang$arity$13(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595)
                              }else {
                                return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595)
                              }
                            }else {
                              var n__16597 = cljs.core._first.call(null, args__16596);
                              var args__16598 = cljs.core._rest.call(null, args__16596);
                              if(argc === 14) {
                                if(f__16581.cljs$lang$arity$14) {
                                  return f__16581.cljs$lang$arity$14(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597)
                                }else {
                                  return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597)
                                }
                              }else {
                                var o__16599 = cljs.core._first.call(null, args__16598);
                                var args__16600 = cljs.core._rest.call(null, args__16598);
                                if(argc === 15) {
                                  if(f__16581.cljs$lang$arity$15) {
                                    return f__16581.cljs$lang$arity$15(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597, o__16599)
                                  }else {
                                    return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597, o__16599)
                                  }
                                }else {
                                  var p__16601 = cljs.core._first.call(null, args__16600);
                                  var args__16602 = cljs.core._rest.call(null, args__16600);
                                  if(argc === 16) {
                                    if(f__16581.cljs$lang$arity$16) {
                                      return f__16581.cljs$lang$arity$16(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597, o__16599, p__16601)
                                    }else {
                                      return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597, o__16599, p__16601)
                                    }
                                  }else {
                                    var q__16603 = cljs.core._first.call(null, args__16602);
                                    var args__16604 = cljs.core._rest.call(null, args__16602);
                                    if(argc === 17) {
                                      if(f__16581.cljs$lang$arity$17) {
                                        return f__16581.cljs$lang$arity$17(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597, o__16599, p__16601, q__16603)
                                      }else {
                                        return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597, o__16599, p__16601, q__16603)
                                      }
                                    }else {
                                      var r__16605 = cljs.core._first.call(null, args__16604);
                                      var args__16606 = cljs.core._rest.call(null, args__16604);
                                      if(argc === 18) {
                                        if(f__16581.cljs$lang$arity$18) {
                                          return f__16581.cljs$lang$arity$18(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597, o__16599, p__16601, q__16603, r__16605)
                                        }else {
                                          return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597, o__16599, p__16601, q__16603, r__16605)
                                        }
                                      }else {
                                        var s__16607 = cljs.core._first.call(null, args__16606);
                                        var args__16608 = cljs.core._rest.call(null, args__16606);
                                        if(argc === 19) {
                                          if(f__16581.cljs$lang$arity$19) {
                                            return f__16581.cljs$lang$arity$19(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597, o__16599, p__16601, q__16603, r__16605, s__16607)
                                          }else {
                                            return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597, o__16599, p__16601, q__16603, r__16605, s__16607)
                                          }
                                        }else {
                                          var t__16609 = cljs.core._first.call(null, args__16608);
                                          var args__16610 = cljs.core._rest.call(null, args__16608);
                                          if(argc === 20) {
                                            if(f__16581.cljs$lang$arity$20) {
                                              return f__16581.cljs$lang$arity$20(a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597, o__16599, p__16601, q__16603, r__16605, s__16607, t__16609)
                                            }else {
                                              return f__16581.call(null, a__16571, b__16573, c__16575, d__16577, e__16579, f__16581, g__16583, h__16585, i__16587, j__16589, k__16591, l__16593, m__16595, n__16597, o__16599, p__16601, q__16603, r__16605, s__16607, t__16609)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__16625 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__16626 = cljs.core.bounded_count.call(null, args, fixed_arity__16625 + 1);
      if(bc__16626 <= fixed_arity__16625) {
        return cljs.core.apply_to.call(null, f, bc__16626, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__16627 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__16628 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__16629 = cljs.core.bounded_count.call(null, arglist__16627, fixed_arity__16628 + 1);
      if(bc__16629 <= fixed_arity__16628) {
        return cljs.core.apply_to.call(null, f, bc__16629, arglist__16627)
      }else {
        return f.cljs$lang$applyTo(arglist__16627)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__16627))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__16630 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__16631 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__16632 = cljs.core.bounded_count.call(null, arglist__16630, fixed_arity__16631 + 1);
      if(bc__16632 <= fixed_arity__16631) {
        return cljs.core.apply_to.call(null, f, bc__16632, arglist__16630)
      }else {
        return f.cljs$lang$applyTo(arglist__16630)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__16630))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__16633 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__16634 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__16635 = cljs.core.bounded_count.call(null, arglist__16633, fixed_arity__16634 + 1);
      if(bc__16635 <= fixed_arity__16634) {
        return cljs.core.apply_to.call(null, f, bc__16635, arglist__16633)
      }else {
        return f.cljs$lang$applyTo(arglist__16633)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__16633))
    }
  };
  var apply__6 = function() {
    var G__16639__delegate = function(f, a, b, c, d, args) {
      var arglist__16636 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__16637 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__16638 = cljs.core.bounded_count.call(null, arglist__16636, fixed_arity__16637 + 1);
        if(bc__16638 <= fixed_arity__16637) {
          return cljs.core.apply_to.call(null, f, bc__16638, arglist__16636)
        }else {
          return f.cljs$lang$applyTo(arglist__16636)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__16636))
      }
    };
    var G__16639 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__16639__delegate.call(this, f, a, b, c, d, args)
    };
    G__16639.cljs$lang$maxFixedArity = 5;
    G__16639.cljs$lang$applyTo = function(arglist__16640) {
      var f = cljs.core.first(arglist__16640);
      var a = cljs.core.first(cljs.core.next(arglist__16640));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16640)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16640))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16640)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16640)))));
      return G__16639__delegate(f, a, b, c, d, args)
    };
    G__16639.cljs$lang$arity$variadic = G__16639__delegate;
    return G__16639
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__16641) {
    var obj = cljs.core.first(arglist__16641);
    var f = cljs.core.first(cljs.core.next(arglist__16641));
    var args = cljs.core.rest(cljs.core.next(arglist__16641));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__16642__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__16642 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16642__delegate.call(this, x, y, more)
    };
    G__16642.cljs$lang$maxFixedArity = 2;
    G__16642.cljs$lang$applyTo = function(arglist__16643) {
      var x = cljs.core.first(arglist__16643);
      var y = cljs.core.first(cljs.core.next(arglist__16643));
      var more = cljs.core.rest(cljs.core.next(arglist__16643));
      return G__16642__delegate(x, y, more)
    };
    G__16642.cljs$lang$arity$variadic = G__16642__delegate;
    return G__16642
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__16644 = pred;
        var G__16645 = cljs.core.next.call(null, coll);
        pred = G__16644;
        coll = G__16645;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____16647 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____16647)) {
        return or__3824__auto____16647
      }else {
        var G__16648 = pred;
        var G__16649 = cljs.core.next.call(null, coll);
        pred = G__16648;
        coll = G__16649;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__16650 = null;
    var G__16650__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__16650__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__16650__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__16650__3 = function() {
      var G__16651__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__16651 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__16651__delegate.call(this, x, y, zs)
      };
      G__16651.cljs$lang$maxFixedArity = 2;
      G__16651.cljs$lang$applyTo = function(arglist__16652) {
        var x = cljs.core.first(arglist__16652);
        var y = cljs.core.first(cljs.core.next(arglist__16652));
        var zs = cljs.core.rest(cljs.core.next(arglist__16652));
        return G__16651__delegate(x, y, zs)
      };
      G__16651.cljs$lang$arity$variadic = G__16651__delegate;
      return G__16651
    }();
    G__16650 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__16650__0.call(this);
        case 1:
          return G__16650__1.call(this, x);
        case 2:
          return G__16650__2.call(this, x, y);
        default:
          return G__16650__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__16650.cljs$lang$maxFixedArity = 2;
    G__16650.cljs$lang$applyTo = G__16650__3.cljs$lang$applyTo;
    return G__16650
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__16653__delegate = function(args) {
      return x
    };
    var G__16653 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__16653__delegate.call(this, args)
    };
    G__16653.cljs$lang$maxFixedArity = 0;
    G__16653.cljs$lang$applyTo = function(arglist__16654) {
      var args = cljs.core.seq(arglist__16654);
      return G__16653__delegate(args)
    };
    G__16653.cljs$lang$arity$variadic = G__16653__delegate;
    return G__16653
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__16661 = null;
      var G__16661__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__16661__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__16661__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__16661__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__16661__4 = function() {
        var G__16662__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__16662 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16662__delegate.call(this, x, y, z, args)
        };
        G__16662.cljs$lang$maxFixedArity = 3;
        G__16662.cljs$lang$applyTo = function(arglist__16663) {
          var x = cljs.core.first(arglist__16663);
          var y = cljs.core.first(cljs.core.next(arglist__16663));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16663)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16663)));
          return G__16662__delegate(x, y, z, args)
        };
        G__16662.cljs$lang$arity$variadic = G__16662__delegate;
        return G__16662
      }();
      G__16661 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__16661__0.call(this);
          case 1:
            return G__16661__1.call(this, x);
          case 2:
            return G__16661__2.call(this, x, y);
          case 3:
            return G__16661__3.call(this, x, y, z);
          default:
            return G__16661__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16661.cljs$lang$maxFixedArity = 3;
      G__16661.cljs$lang$applyTo = G__16661__4.cljs$lang$applyTo;
      return G__16661
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__16664 = null;
      var G__16664__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__16664__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__16664__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__16664__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__16664__4 = function() {
        var G__16665__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__16665 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16665__delegate.call(this, x, y, z, args)
        };
        G__16665.cljs$lang$maxFixedArity = 3;
        G__16665.cljs$lang$applyTo = function(arglist__16666) {
          var x = cljs.core.first(arglist__16666);
          var y = cljs.core.first(cljs.core.next(arglist__16666));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16666)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16666)));
          return G__16665__delegate(x, y, z, args)
        };
        G__16665.cljs$lang$arity$variadic = G__16665__delegate;
        return G__16665
      }();
      G__16664 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__16664__0.call(this);
          case 1:
            return G__16664__1.call(this, x);
          case 2:
            return G__16664__2.call(this, x, y);
          case 3:
            return G__16664__3.call(this, x, y, z);
          default:
            return G__16664__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16664.cljs$lang$maxFixedArity = 3;
      G__16664.cljs$lang$applyTo = G__16664__4.cljs$lang$applyTo;
      return G__16664
    }()
  };
  var comp__4 = function() {
    var G__16667__delegate = function(f1, f2, f3, fs) {
      var fs__16658 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__16668__delegate = function(args) {
          var ret__16659 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__16658), args);
          var fs__16660 = cljs.core.next.call(null, fs__16658);
          while(true) {
            if(fs__16660) {
              var G__16669 = cljs.core.first.call(null, fs__16660).call(null, ret__16659);
              var G__16670 = cljs.core.next.call(null, fs__16660);
              ret__16659 = G__16669;
              fs__16660 = G__16670;
              continue
            }else {
              return ret__16659
            }
            break
          }
        };
        var G__16668 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__16668__delegate.call(this, args)
        };
        G__16668.cljs$lang$maxFixedArity = 0;
        G__16668.cljs$lang$applyTo = function(arglist__16671) {
          var args = cljs.core.seq(arglist__16671);
          return G__16668__delegate(args)
        };
        G__16668.cljs$lang$arity$variadic = G__16668__delegate;
        return G__16668
      }()
    };
    var G__16667 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16667__delegate.call(this, f1, f2, f3, fs)
    };
    G__16667.cljs$lang$maxFixedArity = 3;
    G__16667.cljs$lang$applyTo = function(arglist__16672) {
      var f1 = cljs.core.first(arglist__16672);
      var f2 = cljs.core.first(cljs.core.next(arglist__16672));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16672)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16672)));
      return G__16667__delegate(f1, f2, f3, fs)
    };
    G__16667.cljs$lang$arity$variadic = G__16667__delegate;
    return G__16667
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__16673__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__16673 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__16673__delegate.call(this, args)
      };
      G__16673.cljs$lang$maxFixedArity = 0;
      G__16673.cljs$lang$applyTo = function(arglist__16674) {
        var args = cljs.core.seq(arglist__16674);
        return G__16673__delegate(args)
      };
      G__16673.cljs$lang$arity$variadic = G__16673__delegate;
      return G__16673
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__16675__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__16675 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__16675__delegate.call(this, args)
      };
      G__16675.cljs$lang$maxFixedArity = 0;
      G__16675.cljs$lang$applyTo = function(arglist__16676) {
        var args = cljs.core.seq(arglist__16676);
        return G__16675__delegate(args)
      };
      G__16675.cljs$lang$arity$variadic = G__16675__delegate;
      return G__16675
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__16677__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__16677 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__16677__delegate.call(this, args)
      };
      G__16677.cljs$lang$maxFixedArity = 0;
      G__16677.cljs$lang$applyTo = function(arglist__16678) {
        var args = cljs.core.seq(arglist__16678);
        return G__16677__delegate(args)
      };
      G__16677.cljs$lang$arity$variadic = G__16677__delegate;
      return G__16677
    }()
  };
  var partial__5 = function() {
    var G__16679__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__16680__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__16680 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__16680__delegate.call(this, args)
        };
        G__16680.cljs$lang$maxFixedArity = 0;
        G__16680.cljs$lang$applyTo = function(arglist__16681) {
          var args = cljs.core.seq(arglist__16681);
          return G__16680__delegate(args)
        };
        G__16680.cljs$lang$arity$variadic = G__16680__delegate;
        return G__16680
      }()
    };
    var G__16679 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__16679__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__16679.cljs$lang$maxFixedArity = 4;
    G__16679.cljs$lang$applyTo = function(arglist__16682) {
      var f = cljs.core.first(arglist__16682);
      var arg1 = cljs.core.first(cljs.core.next(arglist__16682));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16682)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16682))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16682))));
      return G__16679__delegate(f, arg1, arg2, arg3, more)
    };
    G__16679.cljs$lang$arity$variadic = G__16679__delegate;
    return G__16679
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__16683 = null;
      var G__16683__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__16683__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__16683__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__16683__4 = function() {
        var G__16684__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__16684 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16684__delegate.call(this, a, b, c, ds)
        };
        G__16684.cljs$lang$maxFixedArity = 3;
        G__16684.cljs$lang$applyTo = function(arglist__16685) {
          var a = cljs.core.first(arglist__16685);
          var b = cljs.core.first(cljs.core.next(arglist__16685));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16685)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16685)));
          return G__16684__delegate(a, b, c, ds)
        };
        G__16684.cljs$lang$arity$variadic = G__16684__delegate;
        return G__16684
      }();
      G__16683 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__16683__1.call(this, a);
          case 2:
            return G__16683__2.call(this, a, b);
          case 3:
            return G__16683__3.call(this, a, b, c);
          default:
            return G__16683__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16683.cljs$lang$maxFixedArity = 3;
      G__16683.cljs$lang$applyTo = G__16683__4.cljs$lang$applyTo;
      return G__16683
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__16686 = null;
      var G__16686__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__16686__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__16686__4 = function() {
        var G__16687__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__16687 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16687__delegate.call(this, a, b, c, ds)
        };
        G__16687.cljs$lang$maxFixedArity = 3;
        G__16687.cljs$lang$applyTo = function(arglist__16688) {
          var a = cljs.core.first(arglist__16688);
          var b = cljs.core.first(cljs.core.next(arglist__16688));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16688)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16688)));
          return G__16687__delegate(a, b, c, ds)
        };
        G__16687.cljs$lang$arity$variadic = G__16687__delegate;
        return G__16687
      }();
      G__16686 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__16686__2.call(this, a, b);
          case 3:
            return G__16686__3.call(this, a, b, c);
          default:
            return G__16686__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16686.cljs$lang$maxFixedArity = 3;
      G__16686.cljs$lang$applyTo = G__16686__4.cljs$lang$applyTo;
      return G__16686
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__16689 = null;
      var G__16689__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__16689__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__16689__4 = function() {
        var G__16690__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__16690 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16690__delegate.call(this, a, b, c, ds)
        };
        G__16690.cljs$lang$maxFixedArity = 3;
        G__16690.cljs$lang$applyTo = function(arglist__16691) {
          var a = cljs.core.first(arglist__16691);
          var b = cljs.core.first(cljs.core.next(arglist__16691));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16691)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16691)));
          return G__16690__delegate(a, b, c, ds)
        };
        G__16690.cljs$lang$arity$variadic = G__16690__delegate;
        return G__16690
      }();
      G__16689 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__16689__2.call(this, a, b);
          case 3:
            return G__16689__3.call(this, a, b, c);
          default:
            return G__16689__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16689.cljs$lang$maxFixedArity = 3;
      G__16689.cljs$lang$applyTo = G__16689__4.cljs$lang$applyTo;
      return G__16689
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__16707 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____16715 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16715) {
        var s__16716 = temp__3974__auto____16715;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__16716)) {
          var c__16717 = cljs.core.chunk_first.call(null, s__16716);
          var size__16718 = cljs.core.count.call(null, c__16717);
          var b__16719 = cljs.core.chunk_buffer.call(null, size__16718);
          var n__2527__auto____16720 = size__16718;
          var i__16721 = 0;
          while(true) {
            if(i__16721 < n__2527__auto____16720) {
              cljs.core.chunk_append.call(null, b__16719, f.call(null, idx + i__16721, cljs.core._nth.call(null, c__16717, i__16721)));
              var G__16722 = i__16721 + 1;
              i__16721 = G__16722;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__16719), mapi.call(null, idx + size__16718, cljs.core.chunk_rest.call(null, s__16716)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__16716)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__16716)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__16707.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____16732 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____16732) {
      var s__16733 = temp__3974__auto____16732;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__16733)) {
        var c__16734 = cljs.core.chunk_first.call(null, s__16733);
        var size__16735 = cljs.core.count.call(null, c__16734);
        var b__16736 = cljs.core.chunk_buffer.call(null, size__16735);
        var n__2527__auto____16737 = size__16735;
        var i__16738 = 0;
        while(true) {
          if(i__16738 < n__2527__auto____16737) {
            var x__16739 = f.call(null, cljs.core._nth.call(null, c__16734, i__16738));
            if(x__16739 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__16736, x__16739)
            }
            var G__16741 = i__16738 + 1;
            i__16738 = G__16741;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__16736), keep.call(null, f, cljs.core.chunk_rest.call(null, s__16733)))
      }else {
        var x__16740 = f.call(null, cljs.core.first.call(null, s__16733));
        if(x__16740 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__16733))
        }else {
          return cljs.core.cons.call(null, x__16740, keep.call(null, f, cljs.core.rest.call(null, s__16733)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__16767 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____16777 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16777) {
        var s__16778 = temp__3974__auto____16777;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__16778)) {
          var c__16779 = cljs.core.chunk_first.call(null, s__16778);
          var size__16780 = cljs.core.count.call(null, c__16779);
          var b__16781 = cljs.core.chunk_buffer.call(null, size__16780);
          var n__2527__auto____16782 = size__16780;
          var i__16783 = 0;
          while(true) {
            if(i__16783 < n__2527__auto____16782) {
              var x__16784 = f.call(null, idx + i__16783, cljs.core._nth.call(null, c__16779, i__16783));
              if(x__16784 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__16781, x__16784)
              }
              var G__16786 = i__16783 + 1;
              i__16783 = G__16786;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__16781), keepi.call(null, idx + size__16780, cljs.core.chunk_rest.call(null, s__16778)))
        }else {
          var x__16785 = f.call(null, idx, cljs.core.first.call(null, s__16778));
          if(x__16785 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__16778))
          }else {
            return cljs.core.cons.call(null, x__16785, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__16778)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__16767.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16872 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16872)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____16872
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16873 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16873)) {
            var and__3822__auto____16874 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____16874)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____16874
            }
          }else {
            return and__3822__auto____16873
          }
        }())
      };
      var ep1__4 = function() {
        var G__16943__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____16875 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____16875)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____16875
            }
          }())
        };
        var G__16943 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16943__delegate.call(this, x, y, z, args)
        };
        G__16943.cljs$lang$maxFixedArity = 3;
        G__16943.cljs$lang$applyTo = function(arglist__16944) {
          var x = cljs.core.first(arglist__16944);
          var y = cljs.core.first(cljs.core.next(arglist__16944));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16944)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16944)));
          return G__16943__delegate(x, y, z, args)
        };
        G__16943.cljs$lang$arity$variadic = G__16943__delegate;
        return G__16943
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16887 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16887)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____16887
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16888 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16888)) {
            var and__3822__auto____16889 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____16889)) {
              var and__3822__auto____16890 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____16890)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____16890
              }
            }else {
              return and__3822__auto____16889
            }
          }else {
            return and__3822__auto____16888
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16891 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16891)) {
            var and__3822__auto____16892 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____16892)) {
              var and__3822__auto____16893 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____16893)) {
                var and__3822__auto____16894 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____16894)) {
                  var and__3822__auto____16895 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____16895)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____16895
                  }
                }else {
                  return and__3822__auto____16894
                }
              }else {
                return and__3822__auto____16893
              }
            }else {
              return and__3822__auto____16892
            }
          }else {
            return and__3822__auto____16891
          }
        }())
      };
      var ep2__4 = function() {
        var G__16945__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____16896 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____16896)) {
              return cljs.core.every_QMARK_.call(null, function(p1__16742_SHARP_) {
                var and__3822__auto____16897 = p1.call(null, p1__16742_SHARP_);
                if(cljs.core.truth_(and__3822__auto____16897)) {
                  return p2.call(null, p1__16742_SHARP_)
                }else {
                  return and__3822__auto____16897
                }
              }, args)
            }else {
              return and__3822__auto____16896
            }
          }())
        };
        var G__16945 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16945__delegate.call(this, x, y, z, args)
        };
        G__16945.cljs$lang$maxFixedArity = 3;
        G__16945.cljs$lang$applyTo = function(arglist__16946) {
          var x = cljs.core.first(arglist__16946);
          var y = cljs.core.first(cljs.core.next(arglist__16946));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16946)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16946)));
          return G__16945__delegate(x, y, z, args)
        };
        G__16945.cljs$lang$arity$variadic = G__16945__delegate;
        return G__16945
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16916 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16916)) {
            var and__3822__auto____16917 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16917)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____16917
            }
          }else {
            return and__3822__auto____16916
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16918 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16918)) {
            var and__3822__auto____16919 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16919)) {
              var and__3822__auto____16920 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____16920)) {
                var and__3822__auto____16921 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____16921)) {
                  var and__3822__auto____16922 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____16922)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____16922
                  }
                }else {
                  return and__3822__auto____16921
                }
              }else {
                return and__3822__auto____16920
              }
            }else {
              return and__3822__auto____16919
            }
          }else {
            return and__3822__auto____16918
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16923 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16923)) {
            var and__3822__auto____16924 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16924)) {
              var and__3822__auto____16925 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____16925)) {
                var and__3822__auto____16926 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____16926)) {
                  var and__3822__auto____16927 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____16927)) {
                    var and__3822__auto____16928 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____16928)) {
                      var and__3822__auto____16929 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____16929)) {
                        var and__3822__auto____16930 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____16930)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____16930
                        }
                      }else {
                        return and__3822__auto____16929
                      }
                    }else {
                      return and__3822__auto____16928
                    }
                  }else {
                    return and__3822__auto____16927
                  }
                }else {
                  return and__3822__auto____16926
                }
              }else {
                return and__3822__auto____16925
              }
            }else {
              return and__3822__auto____16924
            }
          }else {
            return and__3822__auto____16923
          }
        }())
      };
      var ep3__4 = function() {
        var G__16947__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____16931 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____16931)) {
              return cljs.core.every_QMARK_.call(null, function(p1__16743_SHARP_) {
                var and__3822__auto____16932 = p1.call(null, p1__16743_SHARP_);
                if(cljs.core.truth_(and__3822__auto____16932)) {
                  var and__3822__auto____16933 = p2.call(null, p1__16743_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____16933)) {
                    return p3.call(null, p1__16743_SHARP_)
                  }else {
                    return and__3822__auto____16933
                  }
                }else {
                  return and__3822__auto____16932
                }
              }, args)
            }else {
              return and__3822__auto____16931
            }
          }())
        };
        var G__16947 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16947__delegate.call(this, x, y, z, args)
        };
        G__16947.cljs$lang$maxFixedArity = 3;
        G__16947.cljs$lang$applyTo = function(arglist__16948) {
          var x = cljs.core.first(arglist__16948);
          var y = cljs.core.first(cljs.core.next(arglist__16948));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16948)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16948)));
          return G__16947__delegate(x, y, z, args)
        };
        G__16947.cljs$lang$arity$variadic = G__16947__delegate;
        return G__16947
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__16949__delegate = function(p1, p2, p3, ps) {
      var ps__16934 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__16744_SHARP_) {
            return p1__16744_SHARP_.call(null, x)
          }, ps__16934)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__16745_SHARP_) {
            var and__3822__auto____16939 = p1__16745_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16939)) {
              return p1__16745_SHARP_.call(null, y)
            }else {
              return and__3822__auto____16939
            }
          }, ps__16934)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__16746_SHARP_) {
            var and__3822__auto____16940 = p1__16746_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16940)) {
              var and__3822__auto____16941 = p1__16746_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____16941)) {
                return p1__16746_SHARP_.call(null, z)
              }else {
                return and__3822__auto____16941
              }
            }else {
              return and__3822__auto____16940
            }
          }, ps__16934)
        };
        var epn__4 = function() {
          var G__16950__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____16942 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____16942)) {
                return cljs.core.every_QMARK_.call(null, function(p1__16747_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__16747_SHARP_, args)
                }, ps__16934)
              }else {
                return and__3822__auto____16942
              }
            }())
          };
          var G__16950 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__16950__delegate.call(this, x, y, z, args)
          };
          G__16950.cljs$lang$maxFixedArity = 3;
          G__16950.cljs$lang$applyTo = function(arglist__16951) {
            var x = cljs.core.first(arglist__16951);
            var y = cljs.core.first(cljs.core.next(arglist__16951));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16951)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16951)));
            return G__16950__delegate(x, y, z, args)
          };
          G__16950.cljs$lang$arity$variadic = G__16950__delegate;
          return G__16950
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__16949 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16949__delegate.call(this, p1, p2, p3, ps)
    };
    G__16949.cljs$lang$maxFixedArity = 3;
    G__16949.cljs$lang$applyTo = function(arglist__16952) {
      var p1 = cljs.core.first(arglist__16952);
      var p2 = cljs.core.first(cljs.core.next(arglist__16952));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16952)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16952)));
      return G__16949__delegate(p1, p2, p3, ps)
    };
    G__16949.cljs$lang$arity$variadic = G__16949__delegate;
    return G__16949
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____17033 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17033)) {
          return or__3824__auto____17033
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____17034 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17034)) {
          return or__3824__auto____17034
        }else {
          var or__3824__auto____17035 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____17035)) {
            return or__3824__auto____17035
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__17104__delegate = function(x, y, z, args) {
          var or__3824__auto____17036 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____17036)) {
            return or__3824__auto____17036
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__17104 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17104__delegate.call(this, x, y, z, args)
        };
        G__17104.cljs$lang$maxFixedArity = 3;
        G__17104.cljs$lang$applyTo = function(arglist__17105) {
          var x = cljs.core.first(arglist__17105);
          var y = cljs.core.first(cljs.core.next(arglist__17105));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17105)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17105)));
          return G__17104__delegate(x, y, z, args)
        };
        G__17104.cljs$lang$arity$variadic = G__17104__delegate;
        return G__17104
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____17048 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17048)) {
          return or__3824__auto____17048
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____17049 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17049)) {
          return or__3824__auto____17049
        }else {
          var or__3824__auto____17050 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____17050)) {
            return or__3824__auto____17050
          }else {
            var or__3824__auto____17051 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17051)) {
              return or__3824__auto____17051
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____17052 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17052)) {
          return or__3824__auto____17052
        }else {
          var or__3824__auto____17053 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____17053)) {
            return or__3824__auto____17053
          }else {
            var or__3824__auto____17054 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____17054)) {
              return or__3824__auto____17054
            }else {
              var or__3824__auto____17055 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____17055)) {
                return or__3824__auto____17055
              }else {
                var or__3824__auto____17056 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____17056)) {
                  return or__3824__auto____17056
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__17106__delegate = function(x, y, z, args) {
          var or__3824__auto____17057 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____17057)) {
            return or__3824__auto____17057
          }else {
            return cljs.core.some.call(null, function(p1__16787_SHARP_) {
              var or__3824__auto____17058 = p1.call(null, p1__16787_SHARP_);
              if(cljs.core.truth_(or__3824__auto____17058)) {
                return or__3824__auto____17058
              }else {
                return p2.call(null, p1__16787_SHARP_)
              }
            }, args)
          }
        };
        var G__17106 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17106__delegate.call(this, x, y, z, args)
        };
        G__17106.cljs$lang$maxFixedArity = 3;
        G__17106.cljs$lang$applyTo = function(arglist__17107) {
          var x = cljs.core.first(arglist__17107);
          var y = cljs.core.first(cljs.core.next(arglist__17107));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17107)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17107)));
          return G__17106__delegate(x, y, z, args)
        };
        G__17106.cljs$lang$arity$variadic = G__17106__delegate;
        return G__17106
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____17077 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17077)) {
          return or__3824__auto____17077
        }else {
          var or__3824__auto____17078 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____17078)) {
            return or__3824__auto____17078
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____17079 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17079)) {
          return or__3824__auto____17079
        }else {
          var or__3824__auto____17080 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____17080)) {
            return or__3824__auto____17080
          }else {
            var or__3824__auto____17081 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17081)) {
              return or__3824__auto____17081
            }else {
              var or__3824__auto____17082 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____17082)) {
                return or__3824__auto____17082
              }else {
                var or__3824__auto____17083 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____17083)) {
                  return or__3824__auto____17083
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____17084 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17084)) {
          return or__3824__auto____17084
        }else {
          var or__3824__auto____17085 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____17085)) {
            return or__3824__auto____17085
          }else {
            var or__3824__auto____17086 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17086)) {
              return or__3824__auto____17086
            }else {
              var or__3824__auto____17087 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____17087)) {
                return or__3824__auto____17087
              }else {
                var or__3824__auto____17088 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____17088)) {
                  return or__3824__auto____17088
                }else {
                  var or__3824__auto____17089 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____17089)) {
                    return or__3824__auto____17089
                  }else {
                    var or__3824__auto____17090 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____17090)) {
                      return or__3824__auto____17090
                    }else {
                      var or__3824__auto____17091 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____17091)) {
                        return or__3824__auto____17091
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__17108__delegate = function(x, y, z, args) {
          var or__3824__auto____17092 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____17092)) {
            return or__3824__auto____17092
          }else {
            return cljs.core.some.call(null, function(p1__16788_SHARP_) {
              var or__3824__auto____17093 = p1.call(null, p1__16788_SHARP_);
              if(cljs.core.truth_(or__3824__auto____17093)) {
                return or__3824__auto____17093
              }else {
                var or__3824__auto____17094 = p2.call(null, p1__16788_SHARP_);
                if(cljs.core.truth_(or__3824__auto____17094)) {
                  return or__3824__auto____17094
                }else {
                  return p3.call(null, p1__16788_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__17108 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17108__delegate.call(this, x, y, z, args)
        };
        G__17108.cljs$lang$maxFixedArity = 3;
        G__17108.cljs$lang$applyTo = function(arglist__17109) {
          var x = cljs.core.first(arglist__17109);
          var y = cljs.core.first(cljs.core.next(arglist__17109));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17109)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17109)));
          return G__17108__delegate(x, y, z, args)
        };
        G__17108.cljs$lang$arity$variadic = G__17108__delegate;
        return G__17108
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__17110__delegate = function(p1, p2, p3, ps) {
      var ps__17095 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__16789_SHARP_) {
            return p1__16789_SHARP_.call(null, x)
          }, ps__17095)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__16790_SHARP_) {
            var or__3824__auto____17100 = p1__16790_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17100)) {
              return or__3824__auto____17100
            }else {
              return p1__16790_SHARP_.call(null, y)
            }
          }, ps__17095)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__16791_SHARP_) {
            var or__3824__auto____17101 = p1__16791_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17101)) {
              return or__3824__auto____17101
            }else {
              var or__3824__auto____17102 = p1__16791_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____17102)) {
                return or__3824__auto____17102
              }else {
                return p1__16791_SHARP_.call(null, z)
              }
            }
          }, ps__17095)
        };
        var spn__4 = function() {
          var G__17111__delegate = function(x, y, z, args) {
            var or__3824__auto____17103 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____17103)) {
              return or__3824__auto____17103
            }else {
              return cljs.core.some.call(null, function(p1__16792_SHARP_) {
                return cljs.core.some.call(null, p1__16792_SHARP_, args)
              }, ps__17095)
            }
          };
          var G__17111 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__17111__delegate.call(this, x, y, z, args)
          };
          G__17111.cljs$lang$maxFixedArity = 3;
          G__17111.cljs$lang$applyTo = function(arglist__17112) {
            var x = cljs.core.first(arglist__17112);
            var y = cljs.core.first(cljs.core.next(arglist__17112));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17112)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17112)));
            return G__17111__delegate(x, y, z, args)
          };
          G__17111.cljs$lang$arity$variadic = G__17111__delegate;
          return G__17111
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__17110 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17110__delegate.call(this, p1, p2, p3, ps)
    };
    G__17110.cljs$lang$maxFixedArity = 3;
    G__17110.cljs$lang$applyTo = function(arglist__17113) {
      var p1 = cljs.core.first(arglist__17113);
      var p2 = cljs.core.first(cljs.core.next(arglist__17113));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17113)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17113)));
      return G__17110__delegate(p1, p2, p3, ps)
    };
    G__17110.cljs$lang$arity$variadic = G__17110__delegate;
    return G__17110
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____17132 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17132) {
        var s__17133 = temp__3974__auto____17132;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__17133)) {
          var c__17134 = cljs.core.chunk_first.call(null, s__17133);
          var size__17135 = cljs.core.count.call(null, c__17134);
          var b__17136 = cljs.core.chunk_buffer.call(null, size__17135);
          var n__2527__auto____17137 = size__17135;
          var i__17138 = 0;
          while(true) {
            if(i__17138 < n__2527__auto____17137) {
              cljs.core.chunk_append.call(null, b__17136, f.call(null, cljs.core._nth.call(null, c__17134, i__17138)));
              var G__17150 = i__17138 + 1;
              i__17138 = G__17150;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__17136), map.call(null, f, cljs.core.chunk_rest.call(null, s__17133)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__17133)), map.call(null, f, cljs.core.rest.call(null, s__17133)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__17139 = cljs.core.seq.call(null, c1);
      var s2__17140 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____17141 = s1__17139;
        if(and__3822__auto____17141) {
          return s2__17140
        }else {
          return and__3822__auto____17141
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__17139), cljs.core.first.call(null, s2__17140)), map.call(null, f, cljs.core.rest.call(null, s1__17139), cljs.core.rest.call(null, s2__17140)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__17142 = cljs.core.seq.call(null, c1);
      var s2__17143 = cljs.core.seq.call(null, c2);
      var s3__17144 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____17145 = s1__17142;
        if(and__3822__auto____17145) {
          var and__3822__auto____17146 = s2__17143;
          if(and__3822__auto____17146) {
            return s3__17144
          }else {
            return and__3822__auto____17146
          }
        }else {
          return and__3822__auto____17145
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__17142), cljs.core.first.call(null, s2__17143), cljs.core.first.call(null, s3__17144)), map.call(null, f, cljs.core.rest.call(null, s1__17142), cljs.core.rest.call(null, s2__17143), cljs.core.rest.call(null, s3__17144)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__17151__delegate = function(f, c1, c2, c3, colls) {
      var step__17149 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__17148 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__17148)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__17148), step.call(null, map.call(null, cljs.core.rest, ss__17148)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__16953_SHARP_) {
        return cljs.core.apply.call(null, f, p1__16953_SHARP_)
      }, step__17149.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__17151 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__17151__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__17151.cljs$lang$maxFixedArity = 4;
    G__17151.cljs$lang$applyTo = function(arglist__17152) {
      var f = cljs.core.first(arglist__17152);
      var c1 = cljs.core.first(cljs.core.next(arglist__17152));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17152)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17152))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17152))));
      return G__17151__delegate(f, c1, c2, c3, colls)
    };
    G__17151.cljs$lang$arity$variadic = G__17151__delegate;
    return G__17151
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____17155 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17155) {
        var s__17156 = temp__3974__auto____17155;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__17156), take.call(null, n - 1, cljs.core.rest.call(null, s__17156)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__17162 = function(n, coll) {
    while(true) {
      var s__17160 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____17161 = n > 0;
        if(and__3822__auto____17161) {
          return s__17160
        }else {
          return and__3822__auto____17161
        }
      }())) {
        var G__17163 = n - 1;
        var G__17164 = cljs.core.rest.call(null, s__17160);
        n = G__17163;
        coll = G__17164;
        continue
      }else {
        return s__17160
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__17162.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__17167 = cljs.core.seq.call(null, coll);
  var lead__17168 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__17168) {
      var G__17169 = cljs.core.next.call(null, s__17167);
      var G__17170 = cljs.core.next.call(null, lead__17168);
      s__17167 = G__17169;
      lead__17168 = G__17170;
      continue
    }else {
      return s__17167
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__17176 = function(pred, coll) {
    while(true) {
      var s__17174 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____17175 = s__17174;
        if(and__3822__auto____17175) {
          return pred.call(null, cljs.core.first.call(null, s__17174))
        }else {
          return and__3822__auto____17175
        }
      }())) {
        var G__17177 = pred;
        var G__17178 = cljs.core.rest.call(null, s__17174);
        pred = G__17177;
        coll = G__17178;
        continue
      }else {
        return s__17174
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__17176.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____17181 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17181) {
      var s__17182 = temp__3974__auto____17181;
      return cljs.core.concat.call(null, s__17182, cycle.call(null, s__17182))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__17187 = cljs.core.seq.call(null, c1);
      var s2__17188 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____17189 = s1__17187;
        if(and__3822__auto____17189) {
          return s2__17188
        }else {
          return and__3822__auto____17189
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__17187), cljs.core.cons.call(null, cljs.core.first.call(null, s2__17188), interleave.call(null, cljs.core.rest.call(null, s1__17187), cljs.core.rest.call(null, s2__17188))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__17191__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__17190 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__17190)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__17190), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__17190)))
        }else {
          return null
        }
      }, null)
    };
    var G__17191 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__17191__delegate.call(this, c1, c2, colls)
    };
    G__17191.cljs$lang$maxFixedArity = 2;
    G__17191.cljs$lang$applyTo = function(arglist__17192) {
      var c1 = cljs.core.first(arglist__17192);
      var c2 = cljs.core.first(cljs.core.next(arglist__17192));
      var colls = cljs.core.rest(cljs.core.next(arglist__17192));
      return G__17191__delegate(c1, c2, colls)
    };
    G__17191.cljs$lang$arity$variadic = G__17191__delegate;
    return G__17191
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__17202 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____17200 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____17200) {
        var coll__17201 = temp__3971__auto____17200;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__17201), cat.call(null, cljs.core.rest.call(null, coll__17201), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__17202.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__17203__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__17203 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__17203__delegate.call(this, f, coll, colls)
    };
    G__17203.cljs$lang$maxFixedArity = 2;
    G__17203.cljs$lang$applyTo = function(arglist__17204) {
      var f = cljs.core.first(arglist__17204);
      var coll = cljs.core.first(cljs.core.next(arglist__17204));
      var colls = cljs.core.rest(cljs.core.next(arglist__17204));
      return G__17203__delegate(f, coll, colls)
    };
    G__17203.cljs$lang$arity$variadic = G__17203__delegate;
    return G__17203
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____17214 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17214) {
      var s__17215 = temp__3974__auto____17214;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__17215)) {
        var c__17216 = cljs.core.chunk_first.call(null, s__17215);
        var size__17217 = cljs.core.count.call(null, c__17216);
        var b__17218 = cljs.core.chunk_buffer.call(null, size__17217);
        var n__2527__auto____17219 = size__17217;
        var i__17220 = 0;
        while(true) {
          if(i__17220 < n__2527__auto____17219) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__17216, i__17220)))) {
              cljs.core.chunk_append.call(null, b__17218, cljs.core._nth.call(null, c__17216, i__17220))
            }else {
            }
            var G__17223 = i__17220 + 1;
            i__17220 = G__17223;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__17218), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__17215)))
      }else {
        var f__17221 = cljs.core.first.call(null, s__17215);
        var r__17222 = cljs.core.rest.call(null, s__17215);
        if(cljs.core.truth_(pred.call(null, f__17221))) {
          return cljs.core.cons.call(null, f__17221, filter.call(null, pred, r__17222))
        }else {
          return filter.call(null, pred, r__17222)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__17226 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__17226.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__17224_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__17224_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__17230__17231 = to;
    if(G__17230__17231) {
      if(function() {
        var or__3824__auto____17232 = G__17230__17231.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____17232) {
          return or__3824__auto____17232
        }else {
          return G__17230__17231.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__17230__17231.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__17230__17231)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__17230__17231)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__17233__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__17233 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__17233__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__17233.cljs$lang$maxFixedArity = 4;
    G__17233.cljs$lang$applyTo = function(arglist__17234) {
      var f = cljs.core.first(arglist__17234);
      var c1 = cljs.core.first(cljs.core.next(arglist__17234));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17234)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17234))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17234))));
      return G__17233__delegate(f, c1, c2, c3, colls)
    };
    G__17233.cljs$lang$arity$variadic = G__17233__delegate;
    return G__17233
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____17241 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17241) {
        var s__17242 = temp__3974__auto____17241;
        var p__17243 = cljs.core.take.call(null, n, s__17242);
        if(n === cljs.core.count.call(null, p__17243)) {
          return cljs.core.cons.call(null, p__17243, partition.call(null, n, step, cljs.core.drop.call(null, step, s__17242)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____17244 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17244) {
        var s__17245 = temp__3974__auto____17244;
        var p__17246 = cljs.core.take.call(null, n, s__17245);
        if(n === cljs.core.count.call(null, p__17246)) {
          return cljs.core.cons.call(null, p__17246, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__17245)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__17246, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__17251 = cljs.core.lookup_sentinel;
    var m__17252 = m;
    var ks__17253 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__17253) {
        var m__17254 = cljs.core._lookup.call(null, m__17252, cljs.core.first.call(null, ks__17253), sentinel__17251);
        if(sentinel__17251 === m__17254) {
          return not_found
        }else {
          var G__17255 = sentinel__17251;
          var G__17256 = m__17254;
          var G__17257 = cljs.core.next.call(null, ks__17253);
          sentinel__17251 = G__17255;
          m__17252 = G__17256;
          ks__17253 = G__17257;
          continue
        }
      }else {
        return m__17252
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__17258, v) {
  var vec__17263__17264 = p__17258;
  var k__17265 = cljs.core.nth.call(null, vec__17263__17264, 0, null);
  var ks__17266 = cljs.core.nthnext.call(null, vec__17263__17264, 1);
  if(cljs.core.truth_(ks__17266)) {
    return cljs.core.assoc.call(null, m, k__17265, assoc_in.call(null, cljs.core._lookup.call(null, m, k__17265, null), ks__17266, v))
  }else {
    return cljs.core.assoc.call(null, m, k__17265, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__17267, f, args) {
    var vec__17272__17273 = p__17267;
    var k__17274 = cljs.core.nth.call(null, vec__17272__17273, 0, null);
    var ks__17275 = cljs.core.nthnext.call(null, vec__17272__17273, 1);
    if(cljs.core.truth_(ks__17275)) {
      return cljs.core.assoc.call(null, m, k__17274, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__17274, null), ks__17275, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__17274, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__17274, null), args))
    }
  };
  var update_in = function(m, p__17267, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__17267, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__17276) {
    var m = cljs.core.first(arglist__17276);
    var p__17267 = cljs.core.first(cljs.core.next(arglist__17276));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17276)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17276)));
    return update_in__delegate(m, p__17267, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17279 = this;
  var h__2192__auto____17280 = this__17279.__hash;
  if(!(h__2192__auto____17280 == null)) {
    return h__2192__auto____17280
  }else {
    var h__2192__auto____17281 = cljs.core.hash_coll.call(null, coll);
    this__17279.__hash = h__2192__auto____17281;
    return h__2192__auto____17281
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17282 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17283 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17284 = this;
  var new_array__17285 = this__17284.array.slice();
  new_array__17285[k] = v;
  return new cljs.core.Vector(this__17284.meta, new_array__17285, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__17316 = null;
  var G__17316__2 = function(this_sym17286, k) {
    var this__17288 = this;
    var this_sym17286__17289 = this;
    var coll__17290 = this_sym17286__17289;
    return coll__17290.cljs$core$ILookup$_lookup$arity$2(coll__17290, k)
  };
  var G__17316__3 = function(this_sym17287, k, not_found) {
    var this__17288 = this;
    var this_sym17287__17291 = this;
    var coll__17292 = this_sym17287__17291;
    return coll__17292.cljs$core$ILookup$_lookup$arity$3(coll__17292, k, not_found)
  };
  G__17316 = function(this_sym17287, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17316__2.call(this, this_sym17287, k);
      case 3:
        return G__17316__3.call(this, this_sym17287, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17316
}();
cljs.core.Vector.prototype.apply = function(this_sym17277, args17278) {
  var this__17293 = this;
  return this_sym17277.call.apply(this_sym17277, [this_sym17277].concat(args17278.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17294 = this;
  var new_array__17295 = this__17294.array.slice();
  new_array__17295.push(o);
  return new cljs.core.Vector(this__17294.meta, new_array__17295, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__17296 = this;
  var this__17297 = this;
  return cljs.core.pr_str.call(null, this__17297)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__17298 = this;
  return cljs.core.ci_reduce.call(null, this__17298.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__17299 = this;
  return cljs.core.ci_reduce.call(null, this__17299.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17300 = this;
  if(this__17300.array.length > 0) {
    var vector_seq__17301 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__17300.array.length) {
          return cljs.core.cons.call(null, this__17300.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__17301.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17302 = this;
  return this__17302.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__17303 = this;
  var count__17304 = this__17303.array.length;
  if(count__17304 > 0) {
    return this__17303.array[count__17304 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__17305 = this;
  if(this__17305.array.length > 0) {
    var new_array__17306 = this__17305.array.slice();
    new_array__17306.pop();
    return new cljs.core.Vector(this__17305.meta, new_array__17306, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__17307 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17308 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17309 = this;
  return new cljs.core.Vector(meta, this__17309.array, this__17309.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17310 = this;
  return this__17310.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__17311 = this;
  if(function() {
    var and__3822__auto____17312 = 0 <= n;
    if(and__3822__auto____17312) {
      return n < this__17311.array.length
    }else {
      return and__3822__auto____17312
    }
  }()) {
    return this__17311.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__17313 = this;
  if(function() {
    var and__3822__auto____17314 = 0 <= n;
    if(and__3822__auto____17314) {
      return n < this__17313.array.length
    }else {
      return and__3822__auto____17314
    }
  }()) {
    return this__17313.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17315 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__17315.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__17318 = pv.cnt;
  if(cnt__17318 < 32) {
    return 0
  }else {
    return cnt__17318 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__17324 = level;
  var ret__17325 = node;
  while(true) {
    if(ll__17324 === 0) {
      return ret__17325
    }else {
      var embed__17326 = ret__17325;
      var r__17327 = cljs.core.pv_fresh_node.call(null, edit);
      var ___17328 = cljs.core.pv_aset.call(null, r__17327, 0, embed__17326);
      var G__17329 = ll__17324 - 5;
      var G__17330 = r__17327;
      ll__17324 = G__17329;
      ret__17325 = G__17330;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__17336 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__17337 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__17336, subidx__17337, tailnode);
    return ret__17336
  }else {
    var child__17338 = cljs.core.pv_aget.call(null, parent, subidx__17337);
    if(!(child__17338 == null)) {
      var node_to_insert__17339 = push_tail.call(null, pv, level - 5, child__17338, tailnode);
      cljs.core.pv_aset.call(null, ret__17336, subidx__17337, node_to_insert__17339);
      return ret__17336
    }else {
      var node_to_insert__17340 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__17336, subidx__17337, node_to_insert__17340);
      return ret__17336
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____17344 = 0 <= i;
    if(and__3822__auto____17344) {
      return i < pv.cnt
    }else {
      return and__3822__auto____17344
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__17345 = pv.root;
      var level__17346 = pv.shift;
      while(true) {
        if(level__17346 > 0) {
          var G__17347 = cljs.core.pv_aget.call(null, node__17345, i >>> level__17346 & 31);
          var G__17348 = level__17346 - 5;
          node__17345 = G__17347;
          level__17346 = G__17348;
          continue
        }else {
          return node__17345.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__17351 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__17351, i & 31, val);
    return ret__17351
  }else {
    var subidx__17352 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__17351, subidx__17352, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__17352), i, val));
    return ret__17351
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__17358 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__17359 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__17358));
    if(function() {
      var and__3822__auto____17360 = new_child__17359 == null;
      if(and__3822__auto____17360) {
        return subidx__17358 === 0
      }else {
        return and__3822__auto____17360
      }
    }()) {
      return null
    }else {
      var ret__17361 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__17361, subidx__17358, new_child__17359);
      return ret__17361
    }
  }else {
    if(subidx__17358 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__17362 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__17362, subidx__17358, null);
        return ret__17362
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__17365 = this;
  return new cljs.core.TransientVector(this__17365.cnt, this__17365.shift, cljs.core.tv_editable_root.call(null, this__17365.root), cljs.core.tv_editable_tail.call(null, this__17365.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17366 = this;
  var h__2192__auto____17367 = this__17366.__hash;
  if(!(h__2192__auto____17367 == null)) {
    return h__2192__auto____17367
  }else {
    var h__2192__auto____17368 = cljs.core.hash_coll.call(null, coll);
    this__17366.__hash = h__2192__auto____17368;
    return h__2192__auto____17368
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17369 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17370 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17371 = this;
  if(function() {
    var and__3822__auto____17372 = 0 <= k;
    if(and__3822__auto____17372) {
      return k < this__17371.cnt
    }else {
      return and__3822__auto____17372
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__17373 = this__17371.tail.slice();
      new_tail__17373[k & 31] = v;
      return new cljs.core.PersistentVector(this__17371.meta, this__17371.cnt, this__17371.shift, this__17371.root, new_tail__17373, null)
    }else {
      return new cljs.core.PersistentVector(this__17371.meta, this__17371.cnt, this__17371.shift, cljs.core.do_assoc.call(null, coll, this__17371.shift, this__17371.root, k, v), this__17371.tail, null)
    }
  }else {
    if(k === this__17371.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__17371.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__17421 = null;
  var G__17421__2 = function(this_sym17374, k) {
    var this__17376 = this;
    var this_sym17374__17377 = this;
    var coll__17378 = this_sym17374__17377;
    return coll__17378.cljs$core$ILookup$_lookup$arity$2(coll__17378, k)
  };
  var G__17421__3 = function(this_sym17375, k, not_found) {
    var this__17376 = this;
    var this_sym17375__17379 = this;
    var coll__17380 = this_sym17375__17379;
    return coll__17380.cljs$core$ILookup$_lookup$arity$3(coll__17380, k, not_found)
  };
  G__17421 = function(this_sym17375, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17421__2.call(this, this_sym17375, k);
      case 3:
        return G__17421__3.call(this, this_sym17375, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17421
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym17363, args17364) {
  var this__17381 = this;
  return this_sym17363.call.apply(this_sym17363, [this_sym17363].concat(args17364.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__17382 = this;
  var step_init__17383 = [0, init];
  var i__17384 = 0;
  while(true) {
    if(i__17384 < this__17382.cnt) {
      var arr__17385 = cljs.core.array_for.call(null, v, i__17384);
      var len__17386 = arr__17385.length;
      var init__17390 = function() {
        var j__17387 = 0;
        var init__17388 = step_init__17383[1];
        while(true) {
          if(j__17387 < len__17386) {
            var init__17389 = f.call(null, init__17388, j__17387 + i__17384, arr__17385[j__17387]);
            if(cljs.core.reduced_QMARK_.call(null, init__17389)) {
              return init__17389
            }else {
              var G__17422 = j__17387 + 1;
              var G__17423 = init__17389;
              j__17387 = G__17422;
              init__17388 = G__17423;
              continue
            }
          }else {
            step_init__17383[0] = len__17386;
            step_init__17383[1] = init__17388;
            return init__17388
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__17390)) {
        return cljs.core.deref.call(null, init__17390)
      }else {
        var G__17424 = i__17384 + step_init__17383[0];
        i__17384 = G__17424;
        continue
      }
    }else {
      return step_init__17383[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17391 = this;
  if(this__17391.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__17392 = this__17391.tail.slice();
    new_tail__17392.push(o);
    return new cljs.core.PersistentVector(this__17391.meta, this__17391.cnt + 1, this__17391.shift, this__17391.root, new_tail__17392, null)
  }else {
    var root_overflow_QMARK___17393 = this__17391.cnt >>> 5 > 1 << this__17391.shift;
    var new_shift__17394 = root_overflow_QMARK___17393 ? this__17391.shift + 5 : this__17391.shift;
    var new_root__17396 = root_overflow_QMARK___17393 ? function() {
      var n_r__17395 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__17395, 0, this__17391.root);
      cljs.core.pv_aset.call(null, n_r__17395, 1, cljs.core.new_path.call(null, null, this__17391.shift, new cljs.core.VectorNode(null, this__17391.tail)));
      return n_r__17395
    }() : cljs.core.push_tail.call(null, coll, this__17391.shift, this__17391.root, new cljs.core.VectorNode(null, this__17391.tail));
    return new cljs.core.PersistentVector(this__17391.meta, this__17391.cnt + 1, new_shift__17394, new_root__17396, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__17397 = this;
  if(this__17397.cnt > 0) {
    return new cljs.core.RSeq(coll, this__17397.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__17398 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__17399 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__17400 = this;
  var this__17401 = this;
  return cljs.core.pr_str.call(null, this__17401)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__17402 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__17403 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17404 = this;
  if(this__17404.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17405 = this;
  return this__17405.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__17406 = this;
  if(this__17406.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__17406.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__17407 = this;
  if(this__17407.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__17407.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__17407.meta)
    }else {
      if(1 < this__17407.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__17407.meta, this__17407.cnt - 1, this__17407.shift, this__17407.root, this__17407.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__17408 = cljs.core.array_for.call(null, coll, this__17407.cnt - 2);
          var nr__17409 = cljs.core.pop_tail.call(null, coll, this__17407.shift, this__17407.root);
          var new_root__17410 = nr__17409 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__17409;
          var cnt_1__17411 = this__17407.cnt - 1;
          if(function() {
            var and__3822__auto____17412 = 5 < this__17407.shift;
            if(and__3822__auto____17412) {
              return cljs.core.pv_aget.call(null, new_root__17410, 1) == null
            }else {
              return and__3822__auto____17412
            }
          }()) {
            return new cljs.core.PersistentVector(this__17407.meta, cnt_1__17411, this__17407.shift - 5, cljs.core.pv_aget.call(null, new_root__17410, 0), new_tail__17408, null)
          }else {
            return new cljs.core.PersistentVector(this__17407.meta, cnt_1__17411, this__17407.shift, new_root__17410, new_tail__17408, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__17413 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17414 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17415 = this;
  return new cljs.core.PersistentVector(meta, this__17415.cnt, this__17415.shift, this__17415.root, this__17415.tail, this__17415.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17416 = this;
  return this__17416.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__17417 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__17418 = this;
  if(function() {
    var and__3822__auto____17419 = 0 <= n;
    if(and__3822__auto____17419) {
      return n < this__17418.cnt
    }else {
      return and__3822__auto____17419
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17420 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__17420.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__17425 = xs.length;
  var xs__17426 = no_clone === true ? xs : xs.slice();
  if(l__17425 < 32) {
    return new cljs.core.PersistentVector(null, l__17425, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__17426, null)
  }else {
    var node__17427 = xs__17426.slice(0, 32);
    var v__17428 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__17427, null);
    var i__17429 = 32;
    var out__17430 = cljs.core._as_transient.call(null, v__17428);
    while(true) {
      if(i__17429 < l__17425) {
        var G__17431 = i__17429 + 1;
        var G__17432 = cljs.core.conj_BANG_.call(null, out__17430, xs__17426[i__17429]);
        i__17429 = G__17431;
        out__17430 = G__17432;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__17430)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__17433) {
    var args = cljs.core.seq(arglist__17433);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__17434 = this;
  if(this__17434.off + 1 < this__17434.node.length) {
    var s__17435 = cljs.core.chunked_seq.call(null, this__17434.vec, this__17434.node, this__17434.i, this__17434.off + 1);
    if(s__17435 == null) {
      return null
    }else {
      return s__17435
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17436 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17437 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17438 = this;
  return this__17438.node[this__17438.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17439 = this;
  if(this__17439.off + 1 < this__17439.node.length) {
    var s__17440 = cljs.core.chunked_seq.call(null, this__17439.vec, this__17439.node, this__17439.i, this__17439.off + 1);
    if(s__17440 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__17440
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__17441 = this;
  var l__17442 = this__17441.node.length;
  var s__17443 = this__17441.i + l__17442 < cljs.core._count.call(null, this__17441.vec) ? cljs.core.chunked_seq.call(null, this__17441.vec, this__17441.i + l__17442, 0) : null;
  if(s__17443 == null) {
    return null
  }else {
    return s__17443
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17444 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__17445 = this;
  return cljs.core.chunked_seq.call(null, this__17445.vec, this__17445.node, this__17445.i, this__17445.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__17446 = this;
  return this__17446.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17447 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__17447.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__17448 = this;
  return cljs.core.array_chunk.call(null, this__17448.node, this__17448.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__17449 = this;
  var l__17450 = this__17449.node.length;
  var s__17451 = this__17449.i + l__17450 < cljs.core._count.call(null, this__17449.vec) ? cljs.core.chunked_seq.call(null, this__17449.vec, this__17449.i + l__17450, 0) : null;
  if(s__17451 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__17451
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17454 = this;
  var h__2192__auto____17455 = this__17454.__hash;
  if(!(h__2192__auto____17455 == null)) {
    return h__2192__auto____17455
  }else {
    var h__2192__auto____17456 = cljs.core.hash_coll.call(null, coll);
    this__17454.__hash = h__2192__auto____17456;
    return h__2192__auto____17456
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17457 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17458 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__17459 = this;
  var v_pos__17460 = this__17459.start + key;
  return new cljs.core.Subvec(this__17459.meta, cljs.core._assoc.call(null, this__17459.v, v_pos__17460, val), this__17459.start, this__17459.end > v_pos__17460 + 1 ? this__17459.end : v_pos__17460 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__17486 = null;
  var G__17486__2 = function(this_sym17461, k) {
    var this__17463 = this;
    var this_sym17461__17464 = this;
    var coll__17465 = this_sym17461__17464;
    return coll__17465.cljs$core$ILookup$_lookup$arity$2(coll__17465, k)
  };
  var G__17486__3 = function(this_sym17462, k, not_found) {
    var this__17463 = this;
    var this_sym17462__17466 = this;
    var coll__17467 = this_sym17462__17466;
    return coll__17467.cljs$core$ILookup$_lookup$arity$3(coll__17467, k, not_found)
  };
  G__17486 = function(this_sym17462, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17486__2.call(this, this_sym17462, k);
      case 3:
        return G__17486__3.call(this, this_sym17462, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17486
}();
cljs.core.Subvec.prototype.apply = function(this_sym17452, args17453) {
  var this__17468 = this;
  return this_sym17452.call.apply(this_sym17452, [this_sym17452].concat(args17453.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17469 = this;
  return new cljs.core.Subvec(this__17469.meta, cljs.core._assoc_n.call(null, this__17469.v, this__17469.end, o), this__17469.start, this__17469.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__17470 = this;
  var this__17471 = this;
  return cljs.core.pr_str.call(null, this__17471)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__17472 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__17473 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17474 = this;
  var subvec_seq__17475 = function subvec_seq(i) {
    if(i === this__17474.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__17474.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__17475.call(null, this__17474.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17476 = this;
  return this__17476.end - this__17476.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__17477 = this;
  return cljs.core._nth.call(null, this__17477.v, this__17477.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__17478 = this;
  if(this__17478.start === this__17478.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__17478.meta, this__17478.v, this__17478.start, this__17478.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__17479 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17480 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17481 = this;
  return new cljs.core.Subvec(meta, this__17481.v, this__17481.start, this__17481.end, this__17481.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17482 = this;
  return this__17482.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__17483 = this;
  return cljs.core._nth.call(null, this__17483.v, this__17483.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__17484 = this;
  return cljs.core._nth.call(null, this__17484.v, this__17484.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17485 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__17485.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__17488 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__17488, 0, tl.length);
  return ret__17488
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__17492 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__17493 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__17492, subidx__17493, level === 5 ? tail_node : function() {
    var child__17494 = cljs.core.pv_aget.call(null, ret__17492, subidx__17493);
    if(!(child__17494 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__17494, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__17492
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__17499 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__17500 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__17501 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__17499, subidx__17500));
    if(function() {
      var and__3822__auto____17502 = new_child__17501 == null;
      if(and__3822__auto____17502) {
        return subidx__17500 === 0
      }else {
        return and__3822__auto____17502
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__17499, subidx__17500, new_child__17501);
      return node__17499
    }
  }else {
    if(subidx__17500 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__17499, subidx__17500, null);
        return node__17499
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____17507 = 0 <= i;
    if(and__3822__auto____17507) {
      return i < tv.cnt
    }else {
      return and__3822__auto____17507
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__17508 = tv.root;
      var node__17509 = root__17508;
      var level__17510 = tv.shift;
      while(true) {
        if(level__17510 > 0) {
          var G__17511 = cljs.core.tv_ensure_editable.call(null, root__17508.edit, cljs.core.pv_aget.call(null, node__17509, i >>> level__17510 & 31));
          var G__17512 = level__17510 - 5;
          node__17509 = G__17511;
          level__17510 = G__17512;
          continue
        }else {
          return node__17509.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__17552 = null;
  var G__17552__2 = function(this_sym17515, k) {
    var this__17517 = this;
    var this_sym17515__17518 = this;
    var coll__17519 = this_sym17515__17518;
    return coll__17519.cljs$core$ILookup$_lookup$arity$2(coll__17519, k)
  };
  var G__17552__3 = function(this_sym17516, k, not_found) {
    var this__17517 = this;
    var this_sym17516__17520 = this;
    var coll__17521 = this_sym17516__17520;
    return coll__17521.cljs$core$ILookup$_lookup$arity$3(coll__17521, k, not_found)
  };
  G__17552 = function(this_sym17516, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17552__2.call(this, this_sym17516, k);
      case 3:
        return G__17552__3.call(this, this_sym17516, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17552
}();
cljs.core.TransientVector.prototype.apply = function(this_sym17513, args17514) {
  var this__17522 = this;
  return this_sym17513.call.apply(this_sym17513, [this_sym17513].concat(args17514.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17523 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17524 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__17525 = this;
  if(this__17525.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__17526 = this;
  if(function() {
    var and__3822__auto____17527 = 0 <= n;
    if(and__3822__auto____17527) {
      return n < this__17526.cnt
    }else {
      return and__3822__auto____17527
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17528 = this;
  if(this__17528.root.edit) {
    return this__17528.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__17529 = this;
  if(this__17529.root.edit) {
    if(function() {
      var and__3822__auto____17530 = 0 <= n;
      if(and__3822__auto____17530) {
        return n < this__17529.cnt
      }else {
        return and__3822__auto____17530
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__17529.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__17535 = function go(level, node) {
          var node__17533 = cljs.core.tv_ensure_editable.call(null, this__17529.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__17533, n & 31, val);
            return node__17533
          }else {
            var subidx__17534 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__17533, subidx__17534, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__17533, subidx__17534)));
            return node__17533
          }
        }.call(null, this__17529.shift, this__17529.root);
        this__17529.root = new_root__17535;
        return tcoll
      }
    }else {
      if(n === this__17529.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__17529.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__17536 = this;
  if(this__17536.root.edit) {
    if(this__17536.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__17536.cnt) {
        this__17536.cnt = 0;
        return tcoll
      }else {
        if((this__17536.cnt - 1 & 31) > 0) {
          this__17536.cnt = this__17536.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__17537 = cljs.core.editable_array_for.call(null, tcoll, this__17536.cnt - 2);
            var new_root__17539 = function() {
              var nr__17538 = cljs.core.tv_pop_tail.call(null, tcoll, this__17536.shift, this__17536.root);
              if(!(nr__17538 == null)) {
                return nr__17538
              }else {
                return new cljs.core.VectorNode(this__17536.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____17540 = 5 < this__17536.shift;
              if(and__3822__auto____17540) {
                return cljs.core.pv_aget.call(null, new_root__17539, 1) == null
              }else {
                return and__3822__auto____17540
              }
            }()) {
              var new_root__17541 = cljs.core.tv_ensure_editable.call(null, this__17536.root.edit, cljs.core.pv_aget.call(null, new_root__17539, 0));
              this__17536.root = new_root__17541;
              this__17536.shift = this__17536.shift - 5;
              this__17536.cnt = this__17536.cnt - 1;
              this__17536.tail = new_tail__17537;
              return tcoll
            }else {
              this__17536.root = new_root__17539;
              this__17536.cnt = this__17536.cnt - 1;
              this__17536.tail = new_tail__17537;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__17542 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__17543 = this;
  if(this__17543.root.edit) {
    if(this__17543.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__17543.tail[this__17543.cnt & 31] = o;
      this__17543.cnt = this__17543.cnt + 1;
      return tcoll
    }else {
      var tail_node__17544 = new cljs.core.VectorNode(this__17543.root.edit, this__17543.tail);
      var new_tail__17545 = cljs.core.make_array.call(null, 32);
      new_tail__17545[0] = o;
      this__17543.tail = new_tail__17545;
      if(this__17543.cnt >>> 5 > 1 << this__17543.shift) {
        var new_root_array__17546 = cljs.core.make_array.call(null, 32);
        var new_shift__17547 = this__17543.shift + 5;
        new_root_array__17546[0] = this__17543.root;
        new_root_array__17546[1] = cljs.core.new_path.call(null, this__17543.root.edit, this__17543.shift, tail_node__17544);
        this__17543.root = new cljs.core.VectorNode(this__17543.root.edit, new_root_array__17546);
        this__17543.shift = new_shift__17547;
        this__17543.cnt = this__17543.cnt + 1;
        return tcoll
      }else {
        var new_root__17548 = cljs.core.tv_push_tail.call(null, tcoll, this__17543.shift, this__17543.root, tail_node__17544);
        this__17543.root = new_root__17548;
        this__17543.cnt = this__17543.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__17549 = this;
  if(this__17549.root.edit) {
    this__17549.root.edit = null;
    var len__17550 = this__17549.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__17551 = cljs.core.make_array.call(null, len__17550);
    cljs.core.array_copy.call(null, this__17549.tail, 0, trimmed_tail__17551, 0, len__17550);
    return new cljs.core.PersistentVector(null, this__17549.cnt, this__17549.shift, this__17549.root, trimmed_tail__17551, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17553 = this;
  var h__2192__auto____17554 = this__17553.__hash;
  if(!(h__2192__auto____17554 == null)) {
    return h__2192__auto____17554
  }else {
    var h__2192__auto____17555 = cljs.core.hash_coll.call(null, coll);
    this__17553.__hash = h__2192__auto____17555;
    return h__2192__auto____17555
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17556 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__17557 = this;
  var this__17558 = this;
  return cljs.core.pr_str.call(null, this__17558)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17559 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17560 = this;
  return cljs.core._first.call(null, this__17560.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17561 = this;
  var temp__3971__auto____17562 = cljs.core.next.call(null, this__17561.front);
  if(temp__3971__auto____17562) {
    var f1__17563 = temp__3971__auto____17562;
    return new cljs.core.PersistentQueueSeq(this__17561.meta, f1__17563, this__17561.rear, null)
  }else {
    if(this__17561.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__17561.meta, this__17561.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17564 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17565 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__17565.front, this__17565.rear, this__17565.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17566 = this;
  return this__17566.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17567 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17567.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17568 = this;
  var h__2192__auto____17569 = this__17568.__hash;
  if(!(h__2192__auto____17569 == null)) {
    return h__2192__auto____17569
  }else {
    var h__2192__auto____17570 = cljs.core.hash_coll.call(null, coll);
    this__17568.__hash = h__2192__auto____17570;
    return h__2192__auto____17570
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17571 = this;
  if(cljs.core.truth_(this__17571.front)) {
    return new cljs.core.PersistentQueue(this__17571.meta, this__17571.count + 1, this__17571.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____17572 = this__17571.rear;
      if(cljs.core.truth_(or__3824__auto____17572)) {
        return or__3824__auto____17572
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__17571.meta, this__17571.count + 1, cljs.core.conj.call(null, this__17571.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__17573 = this;
  var this__17574 = this;
  return cljs.core.pr_str.call(null, this__17574)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17575 = this;
  var rear__17576 = cljs.core.seq.call(null, this__17575.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____17577 = this__17575.front;
    if(cljs.core.truth_(or__3824__auto____17577)) {
      return or__3824__auto____17577
    }else {
      return rear__17576
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__17575.front, cljs.core.seq.call(null, rear__17576), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17578 = this;
  return this__17578.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__17579 = this;
  return cljs.core._first.call(null, this__17579.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__17580 = this;
  if(cljs.core.truth_(this__17580.front)) {
    var temp__3971__auto____17581 = cljs.core.next.call(null, this__17580.front);
    if(temp__3971__auto____17581) {
      var f1__17582 = temp__3971__auto____17581;
      return new cljs.core.PersistentQueue(this__17580.meta, this__17580.count - 1, f1__17582, this__17580.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__17580.meta, this__17580.count - 1, cljs.core.seq.call(null, this__17580.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17583 = this;
  return cljs.core.first.call(null, this__17583.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17584 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17585 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17586 = this;
  return new cljs.core.PersistentQueue(meta, this__17586.count, this__17586.front, this__17586.rear, this__17586.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17587 = this;
  return this__17587.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17588 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__17589 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__17592 = array.length;
  var i__17593 = 0;
  while(true) {
    if(i__17593 < len__17592) {
      if(k === array[i__17593]) {
        return i__17593
      }else {
        var G__17594 = i__17593 + incr;
        i__17593 = G__17594;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__17597 = cljs.core.hash.call(null, a);
  var b__17598 = cljs.core.hash.call(null, b);
  if(a__17597 < b__17598) {
    return-1
  }else {
    if(a__17597 > b__17598) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__17606 = m.keys;
  var len__17607 = ks__17606.length;
  var so__17608 = m.strobj;
  var out__17609 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__17610 = 0;
  var out__17611 = cljs.core.transient$.call(null, out__17609);
  while(true) {
    if(i__17610 < len__17607) {
      var k__17612 = ks__17606[i__17610];
      var G__17613 = i__17610 + 1;
      var G__17614 = cljs.core.assoc_BANG_.call(null, out__17611, k__17612, so__17608[k__17612]);
      i__17610 = G__17613;
      out__17611 = G__17614;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__17611, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__17620 = {};
  var l__17621 = ks.length;
  var i__17622 = 0;
  while(true) {
    if(i__17622 < l__17621) {
      var k__17623 = ks[i__17622];
      new_obj__17620[k__17623] = obj[k__17623];
      var G__17624 = i__17622 + 1;
      i__17622 = G__17624;
      continue
    }else {
    }
    break
  }
  return new_obj__17620
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__17627 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17628 = this;
  var h__2192__auto____17629 = this__17628.__hash;
  if(!(h__2192__auto____17629 == null)) {
    return h__2192__auto____17629
  }else {
    var h__2192__auto____17630 = cljs.core.hash_imap.call(null, coll);
    this__17628.__hash = h__2192__auto____17630;
    return h__2192__auto____17630
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17631 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17632 = this;
  if(function() {
    var and__3822__auto____17633 = goog.isString(k);
    if(and__3822__auto____17633) {
      return!(cljs.core.scan_array.call(null, 1, k, this__17632.keys) == null)
    }else {
      return and__3822__auto____17633
    }
  }()) {
    return this__17632.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17634 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____17635 = this__17634.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____17635) {
        return or__3824__auto____17635
      }else {
        return this__17634.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__17634.keys) == null)) {
        var new_strobj__17636 = cljs.core.obj_clone.call(null, this__17634.strobj, this__17634.keys);
        new_strobj__17636[k] = v;
        return new cljs.core.ObjMap(this__17634.meta, this__17634.keys, new_strobj__17636, this__17634.update_count + 1, null)
      }else {
        var new_strobj__17637 = cljs.core.obj_clone.call(null, this__17634.strobj, this__17634.keys);
        var new_keys__17638 = this__17634.keys.slice();
        new_strobj__17637[k] = v;
        new_keys__17638.push(k);
        return new cljs.core.ObjMap(this__17634.meta, new_keys__17638, new_strobj__17637, this__17634.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__17639 = this;
  if(function() {
    var and__3822__auto____17640 = goog.isString(k);
    if(and__3822__auto____17640) {
      return!(cljs.core.scan_array.call(null, 1, k, this__17639.keys) == null)
    }else {
      return and__3822__auto____17640
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__17662 = null;
  var G__17662__2 = function(this_sym17641, k) {
    var this__17643 = this;
    var this_sym17641__17644 = this;
    var coll__17645 = this_sym17641__17644;
    return coll__17645.cljs$core$ILookup$_lookup$arity$2(coll__17645, k)
  };
  var G__17662__3 = function(this_sym17642, k, not_found) {
    var this__17643 = this;
    var this_sym17642__17646 = this;
    var coll__17647 = this_sym17642__17646;
    return coll__17647.cljs$core$ILookup$_lookup$arity$3(coll__17647, k, not_found)
  };
  G__17662 = function(this_sym17642, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17662__2.call(this, this_sym17642, k);
      case 3:
        return G__17662__3.call(this, this_sym17642, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17662
}();
cljs.core.ObjMap.prototype.apply = function(this_sym17625, args17626) {
  var this__17648 = this;
  return this_sym17625.call.apply(this_sym17625, [this_sym17625].concat(args17626.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__17649 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__17650 = this;
  var this__17651 = this;
  return cljs.core.pr_str.call(null, this__17651)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17652 = this;
  if(this__17652.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__17615_SHARP_) {
      return cljs.core.vector.call(null, p1__17615_SHARP_, this__17652.strobj[p1__17615_SHARP_])
    }, this__17652.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17653 = this;
  return this__17653.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17654 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17655 = this;
  return new cljs.core.ObjMap(meta, this__17655.keys, this__17655.strobj, this__17655.update_count, this__17655.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17656 = this;
  return this__17656.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17657 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__17657.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__17658 = this;
  if(function() {
    var and__3822__auto____17659 = goog.isString(k);
    if(and__3822__auto____17659) {
      return!(cljs.core.scan_array.call(null, 1, k, this__17658.keys) == null)
    }else {
      return and__3822__auto____17659
    }
  }()) {
    var new_keys__17660 = this__17658.keys.slice();
    var new_strobj__17661 = cljs.core.obj_clone.call(null, this__17658.strobj, this__17658.keys);
    new_keys__17660.splice(cljs.core.scan_array.call(null, 1, k, new_keys__17660), 1);
    cljs.core.js_delete.call(null, new_strobj__17661, k);
    return new cljs.core.ObjMap(this__17658.meta, new_keys__17660, new_strobj__17661, this__17658.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17666 = this;
  var h__2192__auto____17667 = this__17666.__hash;
  if(!(h__2192__auto____17667 == null)) {
    return h__2192__auto____17667
  }else {
    var h__2192__auto____17668 = cljs.core.hash_imap.call(null, coll);
    this__17666.__hash = h__2192__auto____17668;
    return h__2192__auto____17668
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17669 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17670 = this;
  var bucket__17671 = this__17670.hashobj[cljs.core.hash.call(null, k)];
  var i__17672 = cljs.core.truth_(bucket__17671) ? cljs.core.scan_array.call(null, 2, k, bucket__17671) : null;
  if(cljs.core.truth_(i__17672)) {
    return bucket__17671[i__17672 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17673 = this;
  var h__17674 = cljs.core.hash.call(null, k);
  var bucket__17675 = this__17673.hashobj[h__17674];
  if(cljs.core.truth_(bucket__17675)) {
    var new_bucket__17676 = bucket__17675.slice();
    var new_hashobj__17677 = goog.object.clone(this__17673.hashobj);
    new_hashobj__17677[h__17674] = new_bucket__17676;
    var temp__3971__auto____17678 = cljs.core.scan_array.call(null, 2, k, new_bucket__17676);
    if(cljs.core.truth_(temp__3971__auto____17678)) {
      var i__17679 = temp__3971__auto____17678;
      new_bucket__17676[i__17679 + 1] = v;
      return new cljs.core.HashMap(this__17673.meta, this__17673.count, new_hashobj__17677, null)
    }else {
      new_bucket__17676.push(k, v);
      return new cljs.core.HashMap(this__17673.meta, this__17673.count + 1, new_hashobj__17677, null)
    }
  }else {
    var new_hashobj__17680 = goog.object.clone(this__17673.hashobj);
    new_hashobj__17680[h__17674] = [k, v];
    return new cljs.core.HashMap(this__17673.meta, this__17673.count + 1, new_hashobj__17680, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__17681 = this;
  var bucket__17682 = this__17681.hashobj[cljs.core.hash.call(null, k)];
  var i__17683 = cljs.core.truth_(bucket__17682) ? cljs.core.scan_array.call(null, 2, k, bucket__17682) : null;
  if(cljs.core.truth_(i__17683)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__17708 = null;
  var G__17708__2 = function(this_sym17684, k) {
    var this__17686 = this;
    var this_sym17684__17687 = this;
    var coll__17688 = this_sym17684__17687;
    return coll__17688.cljs$core$ILookup$_lookup$arity$2(coll__17688, k)
  };
  var G__17708__3 = function(this_sym17685, k, not_found) {
    var this__17686 = this;
    var this_sym17685__17689 = this;
    var coll__17690 = this_sym17685__17689;
    return coll__17690.cljs$core$ILookup$_lookup$arity$3(coll__17690, k, not_found)
  };
  G__17708 = function(this_sym17685, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17708__2.call(this, this_sym17685, k);
      case 3:
        return G__17708__3.call(this, this_sym17685, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17708
}();
cljs.core.HashMap.prototype.apply = function(this_sym17664, args17665) {
  var this__17691 = this;
  return this_sym17664.call.apply(this_sym17664, [this_sym17664].concat(args17665.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__17692 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__17693 = this;
  var this__17694 = this;
  return cljs.core.pr_str.call(null, this__17694)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17695 = this;
  if(this__17695.count > 0) {
    var hashes__17696 = cljs.core.js_keys.call(null, this__17695.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__17663_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__17695.hashobj[p1__17663_SHARP_]))
    }, hashes__17696)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17697 = this;
  return this__17697.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17698 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17699 = this;
  return new cljs.core.HashMap(meta, this__17699.count, this__17699.hashobj, this__17699.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17700 = this;
  return this__17700.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17701 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__17701.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__17702 = this;
  var h__17703 = cljs.core.hash.call(null, k);
  var bucket__17704 = this__17702.hashobj[h__17703];
  var i__17705 = cljs.core.truth_(bucket__17704) ? cljs.core.scan_array.call(null, 2, k, bucket__17704) : null;
  if(cljs.core.not.call(null, i__17705)) {
    return coll
  }else {
    var new_hashobj__17706 = goog.object.clone(this__17702.hashobj);
    if(3 > bucket__17704.length) {
      cljs.core.js_delete.call(null, new_hashobj__17706, h__17703)
    }else {
      var new_bucket__17707 = bucket__17704.slice();
      new_bucket__17707.splice(i__17705, 2);
      new_hashobj__17706[h__17703] = new_bucket__17707
    }
    return new cljs.core.HashMap(this__17702.meta, this__17702.count - 1, new_hashobj__17706, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__17709 = ks.length;
  var i__17710 = 0;
  var out__17711 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__17710 < len__17709) {
      var G__17712 = i__17710 + 1;
      var G__17713 = cljs.core.assoc.call(null, out__17711, ks[i__17710], vs[i__17710]);
      i__17710 = G__17712;
      out__17711 = G__17713;
      continue
    }else {
      return out__17711
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__17717 = m.arr;
  var len__17718 = arr__17717.length;
  var i__17719 = 0;
  while(true) {
    if(len__17718 <= i__17719) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__17717[i__17719], k)) {
        return i__17719
      }else {
        if("\ufdd0'else") {
          var G__17720 = i__17719 + 2;
          i__17719 = G__17720;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__17723 = this;
  return new cljs.core.TransientArrayMap({}, this__17723.arr.length, this__17723.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17724 = this;
  var h__2192__auto____17725 = this__17724.__hash;
  if(!(h__2192__auto____17725 == null)) {
    return h__2192__auto____17725
  }else {
    var h__2192__auto____17726 = cljs.core.hash_imap.call(null, coll);
    this__17724.__hash = h__2192__auto____17726;
    return h__2192__auto____17726
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17727 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17728 = this;
  var idx__17729 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__17729 === -1) {
    return not_found
  }else {
    return this__17728.arr[idx__17729 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17730 = this;
  var idx__17731 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__17731 === -1) {
    if(this__17730.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__17730.meta, this__17730.cnt + 1, function() {
        var G__17732__17733 = this__17730.arr.slice();
        G__17732__17733.push(k);
        G__17732__17733.push(v);
        return G__17732__17733
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__17730.arr[idx__17731 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__17730.meta, this__17730.cnt, function() {
          var G__17734__17735 = this__17730.arr.slice();
          G__17734__17735[idx__17731 + 1] = v;
          return G__17734__17735
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__17736 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__17768 = null;
  var G__17768__2 = function(this_sym17737, k) {
    var this__17739 = this;
    var this_sym17737__17740 = this;
    var coll__17741 = this_sym17737__17740;
    return coll__17741.cljs$core$ILookup$_lookup$arity$2(coll__17741, k)
  };
  var G__17768__3 = function(this_sym17738, k, not_found) {
    var this__17739 = this;
    var this_sym17738__17742 = this;
    var coll__17743 = this_sym17738__17742;
    return coll__17743.cljs$core$ILookup$_lookup$arity$3(coll__17743, k, not_found)
  };
  G__17768 = function(this_sym17738, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17768__2.call(this, this_sym17738, k);
      case 3:
        return G__17768__3.call(this, this_sym17738, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17768
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym17721, args17722) {
  var this__17744 = this;
  return this_sym17721.call.apply(this_sym17721, [this_sym17721].concat(args17722.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__17745 = this;
  var len__17746 = this__17745.arr.length;
  var i__17747 = 0;
  var init__17748 = init;
  while(true) {
    if(i__17747 < len__17746) {
      var init__17749 = f.call(null, init__17748, this__17745.arr[i__17747], this__17745.arr[i__17747 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__17749)) {
        return cljs.core.deref.call(null, init__17749)
      }else {
        var G__17769 = i__17747 + 2;
        var G__17770 = init__17749;
        i__17747 = G__17769;
        init__17748 = G__17770;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__17750 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__17751 = this;
  var this__17752 = this;
  return cljs.core.pr_str.call(null, this__17752)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17753 = this;
  if(this__17753.cnt > 0) {
    var len__17754 = this__17753.arr.length;
    var array_map_seq__17755 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__17754) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__17753.arr[i], this__17753.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__17755.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17756 = this;
  return this__17756.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17757 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17758 = this;
  return new cljs.core.PersistentArrayMap(meta, this__17758.cnt, this__17758.arr, this__17758.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17759 = this;
  return this__17759.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17760 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__17760.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__17761 = this;
  var idx__17762 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__17762 >= 0) {
    var len__17763 = this__17761.arr.length;
    var new_len__17764 = len__17763 - 2;
    if(new_len__17764 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__17765 = cljs.core.make_array.call(null, new_len__17764);
      var s__17766 = 0;
      var d__17767 = 0;
      while(true) {
        if(s__17766 >= len__17763) {
          return new cljs.core.PersistentArrayMap(this__17761.meta, this__17761.cnt - 1, new_arr__17765, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__17761.arr[s__17766])) {
            var G__17771 = s__17766 + 2;
            var G__17772 = d__17767;
            s__17766 = G__17771;
            d__17767 = G__17772;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__17765[d__17767] = this__17761.arr[s__17766];
              new_arr__17765[d__17767 + 1] = this__17761.arr[s__17766 + 1];
              var G__17773 = s__17766 + 2;
              var G__17774 = d__17767 + 2;
              s__17766 = G__17773;
              d__17767 = G__17774;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__17775 = cljs.core.count.call(null, ks);
  var i__17776 = 0;
  var out__17777 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__17776 < len__17775) {
      var G__17778 = i__17776 + 1;
      var G__17779 = cljs.core.assoc_BANG_.call(null, out__17777, ks[i__17776], vs[i__17776]);
      i__17776 = G__17778;
      out__17777 = G__17779;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__17777)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__17780 = this;
  if(cljs.core.truth_(this__17780.editable_QMARK_)) {
    var idx__17781 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__17781 >= 0) {
      this__17780.arr[idx__17781] = this__17780.arr[this__17780.len - 2];
      this__17780.arr[idx__17781 + 1] = this__17780.arr[this__17780.len - 1];
      var G__17782__17783 = this__17780.arr;
      G__17782__17783.pop();
      G__17782__17783.pop();
      G__17782__17783;
      this__17780.len = this__17780.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__17784 = this;
  if(cljs.core.truth_(this__17784.editable_QMARK_)) {
    var idx__17785 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__17785 === -1) {
      if(this__17784.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__17784.len = this__17784.len + 2;
        this__17784.arr.push(key);
        this__17784.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__17784.len, this__17784.arr), key, val)
      }
    }else {
      if(val === this__17784.arr[idx__17785 + 1]) {
        return tcoll
      }else {
        this__17784.arr[idx__17785 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__17786 = this;
  if(cljs.core.truth_(this__17786.editable_QMARK_)) {
    if(function() {
      var G__17787__17788 = o;
      if(G__17787__17788) {
        if(function() {
          var or__3824__auto____17789 = G__17787__17788.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____17789) {
            return or__3824__auto____17789
          }else {
            return G__17787__17788.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__17787__17788.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__17787__17788)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__17787__17788)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__17790 = cljs.core.seq.call(null, o);
      var tcoll__17791 = tcoll;
      while(true) {
        var temp__3971__auto____17792 = cljs.core.first.call(null, es__17790);
        if(cljs.core.truth_(temp__3971__auto____17792)) {
          var e__17793 = temp__3971__auto____17792;
          var G__17799 = cljs.core.next.call(null, es__17790);
          var G__17800 = tcoll__17791.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__17791, cljs.core.key.call(null, e__17793), cljs.core.val.call(null, e__17793));
          es__17790 = G__17799;
          tcoll__17791 = G__17800;
          continue
        }else {
          return tcoll__17791
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__17794 = this;
  if(cljs.core.truth_(this__17794.editable_QMARK_)) {
    this__17794.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__17794.len, 2), this__17794.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__17795 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__17796 = this;
  if(cljs.core.truth_(this__17796.editable_QMARK_)) {
    var idx__17797 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__17797 === -1) {
      return not_found
    }else {
      return this__17796.arr[idx__17797 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__17798 = this;
  if(cljs.core.truth_(this__17798.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__17798.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__17803 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__17804 = 0;
  while(true) {
    if(i__17804 < len) {
      var G__17805 = cljs.core.assoc_BANG_.call(null, out__17803, arr[i__17804], arr[i__17804 + 1]);
      var G__17806 = i__17804 + 2;
      out__17803 = G__17805;
      i__17804 = G__17806;
      continue
    }else {
      return out__17803
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__17811__17812 = arr.slice();
    G__17811__17812[i] = a;
    return G__17811__17812
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__17813__17814 = arr.slice();
    G__17813__17814[i] = a;
    G__17813__17814[j] = b;
    return G__17813__17814
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__17816 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__17816, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__17816, 2 * i, new_arr__17816.length - 2 * i);
  return new_arr__17816
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__17819 = inode.ensure_editable(edit);
    editable__17819.arr[i] = a;
    return editable__17819
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__17820 = inode.ensure_editable(edit);
    editable__17820.arr[i] = a;
    editable__17820.arr[j] = b;
    return editable__17820
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__17827 = arr.length;
  var i__17828 = 0;
  var init__17829 = init;
  while(true) {
    if(i__17828 < len__17827) {
      var init__17832 = function() {
        var k__17830 = arr[i__17828];
        if(!(k__17830 == null)) {
          return f.call(null, init__17829, k__17830, arr[i__17828 + 1])
        }else {
          var node__17831 = arr[i__17828 + 1];
          if(!(node__17831 == null)) {
            return node__17831.kv_reduce(f, init__17829)
          }else {
            return init__17829
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__17832)) {
        return cljs.core.deref.call(null, init__17832)
      }else {
        var G__17833 = i__17828 + 2;
        var G__17834 = init__17832;
        i__17828 = G__17833;
        init__17829 = G__17834;
        continue
      }
    }else {
      return init__17829
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__17835 = this;
  var inode__17836 = this;
  if(this__17835.bitmap === bit) {
    return null
  }else {
    var editable__17837 = inode__17836.ensure_editable(e);
    var earr__17838 = editable__17837.arr;
    var len__17839 = earr__17838.length;
    editable__17837.bitmap = bit ^ editable__17837.bitmap;
    cljs.core.array_copy.call(null, earr__17838, 2 * (i + 1), earr__17838, 2 * i, len__17839 - 2 * (i + 1));
    earr__17838[len__17839 - 2] = null;
    earr__17838[len__17839 - 1] = null;
    return editable__17837
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__17840 = this;
  var inode__17841 = this;
  var bit__17842 = 1 << (hash >>> shift & 31);
  var idx__17843 = cljs.core.bitmap_indexed_node_index.call(null, this__17840.bitmap, bit__17842);
  if((this__17840.bitmap & bit__17842) === 0) {
    var n__17844 = cljs.core.bit_count.call(null, this__17840.bitmap);
    if(2 * n__17844 < this__17840.arr.length) {
      var editable__17845 = inode__17841.ensure_editable(edit);
      var earr__17846 = editable__17845.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__17846, 2 * idx__17843, earr__17846, 2 * (idx__17843 + 1), 2 * (n__17844 - idx__17843));
      earr__17846[2 * idx__17843] = key;
      earr__17846[2 * idx__17843 + 1] = val;
      editable__17845.bitmap = editable__17845.bitmap | bit__17842;
      return editable__17845
    }else {
      if(n__17844 >= 16) {
        var nodes__17847 = cljs.core.make_array.call(null, 32);
        var jdx__17848 = hash >>> shift & 31;
        nodes__17847[jdx__17848] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__17849 = 0;
        var j__17850 = 0;
        while(true) {
          if(i__17849 < 32) {
            if((this__17840.bitmap >>> i__17849 & 1) === 0) {
              var G__17903 = i__17849 + 1;
              var G__17904 = j__17850;
              i__17849 = G__17903;
              j__17850 = G__17904;
              continue
            }else {
              nodes__17847[i__17849] = !(this__17840.arr[j__17850] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__17840.arr[j__17850]), this__17840.arr[j__17850], this__17840.arr[j__17850 + 1], added_leaf_QMARK_) : this__17840.arr[j__17850 + 1];
              var G__17905 = i__17849 + 1;
              var G__17906 = j__17850 + 2;
              i__17849 = G__17905;
              j__17850 = G__17906;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__17844 + 1, nodes__17847)
      }else {
        if("\ufdd0'else") {
          var new_arr__17851 = cljs.core.make_array.call(null, 2 * (n__17844 + 4));
          cljs.core.array_copy.call(null, this__17840.arr, 0, new_arr__17851, 0, 2 * idx__17843);
          new_arr__17851[2 * idx__17843] = key;
          new_arr__17851[2 * idx__17843 + 1] = val;
          cljs.core.array_copy.call(null, this__17840.arr, 2 * idx__17843, new_arr__17851, 2 * (idx__17843 + 1), 2 * (n__17844 - idx__17843));
          added_leaf_QMARK_.val = true;
          var editable__17852 = inode__17841.ensure_editable(edit);
          editable__17852.arr = new_arr__17851;
          editable__17852.bitmap = editable__17852.bitmap | bit__17842;
          return editable__17852
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__17853 = this__17840.arr[2 * idx__17843];
    var val_or_node__17854 = this__17840.arr[2 * idx__17843 + 1];
    if(key_or_nil__17853 == null) {
      var n__17855 = val_or_node__17854.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__17855 === val_or_node__17854) {
        return inode__17841
      }else {
        return cljs.core.edit_and_set.call(null, inode__17841, edit, 2 * idx__17843 + 1, n__17855)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17853)) {
        if(val === val_or_node__17854) {
          return inode__17841
        }else {
          return cljs.core.edit_and_set.call(null, inode__17841, edit, 2 * idx__17843 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__17841, edit, 2 * idx__17843, null, 2 * idx__17843 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__17853, val_or_node__17854, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__17856 = this;
  var inode__17857 = this;
  return cljs.core.create_inode_seq.call(null, this__17856.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17858 = this;
  var inode__17859 = this;
  var bit__17860 = 1 << (hash >>> shift & 31);
  if((this__17858.bitmap & bit__17860) === 0) {
    return inode__17859
  }else {
    var idx__17861 = cljs.core.bitmap_indexed_node_index.call(null, this__17858.bitmap, bit__17860);
    var key_or_nil__17862 = this__17858.arr[2 * idx__17861];
    var val_or_node__17863 = this__17858.arr[2 * idx__17861 + 1];
    if(key_or_nil__17862 == null) {
      var n__17864 = val_or_node__17863.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__17864 === val_or_node__17863) {
        return inode__17859
      }else {
        if(!(n__17864 == null)) {
          return cljs.core.edit_and_set.call(null, inode__17859, edit, 2 * idx__17861 + 1, n__17864)
        }else {
          if(this__17858.bitmap === bit__17860) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__17859.edit_and_remove_pair(edit, bit__17860, idx__17861)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17862)) {
        removed_leaf_QMARK_[0] = true;
        return inode__17859.edit_and_remove_pair(edit, bit__17860, idx__17861)
      }else {
        if("\ufdd0'else") {
          return inode__17859
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__17865 = this;
  var inode__17866 = this;
  if(e === this__17865.edit) {
    return inode__17866
  }else {
    var n__17867 = cljs.core.bit_count.call(null, this__17865.bitmap);
    var new_arr__17868 = cljs.core.make_array.call(null, n__17867 < 0 ? 4 : 2 * (n__17867 + 1));
    cljs.core.array_copy.call(null, this__17865.arr, 0, new_arr__17868, 0, 2 * n__17867);
    return new cljs.core.BitmapIndexedNode(e, this__17865.bitmap, new_arr__17868)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__17869 = this;
  var inode__17870 = this;
  return cljs.core.inode_kv_reduce.call(null, this__17869.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17871 = this;
  var inode__17872 = this;
  var bit__17873 = 1 << (hash >>> shift & 31);
  if((this__17871.bitmap & bit__17873) === 0) {
    return not_found
  }else {
    var idx__17874 = cljs.core.bitmap_indexed_node_index.call(null, this__17871.bitmap, bit__17873);
    var key_or_nil__17875 = this__17871.arr[2 * idx__17874];
    var val_or_node__17876 = this__17871.arr[2 * idx__17874 + 1];
    if(key_or_nil__17875 == null) {
      return val_or_node__17876.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17875)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__17875, val_or_node__17876], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__17877 = this;
  var inode__17878 = this;
  var bit__17879 = 1 << (hash >>> shift & 31);
  if((this__17877.bitmap & bit__17879) === 0) {
    return inode__17878
  }else {
    var idx__17880 = cljs.core.bitmap_indexed_node_index.call(null, this__17877.bitmap, bit__17879);
    var key_or_nil__17881 = this__17877.arr[2 * idx__17880];
    var val_or_node__17882 = this__17877.arr[2 * idx__17880 + 1];
    if(key_or_nil__17881 == null) {
      var n__17883 = val_or_node__17882.inode_without(shift + 5, hash, key);
      if(n__17883 === val_or_node__17882) {
        return inode__17878
      }else {
        if(!(n__17883 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__17877.bitmap, cljs.core.clone_and_set.call(null, this__17877.arr, 2 * idx__17880 + 1, n__17883))
        }else {
          if(this__17877.bitmap === bit__17879) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__17877.bitmap ^ bit__17879, cljs.core.remove_pair.call(null, this__17877.arr, idx__17880))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17881)) {
        return new cljs.core.BitmapIndexedNode(null, this__17877.bitmap ^ bit__17879, cljs.core.remove_pair.call(null, this__17877.arr, idx__17880))
      }else {
        if("\ufdd0'else") {
          return inode__17878
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__17884 = this;
  var inode__17885 = this;
  var bit__17886 = 1 << (hash >>> shift & 31);
  var idx__17887 = cljs.core.bitmap_indexed_node_index.call(null, this__17884.bitmap, bit__17886);
  if((this__17884.bitmap & bit__17886) === 0) {
    var n__17888 = cljs.core.bit_count.call(null, this__17884.bitmap);
    if(n__17888 >= 16) {
      var nodes__17889 = cljs.core.make_array.call(null, 32);
      var jdx__17890 = hash >>> shift & 31;
      nodes__17889[jdx__17890] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__17891 = 0;
      var j__17892 = 0;
      while(true) {
        if(i__17891 < 32) {
          if((this__17884.bitmap >>> i__17891 & 1) === 0) {
            var G__17907 = i__17891 + 1;
            var G__17908 = j__17892;
            i__17891 = G__17907;
            j__17892 = G__17908;
            continue
          }else {
            nodes__17889[i__17891] = !(this__17884.arr[j__17892] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__17884.arr[j__17892]), this__17884.arr[j__17892], this__17884.arr[j__17892 + 1], added_leaf_QMARK_) : this__17884.arr[j__17892 + 1];
            var G__17909 = i__17891 + 1;
            var G__17910 = j__17892 + 2;
            i__17891 = G__17909;
            j__17892 = G__17910;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__17888 + 1, nodes__17889)
    }else {
      var new_arr__17893 = cljs.core.make_array.call(null, 2 * (n__17888 + 1));
      cljs.core.array_copy.call(null, this__17884.arr, 0, new_arr__17893, 0, 2 * idx__17887);
      new_arr__17893[2 * idx__17887] = key;
      new_arr__17893[2 * idx__17887 + 1] = val;
      cljs.core.array_copy.call(null, this__17884.arr, 2 * idx__17887, new_arr__17893, 2 * (idx__17887 + 1), 2 * (n__17888 - idx__17887));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__17884.bitmap | bit__17886, new_arr__17893)
    }
  }else {
    var key_or_nil__17894 = this__17884.arr[2 * idx__17887];
    var val_or_node__17895 = this__17884.arr[2 * idx__17887 + 1];
    if(key_or_nil__17894 == null) {
      var n__17896 = val_or_node__17895.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__17896 === val_or_node__17895) {
        return inode__17885
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__17884.bitmap, cljs.core.clone_and_set.call(null, this__17884.arr, 2 * idx__17887 + 1, n__17896))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17894)) {
        if(val === val_or_node__17895) {
          return inode__17885
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__17884.bitmap, cljs.core.clone_and_set.call(null, this__17884.arr, 2 * idx__17887 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__17884.bitmap, cljs.core.clone_and_set.call(null, this__17884.arr, 2 * idx__17887, null, 2 * idx__17887 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__17894, val_or_node__17895, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__17897 = this;
  var inode__17898 = this;
  var bit__17899 = 1 << (hash >>> shift & 31);
  if((this__17897.bitmap & bit__17899) === 0) {
    return not_found
  }else {
    var idx__17900 = cljs.core.bitmap_indexed_node_index.call(null, this__17897.bitmap, bit__17899);
    var key_or_nil__17901 = this__17897.arr[2 * idx__17900];
    var val_or_node__17902 = this__17897.arr[2 * idx__17900 + 1];
    if(key_or_nil__17901 == null) {
      return val_or_node__17902.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17901)) {
        return val_or_node__17902
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__17918 = array_node.arr;
  var len__17919 = 2 * (array_node.cnt - 1);
  var new_arr__17920 = cljs.core.make_array.call(null, len__17919);
  var i__17921 = 0;
  var j__17922 = 1;
  var bitmap__17923 = 0;
  while(true) {
    if(i__17921 < len__17919) {
      if(function() {
        var and__3822__auto____17924 = !(i__17921 === idx);
        if(and__3822__auto____17924) {
          return!(arr__17918[i__17921] == null)
        }else {
          return and__3822__auto____17924
        }
      }()) {
        new_arr__17920[j__17922] = arr__17918[i__17921];
        var G__17925 = i__17921 + 1;
        var G__17926 = j__17922 + 2;
        var G__17927 = bitmap__17923 | 1 << i__17921;
        i__17921 = G__17925;
        j__17922 = G__17926;
        bitmap__17923 = G__17927;
        continue
      }else {
        var G__17928 = i__17921 + 1;
        var G__17929 = j__17922;
        var G__17930 = bitmap__17923;
        i__17921 = G__17928;
        j__17922 = G__17929;
        bitmap__17923 = G__17930;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__17923, new_arr__17920)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__17931 = this;
  var inode__17932 = this;
  var idx__17933 = hash >>> shift & 31;
  var node__17934 = this__17931.arr[idx__17933];
  if(node__17934 == null) {
    var editable__17935 = cljs.core.edit_and_set.call(null, inode__17932, edit, idx__17933, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__17935.cnt = editable__17935.cnt + 1;
    return editable__17935
  }else {
    var n__17936 = node__17934.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__17936 === node__17934) {
      return inode__17932
    }else {
      return cljs.core.edit_and_set.call(null, inode__17932, edit, idx__17933, n__17936)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__17937 = this;
  var inode__17938 = this;
  return cljs.core.create_array_node_seq.call(null, this__17937.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17939 = this;
  var inode__17940 = this;
  var idx__17941 = hash >>> shift & 31;
  var node__17942 = this__17939.arr[idx__17941];
  if(node__17942 == null) {
    return inode__17940
  }else {
    var n__17943 = node__17942.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__17943 === node__17942) {
      return inode__17940
    }else {
      if(n__17943 == null) {
        if(this__17939.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__17940, edit, idx__17941)
        }else {
          var editable__17944 = cljs.core.edit_and_set.call(null, inode__17940, edit, idx__17941, n__17943);
          editable__17944.cnt = editable__17944.cnt - 1;
          return editable__17944
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__17940, edit, idx__17941, n__17943)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__17945 = this;
  var inode__17946 = this;
  if(e === this__17945.edit) {
    return inode__17946
  }else {
    return new cljs.core.ArrayNode(e, this__17945.cnt, this__17945.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__17947 = this;
  var inode__17948 = this;
  var len__17949 = this__17947.arr.length;
  var i__17950 = 0;
  var init__17951 = init;
  while(true) {
    if(i__17950 < len__17949) {
      var node__17952 = this__17947.arr[i__17950];
      if(!(node__17952 == null)) {
        var init__17953 = node__17952.kv_reduce(f, init__17951);
        if(cljs.core.reduced_QMARK_.call(null, init__17953)) {
          return cljs.core.deref.call(null, init__17953)
        }else {
          var G__17972 = i__17950 + 1;
          var G__17973 = init__17953;
          i__17950 = G__17972;
          init__17951 = G__17973;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__17951
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17954 = this;
  var inode__17955 = this;
  var idx__17956 = hash >>> shift & 31;
  var node__17957 = this__17954.arr[idx__17956];
  if(!(node__17957 == null)) {
    return node__17957.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__17958 = this;
  var inode__17959 = this;
  var idx__17960 = hash >>> shift & 31;
  var node__17961 = this__17958.arr[idx__17960];
  if(!(node__17961 == null)) {
    var n__17962 = node__17961.inode_without(shift + 5, hash, key);
    if(n__17962 === node__17961) {
      return inode__17959
    }else {
      if(n__17962 == null) {
        if(this__17958.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__17959, null, idx__17960)
        }else {
          return new cljs.core.ArrayNode(null, this__17958.cnt - 1, cljs.core.clone_and_set.call(null, this__17958.arr, idx__17960, n__17962))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__17958.cnt, cljs.core.clone_and_set.call(null, this__17958.arr, idx__17960, n__17962))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__17959
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__17963 = this;
  var inode__17964 = this;
  var idx__17965 = hash >>> shift & 31;
  var node__17966 = this__17963.arr[idx__17965];
  if(node__17966 == null) {
    return new cljs.core.ArrayNode(null, this__17963.cnt + 1, cljs.core.clone_and_set.call(null, this__17963.arr, idx__17965, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__17967 = node__17966.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__17967 === node__17966) {
      return inode__17964
    }else {
      return new cljs.core.ArrayNode(null, this__17963.cnt, cljs.core.clone_and_set.call(null, this__17963.arr, idx__17965, n__17967))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__17968 = this;
  var inode__17969 = this;
  var idx__17970 = hash >>> shift & 31;
  var node__17971 = this__17968.arr[idx__17970];
  if(!(node__17971 == null)) {
    return node__17971.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__17976 = 2 * cnt;
  var i__17977 = 0;
  while(true) {
    if(i__17977 < lim__17976) {
      if(cljs.core.key_test.call(null, key, arr[i__17977])) {
        return i__17977
      }else {
        var G__17978 = i__17977 + 2;
        i__17977 = G__17978;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__17979 = this;
  var inode__17980 = this;
  if(hash === this__17979.collision_hash) {
    var idx__17981 = cljs.core.hash_collision_node_find_index.call(null, this__17979.arr, this__17979.cnt, key);
    if(idx__17981 === -1) {
      if(this__17979.arr.length > 2 * this__17979.cnt) {
        var editable__17982 = cljs.core.edit_and_set.call(null, inode__17980, edit, 2 * this__17979.cnt, key, 2 * this__17979.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__17982.cnt = editable__17982.cnt + 1;
        return editable__17982
      }else {
        var len__17983 = this__17979.arr.length;
        var new_arr__17984 = cljs.core.make_array.call(null, len__17983 + 2);
        cljs.core.array_copy.call(null, this__17979.arr, 0, new_arr__17984, 0, len__17983);
        new_arr__17984[len__17983] = key;
        new_arr__17984[len__17983 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__17980.ensure_editable_array(edit, this__17979.cnt + 1, new_arr__17984)
      }
    }else {
      if(this__17979.arr[idx__17981 + 1] === val) {
        return inode__17980
      }else {
        return cljs.core.edit_and_set.call(null, inode__17980, edit, idx__17981 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__17979.collision_hash >>> shift & 31), [null, inode__17980, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__17985 = this;
  var inode__17986 = this;
  return cljs.core.create_inode_seq.call(null, this__17985.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17987 = this;
  var inode__17988 = this;
  var idx__17989 = cljs.core.hash_collision_node_find_index.call(null, this__17987.arr, this__17987.cnt, key);
  if(idx__17989 === -1) {
    return inode__17988
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__17987.cnt === 1) {
      return null
    }else {
      var editable__17990 = inode__17988.ensure_editable(edit);
      var earr__17991 = editable__17990.arr;
      earr__17991[idx__17989] = earr__17991[2 * this__17987.cnt - 2];
      earr__17991[idx__17989 + 1] = earr__17991[2 * this__17987.cnt - 1];
      earr__17991[2 * this__17987.cnt - 1] = null;
      earr__17991[2 * this__17987.cnt - 2] = null;
      editable__17990.cnt = editable__17990.cnt - 1;
      return editable__17990
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__17992 = this;
  var inode__17993 = this;
  if(e === this__17992.edit) {
    return inode__17993
  }else {
    var new_arr__17994 = cljs.core.make_array.call(null, 2 * (this__17992.cnt + 1));
    cljs.core.array_copy.call(null, this__17992.arr, 0, new_arr__17994, 0, 2 * this__17992.cnt);
    return new cljs.core.HashCollisionNode(e, this__17992.collision_hash, this__17992.cnt, new_arr__17994)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__17995 = this;
  var inode__17996 = this;
  return cljs.core.inode_kv_reduce.call(null, this__17995.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17997 = this;
  var inode__17998 = this;
  var idx__17999 = cljs.core.hash_collision_node_find_index.call(null, this__17997.arr, this__17997.cnt, key);
  if(idx__17999 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__17997.arr[idx__17999])) {
      return cljs.core.PersistentVector.fromArray([this__17997.arr[idx__17999], this__17997.arr[idx__17999 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__18000 = this;
  var inode__18001 = this;
  var idx__18002 = cljs.core.hash_collision_node_find_index.call(null, this__18000.arr, this__18000.cnt, key);
  if(idx__18002 === -1) {
    return inode__18001
  }else {
    if(this__18000.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__18000.collision_hash, this__18000.cnt - 1, cljs.core.remove_pair.call(null, this__18000.arr, cljs.core.quot.call(null, idx__18002, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__18003 = this;
  var inode__18004 = this;
  if(hash === this__18003.collision_hash) {
    var idx__18005 = cljs.core.hash_collision_node_find_index.call(null, this__18003.arr, this__18003.cnt, key);
    if(idx__18005 === -1) {
      var len__18006 = this__18003.arr.length;
      var new_arr__18007 = cljs.core.make_array.call(null, len__18006 + 2);
      cljs.core.array_copy.call(null, this__18003.arr, 0, new_arr__18007, 0, len__18006);
      new_arr__18007[len__18006] = key;
      new_arr__18007[len__18006 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__18003.collision_hash, this__18003.cnt + 1, new_arr__18007)
    }else {
      if(cljs.core._EQ_.call(null, this__18003.arr[idx__18005], val)) {
        return inode__18004
      }else {
        return new cljs.core.HashCollisionNode(null, this__18003.collision_hash, this__18003.cnt, cljs.core.clone_and_set.call(null, this__18003.arr, idx__18005 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__18003.collision_hash >>> shift & 31), [null, inode__18004])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__18008 = this;
  var inode__18009 = this;
  var idx__18010 = cljs.core.hash_collision_node_find_index.call(null, this__18008.arr, this__18008.cnt, key);
  if(idx__18010 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__18008.arr[idx__18010])) {
      return this__18008.arr[idx__18010 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__18011 = this;
  var inode__18012 = this;
  if(e === this__18011.edit) {
    this__18011.arr = array;
    this__18011.cnt = count;
    return inode__18012
  }else {
    return new cljs.core.HashCollisionNode(this__18011.edit, this__18011.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__18017 = cljs.core.hash.call(null, key1);
    if(key1hash__18017 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__18017, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___18018 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__18017, key1, val1, added_leaf_QMARK___18018).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___18018)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__18019 = cljs.core.hash.call(null, key1);
    if(key1hash__18019 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__18019, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___18020 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__18019, key1, val1, added_leaf_QMARK___18020).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___18020)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__18021 = this;
  var h__2192__auto____18022 = this__18021.__hash;
  if(!(h__2192__auto____18022 == null)) {
    return h__2192__auto____18022
  }else {
    var h__2192__auto____18023 = cljs.core.hash_coll.call(null, coll);
    this__18021.__hash = h__2192__auto____18023;
    return h__2192__auto____18023
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18024 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__18025 = this;
  var this__18026 = this;
  return cljs.core.pr_str.call(null, this__18026)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__18027 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__18028 = this;
  if(this__18028.s == null) {
    return cljs.core.PersistentVector.fromArray([this__18028.nodes[this__18028.i], this__18028.nodes[this__18028.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__18028.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__18029 = this;
  if(this__18029.s == null) {
    return cljs.core.create_inode_seq.call(null, this__18029.nodes, this__18029.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__18029.nodes, this__18029.i, cljs.core.next.call(null, this__18029.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18030 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18031 = this;
  return new cljs.core.NodeSeq(meta, this__18031.nodes, this__18031.i, this__18031.s, this__18031.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18032 = this;
  return this__18032.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18033 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__18033.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__18040 = nodes.length;
      var j__18041 = i;
      while(true) {
        if(j__18041 < len__18040) {
          if(!(nodes[j__18041] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__18041, null, null)
          }else {
            var temp__3971__auto____18042 = nodes[j__18041 + 1];
            if(cljs.core.truth_(temp__3971__auto____18042)) {
              var node__18043 = temp__3971__auto____18042;
              var temp__3971__auto____18044 = node__18043.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____18044)) {
                var node_seq__18045 = temp__3971__auto____18044;
                return new cljs.core.NodeSeq(null, nodes, j__18041 + 2, node_seq__18045, null)
              }else {
                var G__18046 = j__18041 + 2;
                j__18041 = G__18046;
                continue
              }
            }else {
              var G__18047 = j__18041 + 2;
              j__18041 = G__18047;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__18048 = this;
  var h__2192__auto____18049 = this__18048.__hash;
  if(!(h__2192__auto____18049 == null)) {
    return h__2192__auto____18049
  }else {
    var h__2192__auto____18050 = cljs.core.hash_coll.call(null, coll);
    this__18048.__hash = h__2192__auto____18050;
    return h__2192__auto____18050
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18051 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__18052 = this;
  var this__18053 = this;
  return cljs.core.pr_str.call(null, this__18053)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__18054 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__18055 = this;
  return cljs.core.first.call(null, this__18055.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__18056 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__18056.nodes, this__18056.i, cljs.core.next.call(null, this__18056.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18057 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18058 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__18058.nodes, this__18058.i, this__18058.s, this__18058.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18059 = this;
  return this__18059.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18060 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__18060.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__18067 = nodes.length;
      var j__18068 = i;
      while(true) {
        if(j__18068 < len__18067) {
          var temp__3971__auto____18069 = nodes[j__18068];
          if(cljs.core.truth_(temp__3971__auto____18069)) {
            var nj__18070 = temp__3971__auto____18069;
            var temp__3971__auto____18071 = nj__18070.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____18071)) {
              var ns__18072 = temp__3971__auto____18071;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__18068 + 1, ns__18072, null)
            }else {
              var G__18073 = j__18068 + 1;
              j__18068 = G__18073;
              continue
            }
          }else {
            var G__18074 = j__18068 + 1;
            j__18068 = G__18074;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__18077 = this;
  return new cljs.core.TransientHashMap({}, this__18077.root, this__18077.cnt, this__18077.has_nil_QMARK_, this__18077.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__18078 = this;
  var h__2192__auto____18079 = this__18078.__hash;
  if(!(h__2192__auto____18079 == null)) {
    return h__2192__auto____18079
  }else {
    var h__2192__auto____18080 = cljs.core.hash_imap.call(null, coll);
    this__18078.__hash = h__2192__auto____18080;
    return h__2192__auto____18080
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__18081 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__18082 = this;
  if(k == null) {
    if(this__18082.has_nil_QMARK_) {
      return this__18082.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__18082.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__18082.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__18083 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____18084 = this__18083.has_nil_QMARK_;
      if(and__3822__auto____18084) {
        return v === this__18083.nil_val
      }else {
        return and__3822__auto____18084
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__18083.meta, this__18083.has_nil_QMARK_ ? this__18083.cnt : this__18083.cnt + 1, this__18083.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___18085 = new cljs.core.Box(false);
    var new_root__18086 = (this__18083.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__18083.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___18085);
    if(new_root__18086 === this__18083.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__18083.meta, added_leaf_QMARK___18085.val ? this__18083.cnt + 1 : this__18083.cnt, new_root__18086, this__18083.has_nil_QMARK_, this__18083.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__18087 = this;
  if(k == null) {
    return this__18087.has_nil_QMARK_
  }else {
    if(this__18087.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__18087.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__18110 = null;
  var G__18110__2 = function(this_sym18088, k) {
    var this__18090 = this;
    var this_sym18088__18091 = this;
    var coll__18092 = this_sym18088__18091;
    return coll__18092.cljs$core$ILookup$_lookup$arity$2(coll__18092, k)
  };
  var G__18110__3 = function(this_sym18089, k, not_found) {
    var this__18090 = this;
    var this_sym18089__18093 = this;
    var coll__18094 = this_sym18089__18093;
    return coll__18094.cljs$core$ILookup$_lookup$arity$3(coll__18094, k, not_found)
  };
  G__18110 = function(this_sym18089, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18110__2.call(this, this_sym18089, k);
      case 3:
        return G__18110__3.call(this, this_sym18089, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18110
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym18075, args18076) {
  var this__18095 = this;
  return this_sym18075.call.apply(this_sym18075, [this_sym18075].concat(args18076.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__18096 = this;
  var init__18097 = this__18096.has_nil_QMARK_ ? f.call(null, init, null, this__18096.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__18097)) {
    return cljs.core.deref.call(null, init__18097)
  }else {
    if(!(this__18096.root == null)) {
      return this__18096.root.kv_reduce(f, init__18097)
    }else {
      if("\ufdd0'else") {
        return init__18097
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__18098 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__18099 = this;
  var this__18100 = this;
  return cljs.core.pr_str.call(null, this__18100)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__18101 = this;
  if(this__18101.cnt > 0) {
    var s__18102 = !(this__18101.root == null) ? this__18101.root.inode_seq() : null;
    if(this__18101.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__18101.nil_val], true), s__18102)
    }else {
      return s__18102
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18103 = this;
  return this__18103.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18104 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18105 = this;
  return new cljs.core.PersistentHashMap(meta, this__18105.cnt, this__18105.root, this__18105.has_nil_QMARK_, this__18105.nil_val, this__18105.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18106 = this;
  return this__18106.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18107 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__18107.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__18108 = this;
  if(k == null) {
    if(this__18108.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__18108.meta, this__18108.cnt - 1, this__18108.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__18108.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__18109 = this__18108.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__18109 === this__18108.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__18108.meta, this__18108.cnt - 1, new_root__18109, this__18108.has_nil_QMARK_, this__18108.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__18111 = ks.length;
  var i__18112 = 0;
  var out__18113 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__18112 < len__18111) {
      var G__18114 = i__18112 + 1;
      var G__18115 = cljs.core.assoc_BANG_.call(null, out__18113, ks[i__18112], vs[i__18112]);
      i__18112 = G__18114;
      out__18113 = G__18115;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__18113)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__18116 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__18117 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__18118 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__18119 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__18120 = this;
  if(k == null) {
    if(this__18120.has_nil_QMARK_) {
      return this__18120.nil_val
    }else {
      return null
    }
  }else {
    if(this__18120.root == null) {
      return null
    }else {
      return this__18120.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__18121 = this;
  if(k == null) {
    if(this__18121.has_nil_QMARK_) {
      return this__18121.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__18121.root == null) {
      return not_found
    }else {
      return this__18121.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18122 = this;
  if(this__18122.edit) {
    return this__18122.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__18123 = this;
  var tcoll__18124 = this;
  if(this__18123.edit) {
    if(function() {
      var G__18125__18126 = o;
      if(G__18125__18126) {
        if(function() {
          var or__3824__auto____18127 = G__18125__18126.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____18127) {
            return or__3824__auto____18127
          }else {
            return G__18125__18126.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__18125__18126.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__18125__18126)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__18125__18126)
      }
    }()) {
      return tcoll__18124.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__18128 = cljs.core.seq.call(null, o);
      var tcoll__18129 = tcoll__18124;
      while(true) {
        var temp__3971__auto____18130 = cljs.core.first.call(null, es__18128);
        if(cljs.core.truth_(temp__3971__auto____18130)) {
          var e__18131 = temp__3971__auto____18130;
          var G__18142 = cljs.core.next.call(null, es__18128);
          var G__18143 = tcoll__18129.assoc_BANG_(cljs.core.key.call(null, e__18131), cljs.core.val.call(null, e__18131));
          es__18128 = G__18142;
          tcoll__18129 = G__18143;
          continue
        }else {
          return tcoll__18129
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__18132 = this;
  var tcoll__18133 = this;
  if(this__18132.edit) {
    if(k == null) {
      if(this__18132.nil_val === v) {
      }else {
        this__18132.nil_val = v
      }
      if(this__18132.has_nil_QMARK_) {
      }else {
        this__18132.count = this__18132.count + 1;
        this__18132.has_nil_QMARK_ = true
      }
      return tcoll__18133
    }else {
      var added_leaf_QMARK___18134 = new cljs.core.Box(false);
      var node__18135 = (this__18132.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__18132.root).inode_assoc_BANG_(this__18132.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___18134);
      if(node__18135 === this__18132.root) {
      }else {
        this__18132.root = node__18135
      }
      if(added_leaf_QMARK___18134.val) {
        this__18132.count = this__18132.count + 1
      }else {
      }
      return tcoll__18133
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__18136 = this;
  var tcoll__18137 = this;
  if(this__18136.edit) {
    if(k == null) {
      if(this__18136.has_nil_QMARK_) {
        this__18136.has_nil_QMARK_ = false;
        this__18136.nil_val = null;
        this__18136.count = this__18136.count - 1;
        return tcoll__18137
      }else {
        return tcoll__18137
      }
    }else {
      if(this__18136.root == null) {
        return tcoll__18137
      }else {
        var removed_leaf_QMARK___18138 = new cljs.core.Box(false);
        var node__18139 = this__18136.root.inode_without_BANG_(this__18136.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___18138);
        if(node__18139 === this__18136.root) {
        }else {
          this__18136.root = node__18139
        }
        if(cljs.core.truth_(removed_leaf_QMARK___18138[0])) {
          this__18136.count = this__18136.count - 1
        }else {
        }
        return tcoll__18137
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__18140 = this;
  var tcoll__18141 = this;
  if(this__18140.edit) {
    this__18140.edit = null;
    return new cljs.core.PersistentHashMap(null, this__18140.count, this__18140.root, this__18140.has_nil_QMARK_, this__18140.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__18146 = node;
  var stack__18147 = stack;
  while(true) {
    if(!(t__18146 == null)) {
      var G__18148 = ascending_QMARK_ ? t__18146.left : t__18146.right;
      var G__18149 = cljs.core.conj.call(null, stack__18147, t__18146);
      t__18146 = G__18148;
      stack__18147 = G__18149;
      continue
    }else {
      return stack__18147
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__18150 = this;
  var h__2192__auto____18151 = this__18150.__hash;
  if(!(h__2192__auto____18151 == null)) {
    return h__2192__auto____18151
  }else {
    var h__2192__auto____18152 = cljs.core.hash_coll.call(null, coll);
    this__18150.__hash = h__2192__auto____18152;
    return h__2192__auto____18152
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18153 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__18154 = this;
  var this__18155 = this;
  return cljs.core.pr_str.call(null, this__18155)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__18156 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18157 = this;
  if(this__18157.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__18157.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__18158 = this;
  return cljs.core.peek.call(null, this__18158.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__18159 = this;
  var t__18160 = cljs.core.first.call(null, this__18159.stack);
  var next_stack__18161 = cljs.core.tree_map_seq_push.call(null, this__18159.ascending_QMARK_ ? t__18160.right : t__18160.left, cljs.core.next.call(null, this__18159.stack), this__18159.ascending_QMARK_);
  if(!(next_stack__18161 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__18161, this__18159.ascending_QMARK_, this__18159.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18162 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18163 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__18163.stack, this__18163.ascending_QMARK_, this__18163.cnt, this__18163.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18164 = this;
  return this__18164.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____18166 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____18166) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____18166
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____18168 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____18168) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____18168
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__18172 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__18172)) {
    return cljs.core.deref.call(null, init__18172)
  }else {
    var init__18173 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__18172) : init__18172;
    if(cljs.core.reduced_QMARK_.call(null, init__18173)) {
      return cljs.core.deref.call(null, init__18173)
    }else {
      var init__18174 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__18173) : init__18173;
      if(cljs.core.reduced_QMARK_.call(null, init__18174)) {
        return cljs.core.deref.call(null, init__18174)
      }else {
        return init__18174
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__18177 = this;
  var h__2192__auto____18178 = this__18177.__hash;
  if(!(h__2192__auto____18178 == null)) {
    return h__2192__auto____18178
  }else {
    var h__2192__auto____18179 = cljs.core.hash_coll.call(null, coll);
    this__18177.__hash = h__2192__auto____18179;
    return h__2192__auto____18179
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__18180 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__18181 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__18182 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__18182.key, this__18182.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__18230 = null;
  var G__18230__2 = function(this_sym18183, k) {
    var this__18185 = this;
    var this_sym18183__18186 = this;
    var node__18187 = this_sym18183__18186;
    return node__18187.cljs$core$ILookup$_lookup$arity$2(node__18187, k)
  };
  var G__18230__3 = function(this_sym18184, k, not_found) {
    var this__18185 = this;
    var this_sym18184__18188 = this;
    var node__18189 = this_sym18184__18188;
    return node__18189.cljs$core$ILookup$_lookup$arity$3(node__18189, k, not_found)
  };
  G__18230 = function(this_sym18184, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18230__2.call(this, this_sym18184, k);
      case 3:
        return G__18230__3.call(this, this_sym18184, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18230
}();
cljs.core.BlackNode.prototype.apply = function(this_sym18175, args18176) {
  var this__18190 = this;
  return this_sym18175.call.apply(this_sym18175, [this_sym18175].concat(args18176.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__18191 = this;
  return cljs.core.PersistentVector.fromArray([this__18191.key, this__18191.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__18192 = this;
  return this__18192.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__18193 = this;
  return this__18193.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__18194 = this;
  var node__18195 = this;
  return ins.balance_right(node__18195)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__18196 = this;
  var node__18197 = this;
  return new cljs.core.RedNode(this__18196.key, this__18196.val, this__18196.left, this__18196.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__18198 = this;
  var node__18199 = this;
  return cljs.core.balance_right_del.call(null, this__18198.key, this__18198.val, this__18198.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__18200 = this;
  var node__18201 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__18202 = this;
  var node__18203 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__18203, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__18204 = this;
  var node__18205 = this;
  return cljs.core.balance_left_del.call(null, this__18204.key, this__18204.val, del, this__18204.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__18206 = this;
  var node__18207 = this;
  return ins.balance_left(node__18207)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__18208 = this;
  var node__18209 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__18209, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__18231 = null;
  var G__18231__0 = function() {
    var this__18210 = this;
    var this__18212 = this;
    return cljs.core.pr_str.call(null, this__18212)
  };
  G__18231 = function() {
    switch(arguments.length) {
      case 0:
        return G__18231__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18231
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__18213 = this;
  var node__18214 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__18214, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__18215 = this;
  var node__18216 = this;
  return node__18216
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__18217 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__18218 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__18219 = this;
  return cljs.core.list.call(null, this__18219.key, this__18219.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__18220 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__18221 = this;
  return this__18221.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__18222 = this;
  return cljs.core.PersistentVector.fromArray([this__18222.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__18223 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__18223.key, this__18223.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18224 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__18225 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__18225.key, this__18225.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__18226 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__18227 = this;
  if(n === 0) {
    return this__18227.key
  }else {
    if(n === 1) {
      return this__18227.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__18228 = this;
  if(n === 0) {
    return this__18228.key
  }else {
    if(n === 1) {
      return this__18228.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__18229 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__18234 = this;
  var h__2192__auto____18235 = this__18234.__hash;
  if(!(h__2192__auto____18235 == null)) {
    return h__2192__auto____18235
  }else {
    var h__2192__auto____18236 = cljs.core.hash_coll.call(null, coll);
    this__18234.__hash = h__2192__auto____18236;
    return h__2192__auto____18236
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__18237 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__18238 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__18239 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__18239.key, this__18239.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__18287 = null;
  var G__18287__2 = function(this_sym18240, k) {
    var this__18242 = this;
    var this_sym18240__18243 = this;
    var node__18244 = this_sym18240__18243;
    return node__18244.cljs$core$ILookup$_lookup$arity$2(node__18244, k)
  };
  var G__18287__3 = function(this_sym18241, k, not_found) {
    var this__18242 = this;
    var this_sym18241__18245 = this;
    var node__18246 = this_sym18241__18245;
    return node__18246.cljs$core$ILookup$_lookup$arity$3(node__18246, k, not_found)
  };
  G__18287 = function(this_sym18241, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18287__2.call(this, this_sym18241, k);
      case 3:
        return G__18287__3.call(this, this_sym18241, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18287
}();
cljs.core.RedNode.prototype.apply = function(this_sym18232, args18233) {
  var this__18247 = this;
  return this_sym18232.call.apply(this_sym18232, [this_sym18232].concat(args18233.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__18248 = this;
  return cljs.core.PersistentVector.fromArray([this__18248.key, this__18248.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__18249 = this;
  return this__18249.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__18250 = this;
  return this__18250.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__18251 = this;
  var node__18252 = this;
  return new cljs.core.RedNode(this__18251.key, this__18251.val, this__18251.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__18253 = this;
  var node__18254 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__18255 = this;
  var node__18256 = this;
  return new cljs.core.RedNode(this__18255.key, this__18255.val, this__18255.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__18257 = this;
  var node__18258 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__18259 = this;
  var node__18260 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__18260, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__18261 = this;
  var node__18262 = this;
  return new cljs.core.RedNode(this__18261.key, this__18261.val, del, this__18261.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__18263 = this;
  var node__18264 = this;
  return new cljs.core.RedNode(this__18263.key, this__18263.val, ins, this__18263.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__18265 = this;
  var node__18266 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__18265.left)) {
    return new cljs.core.RedNode(this__18265.key, this__18265.val, this__18265.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__18265.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__18265.right)) {
      return new cljs.core.RedNode(this__18265.right.key, this__18265.right.val, new cljs.core.BlackNode(this__18265.key, this__18265.val, this__18265.left, this__18265.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__18265.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__18266, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__18288 = null;
  var G__18288__0 = function() {
    var this__18267 = this;
    var this__18269 = this;
    return cljs.core.pr_str.call(null, this__18269)
  };
  G__18288 = function() {
    switch(arguments.length) {
      case 0:
        return G__18288__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18288
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__18270 = this;
  var node__18271 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__18270.right)) {
    return new cljs.core.RedNode(this__18270.key, this__18270.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__18270.left, null), this__18270.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__18270.left)) {
      return new cljs.core.RedNode(this__18270.left.key, this__18270.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__18270.left.left, null), new cljs.core.BlackNode(this__18270.key, this__18270.val, this__18270.left.right, this__18270.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__18271, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__18272 = this;
  var node__18273 = this;
  return new cljs.core.BlackNode(this__18272.key, this__18272.val, this__18272.left, this__18272.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__18274 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__18275 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__18276 = this;
  return cljs.core.list.call(null, this__18276.key, this__18276.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__18277 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__18278 = this;
  return this__18278.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__18279 = this;
  return cljs.core.PersistentVector.fromArray([this__18279.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__18280 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__18280.key, this__18280.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18281 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__18282 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__18282.key, this__18282.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__18283 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__18284 = this;
  if(n === 0) {
    return this__18284.key
  }else {
    if(n === 1) {
      return this__18284.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__18285 = this;
  if(n === 0) {
    return this__18285.key
  }else {
    if(n === 1) {
      return this__18285.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__18286 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__18292 = comp.call(null, k, tree.key);
    if(c__18292 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__18292 < 0) {
        var ins__18293 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__18293 == null)) {
          return tree.add_left(ins__18293)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__18294 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__18294 == null)) {
            return tree.add_right(ins__18294)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__18297 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__18297)) {
            return new cljs.core.RedNode(app__18297.key, app__18297.val, new cljs.core.RedNode(left.key, left.val, left.left, app__18297.left, null), new cljs.core.RedNode(right.key, right.val, app__18297.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__18297, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__18298 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__18298)) {
              return new cljs.core.RedNode(app__18298.key, app__18298.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__18298.left, null), new cljs.core.BlackNode(right.key, right.val, app__18298.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__18298, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__18304 = comp.call(null, k, tree.key);
    if(c__18304 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__18304 < 0) {
        var del__18305 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____18306 = !(del__18305 == null);
          if(or__3824__auto____18306) {
            return or__3824__auto____18306
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__18305, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__18305, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__18307 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____18308 = !(del__18307 == null);
            if(or__3824__auto____18308) {
              return or__3824__auto____18308
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__18307)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__18307, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__18311 = tree.key;
  var c__18312 = comp.call(null, k, tk__18311);
  if(c__18312 === 0) {
    return tree.replace(tk__18311, v, tree.left, tree.right)
  }else {
    if(c__18312 < 0) {
      return tree.replace(tk__18311, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__18311, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__18315 = this;
  var h__2192__auto____18316 = this__18315.__hash;
  if(!(h__2192__auto____18316 == null)) {
    return h__2192__auto____18316
  }else {
    var h__2192__auto____18317 = cljs.core.hash_imap.call(null, coll);
    this__18315.__hash = h__2192__auto____18317;
    return h__2192__auto____18317
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__18318 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__18319 = this;
  var n__18320 = coll.entry_at(k);
  if(!(n__18320 == null)) {
    return n__18320.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__18321 = this;
  var found__18322 = [null];
  var t__18323 = cljs.core.tree_map_add.call(null, this__18321.comp, this__18321.tree, k, v, found__18322);
  if(t__18323 == null) {
    var found_node__18324 = cljs.core.nth.call(null, found__18322, 0);
    if(cljs.core._EQ_.call(null, v, found_node__18324.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__18321.comp, cljs.core.tree_map_replace.call(null, this__18321.comp, this__18321.tree, k, v), this__18321.cnt, this__18321.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__18321.comp, t__18323.blacken(), this__18321.cnt + 1, this__18321.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__18325 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__18359 = null;
  var G__18359__2 = function(this_sym18326, k) {
    var this__18328 = this;
    var this_sym18326__18329 = this;
    var coll__18330 = this_sym18326__18329;
    return coll__18330.cljs$core$ILookup$_lookup$arity$2(coll__18330, k)
  };
  var G__18359__3 = function(this_sym18327, k, not_found) {
    var this__18328 = this;
    var this_sym18327__18331 = this;
    var coll__18332 = this_sym18327__18331;
    return coll__18332.cljs$core$ILookup$_lookup$arity$3(coll__18332, k, not_found)
  };
  G__18359 = function(this_sym18327, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18359__2.call(this, this_sym18327, k);
      case 3:
        return G__18359__3.call(this, this_sym18327, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18359
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym18313, args18314) {
  var this__18333 = this;
  return this_sym18313.call.apply(this_sym18313, [this_sym18313].concat(args18314.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__18334 = this;
  if(!(this__18334.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__18334.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__18335 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__18336 = this;
  if(this__18336.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__18336.tree, false, this__18336.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__18337 = this;
  var this__18338 = this;
  return cljs.core.pr_str.call(null, this__18338)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__18339 = this;
  var coll__18340 = this;
  var t__18341 = this__18339.tree;
  while(true) {
    if(!(t__18341 == null)) {
      var c__18342 = this__18339.comp.call(null, k, t__18341.key);
      if(c__18342 === 0) {
        return t__18341
      }else {
        if(c__18342 < 0) {
          var G__18360 = t__18341.left;
          t__18341 = G__18360;
          continue
        }else {
          if("\ufdd0'else") {
            var G__18361 = t__18341.right;
            t__18341 = G__18361;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__18343 = this;
  if(this__18343.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__18343.tree, ascending_QMARK_, this__18343.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__18344 = this;
  if(this__18344.cnt > 0) {
    var stack__18345 = null;
    var t__18346 = this__18344.tree;
    while(true) {
      if(!(t__18346 == null)) {
        var c__18347 = this__18344.comp.call(null, k, t__18346.key);
        if(c__18347 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__18345, t__18346), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__18347 < 0) {
              var G__18362 = cljs.core.conj.call(null, stack__18345, t__18346);
              var G__18363 = t__18346.left;
              stack__18345 = G__18362;
              t__18346 = G__18363;
              continue
            }else {
              var G__18364 = stack__18345;
              var G__18365 = t__18346.right;
              stack__18345 = G__18364;
              t__18346 = G__18365;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__18347 > 0) {
                var G__18366 = cljs.core.conj.call(null, stack__18345, t__18346);
                var G__18367 = t__18346.right;
                stack__18345 = G__18366;
                t__18346 = G__18367;
                continue
              }else {
                var G__18368 = stack__18345;
                var G__18369 = t__18346.left;
                stack__18345 = G__18368;
                t__18346 = G__18369;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__18345 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__18345, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__18348 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__18349 = this;
  return this__18349.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__18350 = this;
  if(this__18350.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__18350.tree, true, this__18350.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18351 = this;
  return this__18351.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18352 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18353 = this;
  return new cljs.core.PersistentTreeMap(this__18353.comp, this__18353.tree, this__18353.cnt, meta, this__18353.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18354 = this;
  return this__18354.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18355 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__18355.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__18356 = this;
  var found__18357 = [null];
  var t__18358 = cljs.core.tree_map_remove.call(null, this__18356.comp, this__18356.tree, k, found__18357);
  if(t__18358 == null) {
    if(cljs.core.nth.call(null, found__18357, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__18356.comp, null, 0, this__18356.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__18356.comp, t__18358.blacken(), this__18356.cnt - 1, this__18356.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__18372 = cljs.core.seq.call(null, keyvals);
    var out__18373 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__18372) {
        var G__18374 = cljs.core.nnext.call(null, in__18372);
        var G__18375 = cljs.core.assoc_BANG_.call(null, out__18373, cljs.core.first.call(null, in__18372), cljs.core.second.call(null, in__18372));
        in__18372 = G__18374;
        out__18373 = G__18375;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__18373)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__18376) {
    var keyvals = cljs.core.seq(arglist__18376);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__18377) {
    var keyvals = cljs.core.seq(arglist__18377);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__18381 = [];
    var obj__18382 = {};
    var kvs__18383 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__18383) {
        ks__18381.push(cljs.core.first.call(null, kvs__18383));
        obj__18382[cljs.core.first.call(null, kvs__18383)] = cljs.core.second.call(null, kvs__18383);
        var G__18384 = cljs.core.nnext.call(null, kvs__18383);
        kvs__18383 = G__18384;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__18381, obj__18382)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__18385) {
    var keyvals = cljs.core.seq(arglist__18385);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__18388 = cljs.core.seq.call(null, keyvals);
    var out__18389 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__18388) {
        var G__18390 = cljs.core.nnext.call(null, in__18388);
        var G__18391 = cljs.core.assoc.call(null, out__18389, cljs.core.first.call(null, in__18388), cljs.core.second.call(null, in__18388));
        in__18388 = G__18390;
        out__18389 = G__18391;
        continue
      }else {
        return out__18389
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__18392) {
    var keyvals = cljs.core.seq(arglist__18392);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__18395 = cljs.core.seq.call(null, keyvals);
    var out__18396 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__18395) {
        var G__18397 = cljs.core.nnext.call(null, in__18395);
        var G__18398 = cljs.core.assoc.call(null, out__18396, cljs.core.first.call(null, in__18395), cljs.core.second.call(null, in__18395));
        in__18395 = G__18397;
        out__18396 = G__18398;
        continue
      }else {
        return out__18396
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__18399) {
    var comparator = cljs.core.first(arglist__18399);
    var keyvals = cljs.core.rest(arglist__18399);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__18400_SHARP_, p2__18401_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____18403 = p1__18400_SHARP_;
          if(cljs.core.truth_(or__3824__auto____18403)) {
            return or__3824__auto____18403
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__18401_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__18404) {
    var maps = cljs.core.seq(arglist__18404);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__18412 = function(m, e) {
        var k__18410 = cljs.core.first.call(null, e);
        var v__18411 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__18410)) {
          return cljs.core.assoc.call(null, m, k__18410, f.call(null, cljs.core._lookup.call(null, m, k__18410, null), v__18411))
        }else {
          return cljs.core.assoc.call(null, m, k__18410, v__18411)
        }
      };
      var merge2__18414 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__18412, function() {
          var or__3824__auto____18413 = m1;
          if(cljs.core.truth_(or__3824__auto____18413)) {
            return or__3824__auto____18413
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__18414, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__18415) {
    var f = cljs.core.first(arglist__18415);
    var maps = cljs.core.rest(arglist__18415);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__18420 = cljs.core.ObjMap.EMPTY;
  var keys__18421 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__18421) {
      var key__18422 = cljs.core.first.call(null, keys__18421);
      var entry__18423 = cljs.core._lookup.call(null, map, key__18422, "\ufdd0'cljs.core/not-found");
      var G__18424 = cljs.core.not_EQ_.call(null, entry__18423, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__18420, key__18422, entry__18423) : ret__18420;
      var G__18425 = cljs.core.next.call(null, keys__18421);
      ret__18420 = G__18424;
      keys__18421 = G__18425;
      continue
    }else {
      return ret__18420
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__18429 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__18429.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__18430 = this;
  var h__2192__auto____18431 = this__18430.__hash;
  if(!(h__2192__auto____18431 == null)) {
    return h__2192__auto____18431
  }else {
    var h__2192__auto____18432 = cljs.core.hash_iset.call(null, coll);
    this__18430.__hash = h__2192__auto____18432;
    return h__2192__auto____18432
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__18433 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__18434 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__18434.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__18455 = null;
  var G__18455__2 = function(this_sym18435, k) {
    var this__18437 = this;
    var this_sym18435__18438 = this;
    var coll__18439 = this_sym18435__18438;
    return coll__18439.cljs$core$ILookup$_lookup$arity$2(coll__18439, k)
  };
  var G__18455__3 = function(this_sym18436, k, not_found) {
    var this__18437 = this;
    var this_sym18436__18440 = this;
    var coll__18441 = this_sym18436__18440;
    return coll__18441.cljs$core$ILookup$_lookup$arity$3(coll__18441, k, not_found)
  };
  G__18455 = function(this_sym18436, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18455__2.call(this, this_sym18436, k);
      case 3:
        return G__18455__3.call(this, this_sym18436, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18455
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym18427, args18428) {
  var this__18442 = this;
  return this_sym18427.call.apply(this_sym18427, [this_sym18427].concat(args18428.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18443 = this;
  return new cljs.core.PersistentHashSet(this__18443.meta, cljs.core.assoc.call(null, this__18443.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__18444 = this;
  var this__18445 = this;
  return cljs.core.pr_str.call(null, this__18445)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__18446 = this;
  return cljs.core.keys.call(null, this__18446.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__18447 = this;
  return new cljs.core.PersistentHashSet(this__18447.meta, cljs.core.dissoc.call(null, this__18447.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18448 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18449 = this;
  var and__3822__auto____18450 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____18450) {
    var and__3822__auto____18451 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____18451) {
      return cljs.core.every_QMARK_.call(null, function(p1__18426_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__18426_SHARP_)
      }, other)
    }else {
      return and__3822__auto____18451
    }
  }else {
    return and__3822__auto____18450
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18452 = this;
  return new cljs.core.PersistentHashSet(meta, this__18452.hash_map, this__18452.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18453 = this;
  return this__18453.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18454 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__18454.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__18456 = cljs.core.count.call(null, items);
  var i__18457 = 0;
  var out__18458 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__18457 < len__18456) {
      var G__18459 = i__18457 + 1;
      var G__18460 = cljs.core.conj_BANG_.call(null, out__18458, items[i__18457]);
      i__18457 = G__18459;
      out__18458 = G__18460;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__18458)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__18478 = null;
  var G__18478__2 = function(this_sym18464, k) {
    var this__18466 = this;
    var this_sym18464__18467 = this;
    var tcoll__18468 = this_sym18464__18467;
    if(cljs.core._lookup.call(null, this__18466.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__18478__3 = function(this_sym18465, k, not_found) {
    var this__18466 = this;
    var this_sym18465__18469 = this;
    var tcoll__18470 = this_sym18465__18469;
    if(cljs.core._lookup.call(null, this__18466.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__18478 = function(this_sym18465, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18478__2.call(this, this_sym18465, k);
      case 3:
        return G__18478__3.call(this, this_sym18465, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18478
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym18462, args18463) {
  var this__18471 = this;
  return this_sym18462.call.apply(this_sym18462, [this_sym18462].concat(args18463.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__18472 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__18473 = this;
  if(cljs.core._lookup.call(null, this__18473.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__18474 = this;
  return cljs.core.count.call(null, this__18474.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__18475 = this;
  this__18475.transient_map = cljs.core.dissoc_BANG_.call(null, this__18475.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__18476 = this;
  this__18476.transient_map = cljs.core.assoc_BANG_.call(null, this__18476.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__18477 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__18477.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__18481 = this;
  var h__2192__auto____18482 = this__18481.__hash;
  if(!(h__2192__auto____18482 == null)) {
    return h__2192__auto____18482
  }else {
    var h__2192__auto____18483 = cljs.core.hash_iset.call(null, coll);
    this__18481.__hash = h__2192__auto____18483;
    return h__2192__auto____18483
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__18484 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__18485 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__18485.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__18511 = null;
  var G__18511__2 = function(this_sym18486, k) {
    var this__18488 = this;
    var this_sym18486__18489 = this;
    var coll__18490 = this_sym18486__18489;
    return coll__18490.cljs$core$ILookup$_lookup$arity$2(coll__18490, k)
  };
  var G__18511__3 = function(this_sym18487, k, not_found) {
    var this__18488 = this;
    var this_sym18487__18491 = this;
    var coll__18492 = this_sym18487__18491;
    return coll__18492.cljs$core$ILookup$_lookup$arity$3(coll__18492, k, not_found)
  };
  G__18511 = function(this_sym18487, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18511__2.call(this, this_sym18487, k);
      case 3:
        return G__18511__3.call(this, this_sym18487, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18511
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym18479, args18480) {
  var this__18493 = this;
  return this_sym18479.call.apply(this_sym18479, [this_sym18479].concat(args18480.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18494 = this;
  return new cljs.core.PersistentTreeSet(this__18494.meta, cljs.core.assoc.call(null, this__18494.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__18495 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__18495.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__18496 = this;
  var this__18497 = this;
  return cljs.core.pr_str.call(null, this__18497)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__18498 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__18498.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__18499 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__18499.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__18500 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__18501 = this;
  return cljs.core._comparator.call(null, this__18501.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__18502 = this;
  return cljs.core.keys.call(null, this__18502.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__18503 = this;
  return new cljs.core.PersistentTreeSet(this__18503.meta, cljs.core.dissoc.call(null, this__18503.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18504 = this;
  return cljs.core.count.call(null, this__18504.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18505 = this;
  var and__3822__auto____18506 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____18506) {
    var and__3822__auto____18507 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____18507) {
      return cljs.core.every_QMARK_.call(null, function(p1__18461_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__18461_SHARP_)
      }, other)
    }else {
      return and__3822__auto____18507
    }
  }else {
    return and__3822__auto____18506
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18508 = this;
  return new cljs.core.PersistentTreeSet(meta, this__18508.tree_map, this__18508.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18509 = this;
  return this__18509.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18510 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__18510.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__18516__delegate = function(keys) {
      var in__18514 = cljs.core.seq.call(null, keys);
      var out__18515 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__18514)) {
          var G__18517 = cljs.core.next.call(null, in__18514);
          var G__18518 = cljs.core.conj_BANG_.call(null, out__18515, cljs.core.first.call(null, in__18514));
          in__18514 = G__18517;
          out__18515 = G__18518;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__18515)
        }
        break
      }
    };
    var G__18516 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__18516__delegate.call(this, keys)
    };
    G__18516.cljs$lang$maxFixedArity = 0;
    G__18516.cljs$lang$applyTo = function(arglist__18519) {
      var keys = cljs.core.seq(arglist__18519);
      return G__18516__delegate(keys)
    };
    G__18516.cljs$lang$arity$variadic = G__18516__delegate;
    return G__18516
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__18520) {
    var keys = cljs.core.seq(arglist__18520);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__18522) {
    var comparator = cljs.core.first(arglist__18522);
    var keys = cljs.core.rest(arglist__18522);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__18528 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____18529 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____18529)) {
        var e__18530 = temp__3971__auto____18529;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__18530))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__18528, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__18521_SHARP_) {
      var temp__3971__auto____18531 = cljs.core.find.call(null, smap, p1__18521_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____18531)) {
        var e__18532 = temp__3971__auto____18531;
        return cljs.core.second.call(null, e__18532)
      }else {
        return p1__18521_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__18562 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__18555, seen) {
        while(true) {
          var vec__18556__18557 = p__18555;
          var f__18558 = cljs.core.nth.call(null, vec__18556__18557, 0, null);
          var xs__18559 = vec__18556__18557;
          var temp__3974__auto____18560 = cljs.core.seq.call(null, xs__18559);
          if(temp__3974__auto____18560) {
            var s__18561 = temp__3974__auto____18560;
            if(cljs.core.contains_QMARK_.call(null, seen, f__18558)) {
              var G__18563 = cljs.core.rest.call(null, s__18561);
              var G__18564 = seen;
              p__18555 = G__18563;
              seen = G__18564;
              continue
            }else {
              return cljs.core.cons.call(null, f__18558, step.call(null, cljs.core.rest.call(null, s__18561), cljs.core.conj.call(null, seen, f__18558)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__18562.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__18567 = cljs.core.PersistentVector.EMPTY;
  var s__18568 = s;
  while(true) {
    if(cljs.core.next.call(null, s__18568)) {
      var G__18569 = cljs.core.conj.call(null, ret__18567, cljs.core.first.call(null, s__18568));
      var G__18570 = cljs.core.next.call(null, s__18568);
      ret__18567 = G__18569;
      s__18568 = G__18570;
      continue
    }else {
      return cljs.core.seq.call(null, ret__18567)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____18573 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____18573) {
        return or__3824__auto____18573
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__18574 = x.lastIndexOf("/");
      if(i__18574 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__18574 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____18577 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____18577) {
      return or__3824__auto____18577
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__18578 = x.lastIndexOf("/");
    if(i__18578 > -1) {
      return cljs.core.subs.call(null, x, 2, i__18578)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__18585 = cljs.core.ObjMap.EMPTY;
  var ks__18586 = cljs.core.seq.call(null, keys);
  var vs__18587 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____18588 = ks__18586;
      if(and__3822__auto____18588) {
        return vs__18587
      }else {
        return and__3822__auto____18588
      }
    }()) {
      var G__18589 = cljs.core.assoc.call(null, map__18585, cljs.core.first.call(null, ks__18586), cljs.core.first.call(null, vs__18587));
      var G__18590 = cljs.core.next.call(null, ks__18586);
      var G__18591 = cljs.core.next.call(null, vs__18587);
      map__18585 = G__18589;
      ks__18586 = G__18590;
      vs__18587 = G__18591;
      continue
    }else {
      return map__18585
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__18594__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__18579_SHARP_, p2__18580_SHARP_) {
        return max_key.call(null, k, p1__18579_SHARP_, p2__18580_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__18594 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__18594__delegate.call(this, k, x, y, more)
    };
    G__18594.cljs$lang$maxFixedArity = 3;
    G__18594.cljs$lang$applyTo = function(arglist__18595) {
      var k = cljs.core.first(arglist__18595);
      var x = cljs.core.first(cljs.core.next(arglist__18595));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18595)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18595)));
      return G__18594__delegate(k, x, y, more)
    };
    G__18594.cljs$lang$arity$variadic = G__18594__delegate;
    return G__18594
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__18596__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__18592_SHARP_, p2__18593_SHARP_) {
        return min_key.call(null, k, p1__18592_SHARP_, p2__18593_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__18596 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__18596__delegate.call(this, k, x, y, more)
    };
    G__18596.cljs$lang$maxFixedArity = 3;
    G__18596.cljs$lang$applyTo = function(arglist__18597) {
      var k = cljs.core.first(arglist__18597);
      var x = cljs.core.first(cljs.core.next(arglist__18597));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18597)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18597)));
      return G__18596__delegate(k, x, y, more)
    };
    G__18596.cljs$lang$arity$variadic = G__18596__delegate;
    return G__18596
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____18600 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____18600) {
        var s__18601 = temp__3974__auto____18600;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__18601), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__18601)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____18604 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____18604) {
      var s__18605 = temp__3974__auto____18604;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__18605)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__18605), take_while.call(null, pred, cljs.core.rest.call(null, s__18605)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__18607 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__18607.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__18619 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____18620 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____18620)) {
        var vec__18621__18622 = temp__3974__auto____18620;
        var e__18623 = cljs.core.nth.call(null, vec__18621__18622, 0, null);
        var s__18624 = vec__18621__18622;
        if(cljs.core.truth_(include__18619.call(null, e__18623))) {
          return s__18624
        }else {
          return cljs.core.next.call(null, s__18624)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__18619, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____18625 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____18625)) {
      var vec__18626__18627 = temp__3974__auto____18625;
      var e__18628 = cljs.core.nth.call(null, vec__18626__18627, 0, null);
      var s__18629 = vec__18626__18627;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__18628)) ? s__18629 : cljs.core.next.call(null, s__18629))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__18641 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____18642 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____18642)) {
        var vec__18643__18644 = temp__3974__auto____18642;
        var e__18645 = cljs.core.nth.call(null, vec__18643__18644, 0, null);
        var s__18646 = vec__18643__18644;
        if(cljs.core.truth_(include__18641.call(null, e__18645))) {
          return s__18646
        }else {
          return cljs.core.next.call(null, s__18646)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__18641, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____18647 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____18647)) {
      var vec__18648__18649 = temp__3974__auto____18647;
      var e__18650 = cljs.core.nth.call(null, vec__18648__18649, 0, null);
      var s__18651 = vec__18648__18649;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__18650)) ? s__18651 : cljs.core.next.call(null, s__18651))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__18652 = this;
  var h__2192__auto____18653 = this__18652.__hash;
  if(!(h__2192__auto____18653 == null)) {
    return h__2192__auto____18653
  }else {
    var h__2192__auto____18654 = cljs.core.hash_coll.call(null, rng);
    this__18652.__hash = h__2192__auto____18654;
    return h__2192__auto____18654
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__18655 = this;
  if(this__18655.step > 0) {
    if(this__18655.start + this__18655.step < this__18655.end) {
      return new cljs.core.Range(this__18655.meta, this__18655.start + this__18655.step, this__18655.end, this__18655.step, null)
    }else {
      return null
    }
  }else {
    if(this__18655.start + this__18655.step > this__18655.end) {
      return new cljs.core.Range(this__18655.meta, this__18655.start + this__18655.step, this__18655.end, this__18655.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__18656 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__18657 = this;
  var this__18658 = this;
  return cljs.core.pr_str.call(null, this__18658)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__18659 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__18660 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__18661 = this;
  if(this__18661.step > 0) {
    if(this__18661.start < this__18661.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__18661.start > this__18661.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__18662 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__18662.end - this__18662.start) / this__18662.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__18663 = this;
  return this__18663.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__18664 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__18664.meta, this__18664.start + this__18664.step, this__18664.end, this__18664.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__18665 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__18666 = this;
  return new cljs.core.Range(meta, this__18666.start, this__18666.end, this__18666.step, this__18666.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__18667 = this;
  return this__18667.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__18668 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__18668.start + n * this__18668.step
  }else {
    if(function() {
      var and__3822__auto____18669 = this__18668.start > this__18668.end;
      if(and__3822__auto____18669) {
        return this__18668.step === 0
      }else {
        return and__3822__auto____18669
      }
    }()) {
      return this__18668.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__18670 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__18670.start + n * this__18670.step
  }else {
    if(function() {
      var and__3822__auto____18671 = this__18670.start > this__18670.end;
      if(and__3822__auto____18671) {
        return this__18670.step === 0
      }else {
        return and__3822__auto____18671
      }
    }()) {
      return this__18670.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__18672 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__18672.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____18675 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____18675) {
      var s__18676 = temp__3974__auto____18675;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__18676), take_nth.call(null, n, cljs.core.drop.call(null, n, s__18676)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____18683 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____18683) {
      var s__18684 = temp__3974__auto____18683;
      var fst__18685 = cljs.core.first.call(null, s__18684);
      var fv__18686 = f.call(null, fst__18685);
      var run__18687 = cljs.core.cons.call(null, fst__18685, cljs.core.take_while.call(null, function(p1__18677_SHARP_) {
        return cljs.core._EQ_.call(null, fv__18686, f.call(null, p1__18677_SHARP_))
      }, cljs.core.next.call(null, s__18684)));
      return cljs.core.cons.call(null, run__18687, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__18687), s__18684))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____18702 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____18702) {
        var s__18703 = temp__3971__auto____18702;
        return reductions.call(null, f, cljs.core.first.call(null, s__18703), cljs.core.rest.call(null, s__18703))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____18704 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____18704) {
        var s__18705 = temp__3974__auto____18704;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__18705)), cljs.core.rest.call(null, s__18705))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__18708 = null;
      var G__18708__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__18708__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__18708__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__18708__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__18708__4 = function() {
        var G__18709__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__18709 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__18709__delegate.call(this, x, y, z, args)
        };
        G__18709.cljs$lang$maxFixedArity = 3;
        G__18709.cljs$lang$applyTo = function(arglist__18710) {
          var x = cljs.core.first(arglist__18710);
          var y = cljs.core.first(cljs.core.next(arglist__18710));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18710)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18710)));
          return G__18709__delegate(x, y, z, args)
        };
        G__18709.cljs$lang$arity$variadic = G__18709__delegate;
        return G__18709
      }();
      G__18708 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__18708__0.call(this);
          case 1:
            return G__18708__1.call(this, x);
          case 2:
            return G__18708__2.call(this, x, y);
          case 3:
            return G__18708__3.call(this, x, y, z);
          default:
            return G__18708__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__18708.cljs$lang$maxFixedArity = 3;
      G__18708.cljs$lang$applyTo = G__18708__4.cljs$lang$applyTo;
      return G__18708
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__18711 = null;
      var G__18711__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__18711__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__18711__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__18711__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__18711__4 = function() {
        var G__18712__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__18712 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__18712__delegate.call(this, x, y, z, args)
        };
        G__18712.cljs$lang$maxFixedArity = 3;
        G__18712.cljs$lang$applyTo = function(arglist__18713) {
          var x = cljs.core.first(arglist__18713);
          var y = cljs.core.first(cljs.core.next(arglist__18713));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18713)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18713)));
          return G__18712__delegate(x, y, z, args)
        };
        G__18712.cljs$lang$arity$variadic = G__18712__delegate;
        return G__18712
      }();
      G__18711 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__18711__0.call(this);
          case 1:
            return G__18711__1.call(this, x);
          case 2:
            return G__18711__2.call(this, x, y);
          case 3:
            return G__18711__3.call(this, x, y, z);
          default:
            return G__18711__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__18711.cljs$lang$maxFixedArity = 3;
      G__18711.cljs$lang$applyTo = G__18711__4.cljs$lang$applyTo;
      return G__18711
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__18714 = null;
      var G__18714__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__18714__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__18714__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__18714__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__18714__4 = function() {
        var G__18715__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__18715 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__18715__delegate.call(this, x, y, z, args)
        };
        G__18715.cljs$lang$maxFixedArity = 3;
        G__18715.cljs$lang$applyTo = function(arglist__18716) {
          var x = cljs.core.first(arglist__18716);
          var y = cljs.core.first(cljs.core.next(arglist__18716));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18716)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18716)));
          return G__18715__delegate(x, y, z, args)
        };
        G__18715.cljs$lang$arity$variadic = G__18715__delegate;
        return G__18715
      }();
      G__18714 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__18714__0.call(this);
          case 1:
            return G__18714__1.call(this, x);
          case 2:
            return G__18714__2.call(this, x, y);
          case 3:
            return G__18714__3.call(this, x, y, z);
          default:
            return G__18714__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__18714.cljs$lang$maxFixedArity = 3;
      G__18714.cljs$lang$applyTo = G__18714__4.cljs$lang$applyTo;
      return G__18714
    }()
  };
  var juxt__4 = function() {
    var G__18717__delegate = function(f, g, h, fs) {
      var fs__18707 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__18718 = null;
        var G__18718__0 = function() {
          return cljs.core.reduce.call(null, function(p1__18688_SHARP_, p2__18689_SHARP_) {
            return cljs.core.conj.call(null, p1__18688_SHARP_, p2__18689_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__18707)
        };
        var G__18718__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__18690_SHARP_, p2__18691_SHARP_) {
            return cljs.core.conj.call(null, p1__18690_SHARP_, p2__18691_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__18707)
        };
        var G__18718__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__18692_SHARP_, p2__18693_SHARP_) {
            return cljs.core.conj.call(null, p1__18692_SHARP_, p2__18693_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__18707)
        };
        var G__18718__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__18694_SHARP_, p2__18695_SHARP_) {
            return cljs.core.conj.call(null, p1__18694_SHARP_, p2__18695_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__18707)
        };
        var G__18718__4 = function() {
          var G__18719__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__18696_SHARP_, p2__18697_SHARP_) {
              return cljs.core.conj.call(null, p1__18696_SHARP_, cljs.core.apply.call(null, p2__18697_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__18707)
          };
          var G__18719 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__18719__delegate.call(this, x, y, z, args)
          };
          G__18719.cljs$lang$maxFixedArity = 3;
          G__18719.cljs$lang$applyTo = function(arglist__18720) {
            var x = cljs.core.first(arglist__18720);
            var y = cljs.core.first(cljs.core.next(arglist__18720));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18720)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18720)));
            return G__18719__delegate(x, y, z, args)
          };
          G__18719.cljs$lang$arity$variadic = G__18719__delegate;
          return G__18719
        }();
        G__18718 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__18718__0.call(this);
            case 1:
              return G__18718__1.call(this, x);
            case 2:
              return G__18718__2.call(this, x, y);
            case 3:
              return G__18718__3.call(this, x, y, z);
            default:
              return G__18718__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__18718.cljs$lang$maxFixedArity = 3;
        G__18718.cljs$lang$applyTo = G__18718__4.cljs$lang$applyTo;
        return G__18718
      }()
    };
    var G__18717 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__18717__delegate.call(this, f, g, h, fs)
    };
    G__18717.cljs$lang$maxFixedArity = 3;
    G__18717.cljs$lang$applyTo = function(arglist__18721) {
      var f = cljs.core.first(arglist__18721);
      var g = cljs.core.first(cljs.core.next(arglist__18721));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18721)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18721)));
      return G__18717__delegate(f, g, h, fs)
    };
    G__18717.cljs$lang$arity$variadic = G__18717__delegate;
    return G__18717
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__18724 = cljs.core.next.call(null, coll);
        coll = G__18724;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____18723 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____18723) {
          return n > 0
        }else {
          return and__3822__auto____18723
        }
      }())) {
        var G__18725 = n - 1;
        var G__18726 = cljs.core.next.call(null, coll);
        n = G__18725;
        coll = G__18726;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__18728 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__18728), s)) {
    if(cljs.core.count.call(null, matches__18728) === 1) {
      return cljs.core.first.call(null, matches__18728)
    }else {
      return cljs.core.vec.call(null, matches__18728)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__18730 = re.exec(s);
  if(matches__18730 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__18730) === 1) {
      return cljs.core.first.call(null, matches__18730)
    }else {
      return cljs.core.vec.call(null, matches__18730)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__18735 = cljs.core.re_find.call(null, re, s);
  var match_idx__18736 = s.search(re);
  var match_str__18737 = cljs.core.coll_QMARK_.call(null, match_data__18735) ? cljs.core.first.call(null, match_data__18735) : match_data__18735;
  var post_match__18738 = cljs.core.subs.call(null, s, match_idx__18736 + cljs.core.count.call(null, match_str__18737));
  if(cljs.core.truth_(match_data__18735)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__18735, re_seq.call(null, re, post_match__18738))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__18745__18746 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___18747 = cljs.core.nth.call(null, vec__18745__18746, 0, null);
  var flags__18748 = cljs.core.nth.call(null, vec__18745__18746, 1, null);
  var pattern__18749 = cljs.core.nth.call(null, vec__18745__18746, 2, null);
  return new RegExp(pattern__18749, flags__18748)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__18739_SHARP_) {
    return print_one.call(null, p1__18739_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____18759 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____18759)) {
            var and__3822__auto____18763 = function() {
              var G__18760__18761 = obj;
              if(G__18760__18761) {
                if(function() {
                  var or__3824__auto____18762 = G__18760__18761.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____18762) {
                    return or__3824__auto____18762
                  }else {
                    return G__18760__18761.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__18760__18761.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__18760__18761)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__18760__18761)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____18763)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____18763
            }
          }else {
            return and__3822__auto____18759
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____18764 = !(obj == null);
          if(and__3822__auto____18764) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____18764
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__18765__18766 = obj;
          if(G__18765__18766) {
            if(function() {
              var or__3824__auto____18767 = G__18765__18766.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____18767) {
                return or__3824__auto____18767
              }else {
                return G__18765__18766.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__18765__18766.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__18765__18766)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__18765__18766)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__18787 = new goog.string.StringBuffer;
  var G__18788__18789 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__18788__18789) {
    var string__18790 = cljs.core.first.call(null, G__18788__18789);
    var G__18788__18791 = G__18788__18789;
    while(true) {
      sb__18787.append(string__18790);
      var temp__3974__auto____18792 = cljs.core.next.call(null, G__18788__18791);
      if(temp__3974__auto____18792) {
        var G__18788__18793 = temp__3974__auto____18792;
        var G__18806 = cljs.core.first.call(null, G__18788__18793);
        var G__18807 = G__18788__18793;
        string__18790 = G__18806;
        G__18788__18791 = G__18807;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__18794__18795 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__18794__18795) {
    var obj__18796 = cljs.core.first.call(null, G__18794__18795);
    var G__18794__18797 = G__18794__18795;
    while(true) {
      sb__18787.append(" ");
      var G__18798__18799 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__18796, opts));
      if(G__18798__18799) {
        var string__18800 = cljs.core.first.call(null, G__18798__18799);
        var G__18798__18801 = G__18798__18799;
        while(true) {
          sb__18787.append(string__18800);
          var temp__3974__auto____18802 = cljs.core.next.call(null, G__18798__18801);
          if(temp__3974__auto____18802) {
            var G__18798__18803 = temp__3974__auto____18802;
            var G__18808 = cljs.core.first.call(null, G__18798__18803);
            var G__18809 = G__18798__18803;
            string__18800 = G__18808;
            G__18798__18801 = G__18809;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____18804 = cljs.core.next.call(null, G__18794__18797);
      if(temp__3974__auto____18804) {
        var G__18794__18805 = temp__3974__auto____18804;
        var G__18810 = cljs.core.first.call(null, G__18794__18805);
        var G__18811 = G__18794__18805;
        obj__18796 = G__18810;
        G__18794__18797 = G__18811;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__18787
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__18813 = cljs.core.pr_sb.call(null, objs, opts);
  sb__18813.append("\n");
  return[cljs.core.str(sb__18813)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__18832__18833 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__18832__18833) {
    var string__18834 = cljs.core.first.call(null, G__18832__18833);
    var G__18832__18835 = G__18832__18833;
    while(true) {
      cljs.core.string_print.call(null, string__18834);
      var temp__3974__auto____18836 = cljs.core.next.call(null, G__18832__18835);
      if(temp__3974__auto____18836) {
        var G__18832__18837 = temp__3974__auto____18836;
        var G__18850 = cljs.core.first.call(null, G__18832__18837);
        var G__18851 = G__18832__18837;
        string__18834 = G__18850;
        G__18832__18835 = G__18851;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__18838__18839 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__18838__18839) {
    var obj__18840 = cljs.core.first.call(null, G__18838__18839);
    var G__18838__18841 = G__18838__18839;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__18842__18843 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__18840, opts));
      if(G__18842__18843) {
        var string__18844 = cljs.core.first.call(null, G__18842__18843);
        var G__18842__18845 = G__18842__18843;
        while(true) {
          cljs.core.string_print.call(null, string__18844);
          var temp__3974__auto____18846 = cljs.core.next.call(null, G__18842__18845);
          if(temp__3974__auto____18846) {
            var G__18842__18847 = temp__3974__auto____18846;
            var G__18852 = cljs.core.first.call(null, G__18842__18847);
            var G__18853 = G__18842__18847;
            string__18844 = G__18852;
            G__18842__18845 = G__18853;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____18848 = cljs.core.next.call(null, G__18838__18841);
      if(temp__3974__auto____18848) {
        var G__18838__18849 = temp__3974__auto____18848;
        var G__18854 = cljs.core.first.call(null, G__18838__18849);
        var G__18855 = G__18838__18849;
        obj__18840 = G__18854;
        G__18838__18841 = G__18855;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__18856) {
    var objs = cljs.core.seq(arglist__18856);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__18857) {
    var objs = cljs.core.seq(arglist__18857);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__18858) {
    var objs = cljs.core.seq(arglist__18858);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__18859) {
    var objs = cljs.core.seq(arglist__18859);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__18860) {
    var objs = cljs.core.seq(arglist__18860);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__18861) {
    var objs = cljs.core.seq(arglist__18861);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__18862) {
    var objs = cljs.core.seq(arglist__18862);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__18863) {
    var objs = cljs.core.seq(arglist__18863);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__18864) {
    var fmt = cljs.core.first(arglist__18864);
    var args = cljs.core.rest(arglist__18864);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__18865 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18865, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__18866 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18866, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__18867 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18867, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____18868 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____18868)) {
        var nspc__18869 = temp__3974__auto____18868;
        return[cljs.core.str(nspc__18869), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____18870 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____18870)) {
          var nspc__18871 = temp__3974__auto____18870;
          return[cljs.core.str(nspc__18871), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__18872 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18872, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__18874 = function(n, len) {
    var ns__18873 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__18873) < len) {
        var G__18876 = [cljs.core.str("0"), cljs.core.str(ns__18873)].join("");
        ns__18873 = G__18876;
        continue
      }else {
        return ns__18873
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__18874.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__18874.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__18874.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__18874.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__18874.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__18874.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__18875 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18875, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__18877 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__18878 = this;
  var G__18879__18880 = cljs.core.seq.call(null, this__18878.watches);
  if(G__18879__18880) {
    var G__18882__18884 = cljs.core.first.call(null, G__18879__18880);
    var vec__18883__18885 = G__18882__18884;
    var key__18886 = cljs.core.nth.call(null, vec__18883__18885, 0, null);
    var f__18887 = cljs.core.nth.call(null, vec__18883__18885, 1, null);
    var G__18879__18888 = G__18879__18880;
    var G__18882__18889 = G__18882__18884;
    var G__18879__18890 = G__18879__18888;
    while(true) {
      var vec__18891__18892 = G__18882__18889;
      var key__18893 = cljs.core.nth.call(null, vec__18891__18892, 0, null);
      var f__18894 = cljs.core.nth.call(null, vec__18891__18892, 1, null);
      var G__18879__18895 = G__18879__18890;
      f__18894.call(null, key__18893, this$, oldval, newval);
      var temp__3974__auto____18896 = cljs.core.next.call(null, G__18879__18895);
      if(temp__3974__auto____18896) {
        var G__18879__18897 = temp__3974__auto____18896;
        var G__18904 = cljs.core.first.call(null, G__18879__18897);
        var G__18905 = G__18879__18897;
        G__18882__18889 = G__18904;
        G__18879__18890 = G__18905;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__18898 = this;
  return this$.watches = cljs.core.assoc.call(null, this__18898.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__18899 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__18899.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__18900 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__18900.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__18901 = this;
  return this__18901.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__18902 = this;
  return this__18902.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__18903 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__18917__delegate = function(x, p__18906) {
      var map__18912__18913 = p__18906;
      var map__18912__18914 = cljs.core.seq_QMARK_.call(null, map__18912__18913) ? cljs.core.apply.call(null, cljs.core.hash_map, map__18912__18913) : map__18912__18913;
      var validator__18915 = cljs.core._lookup.call(null, map__18912__18914, "\ufdd0'validator", null);
      var meta__18916 = cljs.core._lookup.call(null, map__18912__18914, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__18916, validator__18915, null)
    };
    var G__18917 = function(x, var_args) {
      var p__18906 = null;
      if(goog.isDef(var_args)) {
        p__18906 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__18917__delegate.call(this, x, p__18906)
    };
    G__18917.cljs$lang$maxFixedArity = 1;
    G__18917.cljs$lang$applyTo = function(arglist__18918) {
      var x = cljs.core.first(arglist__18918);
      var p__18906 = cljs.core.rest(arglist__18918);
      return G__18917__delegate(x, p__18906)
    };
    G__18917.cljs$lang$arity$variadic = G__18917__delegate;
    return G__18917
  }();
  atom = function(x, var_args) {
    var p__18906 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____18922 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____18922)) {
    var validate__18923 = temp__3974__auto____18922;
    if(cljs.core.truth_(validate__18923.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__18924 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__18924, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__18925__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__18925 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__18925__delegate.call(this, a, f, x, y, z, more)
    };
    G__18925.cljs$lang$maxFixedArity = 5;
    G__18925.cljs$lang$applyTo = function(arglist__18926) {
      var a = cljs.core.first(arglist__18926);
      var f = cljs.core.first(cljs.core.next(arglist__18926));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18926)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__18926))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__18926)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__18926)))));
      return G__18925__delegate(a, f, x, y, z, more)
    };
    G__18925.cljs$lang$arity$variadic = G__18925__delegate;
    return G__18925
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__18927) {
    var iref = cljs.core.first(arglist__18927);
    var f = cljs.core.first(cljs.core.next(arglist__18927));
    var args = cljs.core.rest(cljs.core.next(arglist__18927));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__18928 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__18928.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__18929 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__18929.state, function(p__18930) {
    var map__18931__18932 = p__18930;
    var map__18931__18933 = cljs.core.seq_QMARK_.call(null, map__18931__18932) ? cljs.core.apply.call(null, cljs.core.hash_map, map__18931__18932) : map__18931__18932;
    var curr_state__18934 = map__18931__18933;
    var done__18935 = cljs.core._lookup.call(null, map__18931__18933, "\ufdd0'done", null);
    if(cljs.core.truth_(done__18935)) {
      return curr_state__18934
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__18929.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__18956__18957 = options;
    var map__18956__18958 = cljs.core.seq_QMARK_.call(null, map__18956__18957) ? cljs.core.apply.call(null, cljs.core.hash_map, map__18956__18957) : map__18956__18957;
    var keywordize_keys__18959 = cljs.core._lookup.call(null, map__18956__18958, "\ufdd0'keywordize-keys", null);
    var keyfn__18960 = cljs.core.truth_(keywordize_keys__18959) ? cljs.core.keyword : cljs.core.str;
    var f__18975 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2462__auto____18974 = function iter__18968(s__18969) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__18969__18972 = s__18969;
                    while(true) {
                      if(cljs.core.seq.call(null, s__18969__18972)) {
                        var k__18973 = cljs.core.first.call(null, s__18969__18972);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__18960.call(null, k__18973), thisfn.call(null, x[k__18973])], true), iter__18968.call(null, cljs.core.rest.call(null, s__18969__18972)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____18974.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__18975.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__18976) {
    var x = cljs.core.first(arglist__18976);
    var options = cljs.core.rest(arglist__18976);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__18981 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__18985__delegate = function(args) {
      var temp__3971__auto____18982 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__18981), args, null);
      if(cljs.core.truth_(temp__3971__auto____18982)) {
        var v__18983 = temp__3971__auto____18982;
        return v__18983
      }else {
        var ret__18984 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__18981, cljs.core.assoc, args, ret__18984);
        return ret__18984
      }
    };
    var G__18985 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__18985__delegate.call(this, args)
    };
    G__18985.cljs$lang$maxFixedArity = 0;
    G__18985.cljs$lang$applyTo = function(arglist__18986) {
      var args = cljs.core.seq(arglist__18986);
      return G__18985__delegate(args)
    };
    G__18985.cljs$lang$arity$variadic = G__18985__delegate;
    return G__18985
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__18988 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__18988)) {
        var G__18989 = ret__18988;
        f = G__18989;
        continue
      }else {
        return ret__18988
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__18990__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__18990 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__18990__delegate.call(this, f, args)
    };
    G__18990.cljs$lang$maxFixedArity = 1;
    G__18990.cljs$lang$applyTo = function(arglist__18991) {
      var f = cljs.core.first(arglist__18991);
      var args = cljs.core.rest(arglist__18991);
      return G__18990__delegate(f, args)
    };
    G__18990.cljs$lang$arity$variadic = G__18990__delegate;
    return G__18990
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__18993 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__18993, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__18993, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____19002 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____19002) {
      return or__3824__auto____19002
    }else {
      var or__3824__auto____19003 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____19003) {
        return or__3824__auto____19003
      }else {
        var and__3822__auto____19004 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____19004) {
          var and__3822__auto____19005 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____19005) {
            var and__3822__auto____19006 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____19006) {
              var ret__19007 = true;
              var i__19008 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____19009 = cljs.core.not.call(null, ret__19007);
                  if(or__3824__auto____19009) {
                    return or__3824__auto____19009
                  }else {
                    return i__19008 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__19007
                }else {
                  var G__19010 = isa_QMARK_.call(null, h, child.call(null, i__19008), parent.call(null, i__19008));
                  var G__19011 = i__19008 + 1;
                  ret__19007 = G__19010;
                  i__19008 = G__19011;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____19006
            }
          }else {
            return and__3822__auto____19005
          }
        }else {
          return and__3822__auto____19004
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__19020 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__19021 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__19022 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__19023 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____19024 = cljs.core.contains_QMARK_.call(null, tp__19020.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__19022.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__19022.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__19020, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__19023.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__19021, parent, ta__19022), "\ufdd0'descendants":tf__19023.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__19022, tag, td__19021)})
    }();
    if(cljs.core.truth_(or__3824__auto____19024)) {
      return or__3824__auto____19024
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__19029 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__19030 = cljs.core.truth_(parentMap__19029.call(null, tag)) ? cljs.core.disj.call(null, parentMap__19029.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__19031 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__19030)) ? cljs.core.assoc.call(null, parentMap__19029, tag, childsParents__19030) : cljs.core.dissoc.call(null, parentMap__19029, tag);
    var deriv_seq__19032 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__19012_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__19012_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__19012_SHARP_), cljs.core.second.call(null, p1__19012_SHARP_)))
    }, cljs.core.seq.call(null, newParents__19031)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__19029.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__19013_SHARP_, p2__19014_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__19013_SHARP_, p2__19014_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__19032))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__19040 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____19042 = cljs.core.truth_(function() {
    var and__3822__auto____19041 = xprefs__19040;
    if(cljs.core.truth_(and__3822__auto____19041)) {
      return xprefs__19040.call(null, y)
    }else {
      return and__3822__auto____19041
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____19042)) {
    return or__3824__auto____19042
  }else {
    var or__3824__auto____19044 = function() {
      var ps__19043 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__19043) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__19043), prefer_table))) {
          }else {
          }
          var G__19047 = cljs.core.rest.call(null, ps__19043);
          ps__19043 = G__19047;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____19044)) {
      return or__3824__auto____19044
    }else {
      var or__3824__auto____19046 = function() {
        var ps__19045 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__19045) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__19045), y, prefer_table))) {
            }else {
            }
            var G__19048 = cljs.core.rest.call(null, ps__19045);
            ps__19045 = G__19048;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____19046)) {
        return or__3824__auto____19046
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____19050 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____19050)) {
    return or__3824__auto____19050
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__19068 = cljs.core.reduce.call(null, function(be, p__19060) {
    var vec__19061__19062 = p__19060;
    var k__19063 = cljs.core.nth.call(null, vec__19061__19062, 0, null);
    var ___19064 = cljs.core.nth.call(null, vec__19061__19062, 1, null);
    var e__19065 = vec__19061__19062;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__19063)) {
      var be2__19067 = cljs.core.truth_(function() {
        var or__3824__auto____19066 = be == null;
        if(or__3824__auto____19066) {
          return or__3824__auto____19066
        }else {
          return cljs.core.dominates.call(null, k__19063, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__19065 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__19067), k__19063, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__19063), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__19067)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__19067
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__19068)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__19068));
      return cljs.core.second.call(null, best_entry__19068)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____19073 = mf;
    if(and__3822__auto____19073) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____19073
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____19074 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19075 = cljs.core._reset[goog.typeOf(x__2363__auto____19074)];
      if(or__3824__auto____19075) {
        return or__3824__auto____19075
      }else {
        var or__3824__auto____19076 = cljs.core._reset["_"];
        if(or__3824__auto____19076) {
          return or__3824__auto____19076
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____19081 = mf;
    if(and__3822__auto____19081) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____19081
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____19082 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19083 = cljs.core._add_method[goog.typeOf(x__2363__auto____19082)];
      if(or__3824__auto____19083) {
        return or__3824__auto____19083
      }else {
        var or__3824__auto____19084 = cljs.core._add_method["_"];
        if(or__3824__auto____19084) {
          return or__3824__auto____19084
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____19089 = mf;
    if(and__3822__auto____19089) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____19089
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____19090 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19091 = cljs.core._remove_method[goog.typeOf(x__2363__auto____19090)];
      if(or__3824__auto____19091) {
        return or__3824__auto____19091
      }else {
        var or__3824__auto____19092 = cljs.core._remove_method["_"];
        if(or__3824__auto____19092) {
          return or__3824__auto____19092
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____19097 = mf;
    if(and__3822__auto____19097) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____19097
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____19098 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19099 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____19098)];
      if(or__3824__auto____19099) {
        return or__3824__auto____19099
      }else {
        var or__3824__auto____19100 = cljs.core._prefer_method["_"];
        if(or__3824__auto____19100) {
          return or__3824__auto____19100
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____19105 = mf;
    if(and__3822__auto____19105) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____19105
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____19106 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19107 = cljs.core._get_method[goog.typeOf(x__2363__auto____19106)];
      if(or__3824__auto____19107) {
        return or__3824__auto____19107
      }else {
        var or__3824__auto____19108 = cljs.core._get_method["_"];
        if(or__3824__auto____19108) {
          return or__3824__auto____19108
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____19113 = mf;
    if(and__3822__auto____19113) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____19113
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____19114 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19115 = cljs.core._methods[goog.typeOf(x__2363__auto____19114)];
      if(or__3824__auto____19115) {
        return or__3824__auto____19115
      }else {
        var or__3824__auto____19116 = cljs.core._methods["_"];
        if(or__3824__auto____19116) {
          return or__3824__auto____19116
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____19121 = mf;
    if(and__3822__auto____19121) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____19121
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____19122 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19123 = cljs.core._prefers[goog.typeOf(x__2363__auto____19122)];
      if(or__3824__auto____19123) {
        return or__3824__auto____19123
      }else {
        var or__3824__auto____19124 = cljs.core._prefers["_"];
        if(or__3824__auto____19124) {
          return or__3824__auto____19124
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____19129 = mf;
    if(and__3822__auto____19129) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____19129
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____19130 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19131 = cljs.core._dispatch[goog.typeOf(x__2363__auto____19130)];
      if(or__3824__auto____19131) {
        return or__3824__auto____19131
      }else {
        var or__3824__auto____19132 = cljs.core._dispatch["_"];
        if(or__3824__auto____19132) {
          return or__3824__auto____19132
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__19135 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__19136 = cljs.core._get_method.call(null, mf, dispatch_val__19135);
  if(cljs.core.truth_(target_fn__19136)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__19135)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__19136, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__19137 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__19138 = this;
  cljs.core.swap_BANG_.call(null, this__19138.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__19138.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__19138.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__19138.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__19139 = this;
  cljs.core.swap_BANG_.call(null, this__19139.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__19139.method_cache, this__19139.method_table, this__19139.cached_hierarchy, this__19139.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__19140 = this;
  cljs.core.swap_BANG_.call(null, this__19140.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__19140.method_cache, this__19140.method_table, this__19140.cached_hierarchy, this__19140.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__19141 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__19141.cached_hierarchy), cljs.core.deref.call(null, this__19141.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__19141.method_cache, this__19141.method_table, this__19141.cached_hierarchy, this__19141.hierarchy)
  }
  var temp__3971__auto____19142 = cljs.core.deref.call(null, this__19141.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____19142)) {
    var target_fn__19143 = temp__3971__auto____19142;
    return target_fn__19143
  }else {
    var temp__3971__auto____19144 = cljs.core.find_and_cache_best_method.call(null, this__19141.name, dispatch_val, this__19141.hierarchy, this__19141.method_table, this__19141.prefer_table, this__19141.method_cache, this__19141.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____19144)) {
      var target_fn__19145 = temp__3971__auto____19144;
      return target_fn__19145
    }else {
      return cljs.core.deref.call(null, this__19141.method_table).call(null, this__19141.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__19146 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__19146.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__19146.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__19146.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__19146.method_cache, this__19146.method_table, this__19146.cached_hierarchy, this__19146.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__19147 = this;
  return cljs.core.deref.call(null, this__19147.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__19148 = this;
  return cljs.core.deref.call(null, this__19148.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__19149 = this;
  return cljs.core.do_dispatch.call(null, mf, this__19149.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__19151__delegate = function(_, args) {
    var self__19150 = this;
    return cljs.core._dispatch.call(null, self__19150, args)
  };
  var G__19151 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__19151__delegate.call(this, _, args)
  };
  G__19151.cljs$lang$maxFixedArity = 1;
  G__19151.cljs$lang$applyTo = function(arglist__19152) {
    var _ = cljs.core.first(arglist__19152);
    var args = cljs.core.rest(arglist__19152);
    return G__19151__delegate(_, args)
  };
  G__19151.cljs$lang$arity$variadic = G__19151__delegate;
  return G__19151
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__19153 = this;
  return cljs.core._dispatch.call(null, self__19153, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__19154 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_19156, _) {
  var this__19155 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__19155.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__19157 = this;
  var and__3822__auto____19158 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____19158) {
    return this__19157.uuid === other.uuid
  }else {
    return and__3822__auto____19158
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__19159 = this;
  var this__19160 = this;
  return cljs.core.pr_str.call(null, this__19160)
};
cljs.core.UUID;
goog.provide("subpar.core");
goog.require("cljs.core");
subpar.core.get_index = function get_index(cm) {
  return cm.indexFromPos(cm.getCursor())
};
subpar.core.go_to_index = function go_to_index(cm, i, j) {
  if(cljs.core.not_EQ_.call(null, i, j)) {
    return cm.setCursor(cm.posFromIndex(j))
  }else {
    return null
  }
};
subpar.core.nothing_selected_QMARK_ = function nothing_selected_QMARK_(cm) {
  return cljs.core._EQ_.call(null, "", cm.getSelection())
};
subpar.core.get_info = function get_info(cm) {
  return cljs.core.PersistentVector.fromArray([cm.getCursor(), subpar.core.get_index.call(null, cm), cm.getValue()], true)
};
subpar.core.code = "c";
subpar.core.cmmnt = ";";
subpar.core.string = '"';
subpar.core.openers = cljs.core.PersistentHashSet.fromArray(["(", "[", "{"]);
subpar.core.closers = cljs.core.PersistentHashSet.fromArray([")", "]", "}"]);
subpar.core.opener_QMARK_ = function opener_QMARK_(a) {
  return cljs.core.contains_QMARK_.call(null, subpar.core.openers, a)
};
subpar.core.closer_QMARK_ = function closer_QMARK_(a) {
  return cljs.core.contains_QMARK_.call(null, subpar.core.closers, a)
};
subpar.core.whitespace_QMARK_ = function whitespace_QMARK_(x) {
  var or__3824__auto____19163 = cljs.core._EQ_.call(null, x, "\t");
  if(or__3824__auto____19163) {
    return or__3824__auto____19163
  }else {
    var or__3824__auto____19164 = cljs.core._EQ_.call(null, x, " ");
    if(or__3824__auto____19164) {
      return or__3824__auto____19164
    }else {
      return cljs.core._EQ_.call(null, x, "\n")
    }
  }
};
subpar.core.get_opening_delimiter_index_with_parse = function get_opening_delimiter_index_with_parse(p, i) {
  return cljs.core.nth.call(null, cljs.core.nth.call(null, (new cljs.core.Keyword("\ufdd0'chars")).call(null, p), i), 1)
};
subpar.core.get_closing_delimiter_index_with_parse = function get_closing_delimiter_index_with_parse(p, i) {
  return cljs.core.get_in.call(null, p, cljs.core.PersistentVector.fromArray(["\ufdd0'families", subpar.core.get_opening_delimiter_index_with_parse.call(null, p, i), "\ufdd0'closer"], true))
};
subpar.core.get_opening_delimiter_index = function get_opening_delimiter_index(s, i) {
  return subpar.core.get_opening_delimiter_index_with_parse.call(null, subpar.core.parse.call(null, s), i)
};
subpar.core.get_closing_delimiter_index = function get_closing_delimiter_index(s, i) {
  return subpar.core.get_closing_delimiter_index_with_parse.call(null, subpar.core.parse.call(null, s), i)
};
subpar.core.get_wrapper = function get_wrapper(p, i) {
  return cljs.core.PersistentVector.fromArray([subpar.core.get_opening_delimiter_index_with_parse.call(null, p, i), subpar.core.get_closing_delimiter_index_with_parse.call(null, p, i)], true)
};
subpar.core.get_mode = function get_mode(p, i) {
  return cljs.core.nth.call(null, cljs.core.nth.call(null, (new cljs.core.Keyword("\ufdd0'chars")).call(null, p), i), 0)
};
subpar.core.in_QMARK_ = function in_QMARK_(p, i, mode) {
  var and__3822__auto____19168 = function() {
    var and__3822__auto____19167 = 0 <= i;
    if(and__3822__auto____19167) {
      return i <= cljs.core.count.call(null, (new cljs.core.Keyword("\ufdd0'chars")).call(null, p))
    }else {
      return and__3822__auto____19167
    }
  }();
  if(cljs.core.truth_(and__3822__auto____19168)) {
    return cljs.core._EQ_.call(null, mode, subpar.core.get_mode.call(null, p, i))
  }else {
    return and__3822__auto____19168
  }
};
subpar.core.in_comment_QMARK_ = function in_comment_QMARK_(p, i) {
  return subpar.core.in_QMARK_.call(null, p, i, subpar.core.cmmnt)
};
subpar.core.in_code_QMARK_ = function in_code_QMARK_(p, i) {
  return subpar.core.in_QMARK_.call(null, p, i, subpar.core.code)
};
subpar.core.in_string_QMARK_ = function in_string_QMARK_(p, i) {
  return subpar.core.in_QMARK_.call(null, p, i, subpar.core.string)
};
subpar.core.in_string = function in_string(s, i) {
  return subpar.core.in_string_QMARK_.call(null, subpar.core.parse.call(null, s), i)
};
goog.exportSymbol("subpar.core.in_string", subpar.core.in_string);
subpar.core.n_str_QMARK_ = cljs.core.complement.call(null, subpar.core.in_string_QMARK_);
subpar.core.get_all_siblings = function get_all_siblings(i, p) {
  return cljs.core.get_in.call(null, p, cljs.core.PersistentVector.fromArray(["\ufdd0'families", subpar.core.get_opening_delimiter_index_with_parse.call(null, p, i), "\ufdd0'children"], true))
};
subpar.core.get_siblings = function get_siblings(i, transform, predicate, p) {
  return cljs.core.sort.call(null, cljs.core.filter.call(null, predicate, transform.call(null, subpar.core.get_all_siblings.call(null, i, p))))
};
subpar.core.count_lines = function count_lines(s, i, j) {
  var and__3822__auto____19172 = i;
  if(cljs.core.truth_(and__3822__auto____19172)) {
    var and__3822__auto____19173 = j;
    if(cljs.core.truth_(and__3822__auto____19173)) {
      return cljs.core.count.call(null, cljs.core.filter.call(null, function(p1__19169_SHARP_) {
        return cljs.core._EQ_.call(null, "\n", p1__19169_SHARP_)
      }, cljs.core.drop.call(null, i, cljs.core.drop_last.call(null, cljs.core.count.call(null, s) - j - 1, cljs.core.take.call(null, cljs.core.count.call(null, s), s))))) + 1
    }else {
      return and__3822__auto____19173
    }
  }else {
    return and__3822__auto____19172
  }
};
subpar.core.escaped_QMARK_ = function escaped_QMARK_(s, i) {
  return cljs.core.odd_QMARK_.call(null, function() {
    var c__19177 = 0;
    var j__19178 = i - 1;
    while(true) {
      var a__19179 = cljs.core.nth.call(null, s, j__19178, null);
      if(j__19178 < 0) {
        return c__19177
      }else {
        if(a__19179 == null) {
          return c__19177
        }else {
          if(cljs.core.not_EQ_.call(null, "\\", a__19179)) {
            return c__19177
          }else {
            if(true) {
              var G__19180 = c__19177 + 1;
              var G__19181 = j__19178 - 1;
              c__19177 = G__19180;
              j__19178 = G__19181;
              continue
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }())
};
subpar.core.closes_list_QMARK_ = function closes_list_QMARK_(p, i) {
  return cljs.core.some.call(null, cljs.core.PersistentHashSet.fromArray([i]), cljs.core.map.call(null, "\ufdd0'closer", cljs.core.vals.call(null, (new cljs.core.Keyword("\ufdd0'families")).call(null, p))))
};
subpar.core.opens_list_QMARK_ = function opens_list_QMARK_(p, i) {
  return cljs.core.some.call(null, cljs.core.PersistentHashSet.fromArray([i]), cljs.core.keys.call(null, (new cljs.core.Keyword("\ufdd0'families")).call(null, p)))
};
subpar.core.backward_up_fn = function backward_up_fn(s, i) {
  var vec__19186__19187 = subpar.core.get_wrapper.call(null, subpar.core.parse.call(null, s), i);
  var o__19188 = cljs.core.nth.call(null, vec__19186__19187, 0, null);
  var c__19189 = cljs.core.nth.call(null, vec__19186__19187, 1, null);
  if(cljs.core._EQ_.call(null, -1, o__19188)) {
    return i
  }else {
    return o__19188
  }
};
goog.exportSymbol("subpar.core.backward_up_fn", subpar.core.backward_up_fn);
subpar.core.forward_delete_action = function forward_delete_action(s, i) {
  var p__19194 = subpar.core.parse.call(null, s);
  var h__19195 = i - 1;
  var j__19196 = i + 1;
  var c__19197 = cljs.core.nth.call(null, s, i, null);
  if(i >= cljs.core.count.call(null, s)) {
    return 0
  }else {
    if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, i))) {
      return 2
    }else {
      if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, j__19196))) {
        return 3
      }else {
        if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([h__19195, i], true), subpar.core.get_wrapper.call(null, p__19194, i))) {
          return 2
        }else {
          if(cljs.core.truth_(subpar.core.closes_list_QMARK_.call(null, p__19194, i))) {
            return 0
          }else {
            if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([i, j__19196], true), subpar.core.get_wrapper.call(null, p__19194, j__19196))) {
              return 3
            }else {
              if(cljs.core.truth_(subpar.core.opens_list_QMARK_.call(null, p__19194, i))) {
                return 4
              }else {
                if(true) {
                  return 1
                }else {
                  return null
                }
              }
            }
          }
        }
      }
    }
  }
};
goog.exportSymbol("subpar.core.forward_delete_action", subpar.core.forward_delete_action);
subpar.core.backward_delete_action = function backward_delete_action(s, i) {
  var p__19201 = subpar.core.parse.call(null, s);
  var g__19202 = i - 2;
  var h__19203 = i - 1;
  if(i <= 0) {
    return 0
  }else {
    if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, h__19203))) {
      return 3
    }else {
      if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, i))) {
        return 2
      }else {
        if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([g__19202, h__19203], true), subpar.core.get_wrapper.call(null, p__19201, h__19203))) {
          return 3
        }else {
          if(cljs.core.truth_(subpar.core.closes_list_QMARK_.call(null, p__19201, h__19203))) {
            return 4
          }else {
            if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([h__19203, i], true), subpar.core.get_wrapper.call(null, p__19201, i))) {
              return 2
            }else {
              if(cljs.core.truth_(subpar.core.opens_list_QMARK_.call(null, p__19201, h__19203))) {
                return 0
              }else {
                if(true) {
                  return 1
                }else {
                  return null
                }
              }
            }
          }
        }
      }
    }
  }
};
goog.exportSymbol("subpar.core.backward_delete_action", subpar.core.backward_delete_action);
subpar.core.double_quote_action = function double_quote_action(s, i) {
  var p__19205 = subpar.core.parse.call(null, s);
  if(i < 0) {
    return 0
  }else {
    if(i >= cljs.core.count.call(null, s)) {
      return 0
    }else {
      if(cljs.core.truth_(subpar.core.in_comment_QMARK_.call(null, p__19205, i))) {
        return 3
      }else {
        if(cljs.core.truth_(subpar.core.n_str_QMARK_.call(null, p__19205, i))) {
          return 0
        }else {
          if(cljs.core._EQ_.call(null, '"', cljs.core.nth.call(null, s, i))) {
            return 2
          }else {
            if("\ufdd0'escaping") {
              return 1
            }else {
              return null
            }
          }
        }
      }
    }
  }
};
goog.exportSymbol("subpar.core.double_quote_action", subpar.core.double_quote_action);
subpar.core.close_expression_vals = function close_expression_vals(p, i) {
  var vec__19215__19216 = subpar.core.get_wrapper.call(null, p, i);
  var o__19217 = cljs.core.nth.call(null, vec__19215__19216, 0, null);
  var c__19218 = cljs.core.nth.call(null, vec__19215__19216, 1, null);
  if(cljs.core._EQ_.call(null, -1, o__19217)) {
    return cljs.core.PersistentVector.EMPTY
  }else {
    var start__19220 = function() {
      var or__3824__auto____19219 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, cljs.core.identity, p));
      if(cljs.core.truth_(or__3824__auto____19219)) {
        return or__3824__auto____19219
      }else {
        return o__19217
      }
    }() + 1;
    var delete__19221 = cljs.core.not_EQ_.call(null, start__19220, c__19218);
    var dest__19222 = delete__19221 ? start__19220 + 1 : c__19218 + 1;
    return cljs.core.PersistentVector.fromArray([delete__19221, start__19220, c__19218, dest__19222], true)
  }
};
goog.exportSymbol("subpar.core.close_expression_vals", subpar.core.close_expression_vals);
subpar.core.get_start_of_next_list = function get_start_of_next_list(s, i) {
  var p__19226 = subpar.core.parse.call(null, s);
  var r__19228 = cljs.core.first.call(null, subpar.core.get_siblings.call(null, i, cljs.core.keys, function(p1__19206_SHARP_) {
    var and__3822__auto____19227 = p1__19206_SHARP_ >= i;
    if(and__3822__auto____19227) {
      return cljs.core.get_in.call(null, p__19226, cljs.core.PersistentVector.fromArray(["\ufdd0'families", p1__19206_SHARP_], true))
    }else {
      return and__3822__auto____19227
    }
  }, p__19226));
  if(r__19228 == null) {
    return false
  }else {
    return r__19228
  }
};
subpar.core.forward_down_fn = function forward_down_fn(s, i) {
  var r__19231 = subpar.core.get_start_of_next_list.call(null, s, i);
  if(cljs.core.truth_(r__19231)) {
    return r__19231 + 1
  }else {
    return i
  }
};
goog.exportSymbol("subpar.core.forward_down_fn", subpar.core.forward_down_fn);
subpar.core.backward_fn = function backward_fn(s, i) {
  var p__19237 = subpar.core.parse.call(null, s);
  var b__19238 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.keys, function(p1__19229_SHARP_) {
    return p1__19229_SHARP_ < i
  }, p__19237));
  var o__19239 = subpar.core.get_opening_delimiter_index_with_parse.call(null, p__19237, i);
  var or__3824__auto____19240 = b__19238;
  if(cljs.core.truth_(or__3824__auto____19240)) {
    return or__3824__auto____19240
  }else {
    if(o__19239 < 0) {
      return 0
    }else {
      return o__19239
    }
  }
};
goog.exportSymbol("subpar.core.backward_fn", subpar.core.backward_fn);
subpar.core.backward_down_fn = function backward_down_fn(s, i) {
  var p__19245 = subpar.core.parse.call(null, s);
  var b__19247 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, function(p1__19232_SHARP_) {
    var and__3822__auto____19246 = p1__19232_SHARP_ < i;
    if(and__3822__auto____19246) {
      return subpar.core.closes_list_QMARK_.call(null, p__19245, p1__19232_SHARP_)
    }else {
      return and__3822__auto____19246
    }
  }, p__19245));
  var or__3824__auto____19248 = b__19247;
  if(cljs.core.truth_(or__3824__auto____19248)) {
    return or__3824__auto____19248
  }else {
    return i
  }
};
goog.exportSymbol("subpar.core.backward_down_fn", subpar.core.backward_down_fn);
subpar.core.forward_up_fn = function forward_up_fn(s, i) {
  var p__19257 = subpar.core.parse.call(null, s);
  var vec__19256__19258 = subpar.core.get_wrapper.call(null, p__19257, i);
  var o__19259 = cljs.core.nth.call(null, vec__19256__19258, 0, null);
  var c__19260 = cljs.core.nth.call(null, vec__19256__19258, 1, null);
  var in_list__19261 = cljs.core.not_EQ_.call(null, -1, o__19259);
  if(in_list__19261) {
    return c__19260 + 1
  }else {
    return i
  }
};
goog.exportSymbol("subpar.core.forward_up_fn", subpar.core.forward_up_fn);
subpar.core.forward_fn = function forward_fn(s, i) {
  var p__19267 = subpar.core.parse.call(null, s);
  var b__19268 = cljs.core.first.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, function(p1__19249_SHARP_) {
    return p1__19249_SHARP_ >= i
  }, p__19267));
  var c__19269 = subpar.core.get_closing_delimiter_index_with_parse.call(null, p__19267, i);
  var l__19270 = cljs.core.count.call(null, s);
  if(cljs.core.truth_(b__19268)) {
    return b__19268 + 1
  }else {
    if(cljs.core.truth_(c__19269)) {
      return c__19269 + 1 < l__19270 ? c__19269 + 1 : l__19270
    }else {
      if(true) {
        return l__19270
      }else {
        return null
      }
    }
  }
};
goog.exportSymbol("subpar.core.forward_fn", subpar.core.forward_fn);
subpar.core.forward_slurp_vals = function forward_slurp_vals(s, i) {
  var p__19285 = subpar.core.parse.call(null, s);
  var vec__19284__19286 = subpar.core.get_wrapper.call(null, p__19285, i);
  var o__19287 = cljs.core.nth.call(null, vec__19284__19286, 0, null);
  var c__19288 = cljs.core.nth.call(null, vec__19284__19286, 1, null);
  var in_list__19289 = cljs.core.not_EQ_.call(null, -1, o__19287);
  var a__19291 = function() {
    var and__3822__auto____19290 = in_list__19289;
    if(and__3822__auto____19290) {
      return cljs.core.nth.call(null, s, c__19288, false)
    }else {
      return and__3822__auto____19290
    }
  }();
  var d__19293 = function() {
    var and__3822__auto____19292 = in_list__19289;
    if(and__3822__auto____19292) {
      return cljs.core.first.call(null, subpar.core.get_siblings.call(null, o__19287, cljs.core.vals, function(p1__19262_SHARP_) {
        return p1__19262_SHARP_ > c__19288
      }, p__19285))
    }else {
      return and__3822__auto____19292
    }
  }();
  if(cljs.core.truth_(function() {
    var and__3822__auto____19294 = a__19291;
    if(cljs.core.truth_(and__3822__auto____19294)) {
      var and__3822__auto____19295 = c__19288;
      if(cljs.core.truth_(and__3822__auto____19295)) {
        return d__19293
      }else {
        return and__3822__auto____19295
      }
    }else {
      return and__3822__auto____19294
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([a__19291, c__19288, d__19293 + 1, subpar.core.count_lines.call(null, s, o__19287, d__19293 + 1)], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
goog.exportSymbol("subpar.core.forward_slurp_vals", subpar.core.forward_slurp_vals);
subpar.core.backward_slurp_vals = function backward_slurp_vals(s, i) {
  var p__19308 = subpar.core.parse.call(null, s);
  var vec__19307__19309 = subpar.core.get_wrapper.call(null, p__19308, i);
  var o__19310 = cljs.core.nth.call(null, vec__19307__19309, 0, null);
  var c__19311 = cljs.core.nth.call(null, vec__19307__19309, 1, null);
  var in_list__19312 = cljs.core.not_EQ_.call(null, -1, o__19310);
  var d__19314 = function() {
    var and__3822__auto____19313 = in_list__19312;
    if(and__3822__auto____19313) {
      return cljs.core.last.call(null, subpar.core.get_siblings.call(null, o__19310, cljs.core.keys, function(p1__19271_SHARP_) {
        return p1__19271_SHARP_ < o__19310
      }, p__19308))
    }else {
      return and__3822__auto____19313
    }
  }();
  var a__19316 = function() {
    var and__3822__auto____19315 = in_list__19312;
    if(and__3822__auto____19315) {
      return cljs.core.nth.call(null, s, o__19310, false)
    }else {
      return and__3822__auto____19315
    }
  }();
  if(cljs.core.truth_(function() {
    var and__3822__auto____19317 = a__19316;
    if(cljs.core.truth_(and__3822__auto____19317)) {
      return d__19314
    }else {
      return and__3822__auto____19317
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([a__19316, o__19310, d__19314, subpar.core.count_lines.call(null, s, d__19314, c__19311)], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
goog.exportSymbol("subpar.core.backward_slurp_vals", subpar.core.backward_slurp_vals);
subpar.core.forward_barf_vals = function forward_barf_vals(s, i) {
  var p__19333 = subpar.core.parse.call(null, s);
  var vec__19332__19334 = subpar.core.get_wrapper.call(null, p__19333, i);
  var o__19335 = cljs.core.nth.call(null, vec__19332__19334, 0, null);
  var c__19336 = cljs.core.nth.call(null, vec__19332__19334, 1, null);
  var in_list__19337 = cljs.core.not_EQ_.call(null, -1, o__19335);
  var endings__19339 = function() {
    var and__3822__auto____19338 = in_list__19337;
    if(and__3822__auto____19338) {
      return subpar.core.get_siblings.call(null, i, cljs.core.vals, cljs.core.constantly.call(null, true), p__19333)
    }else {
      return and__3822__auto____19338
    }
  }();
  var a__19342 = function() {
    var and__3822__auto____19340 = c__19336;
    if(cljs.core.truth_(and__3822__auto____19340)) {
      var and__3822__auto____19341 = in_list__19337;
      if(and__3822__auto____19341) {
        return cljs.core.nth.call(null, s, c__19336, null)
      }else {
        return and__3822__auto____19341
      }
    }else {
      return and__3822__auto____19340
    }
  }();
  var r__19344 = function() {
    var or__3824__auto____19343 = subpar.core.count_lines.call(null, s, o__19335, c__19336);
    if(cljs.core.truth_(or__3824__auto____19343)) {
      return or__3824__auto____19343
    }else {
      return 1
    }
  }();
  var num__19345 = cljs.core.truth_(endings__19339) ? cljs.core.count.call(null, endings__19339) : 0;
  if(num__19345 > 1) {
    return cljs.core.PersistentVector.fromArray([a__19342, c__19336, cljs.core.nth.call(null, endings__19339, num__19345 - 2) + 1, false, r__19344, o__19335], true)
  }else {
    if(cljs.core._EQ_.call(null, num__19345, 1)) {
      return cljs.core.PersistentVector.fromArray([a__19342, c__19336, o__19335 + 1, true, r__19344, o__19335], true)
    }else {
      if(true) {
        return cljs.core.PersistentVector.EMPTY
      }else {
        return null
      }
    }
  }
};
goog.exportSymbol("subpar.core.forward_barf_vals", subpar.core.forward_barf_vals);
subpar.core.backward_barf_vals = function backward_barf_vals(s, i) {
  var p__19361 = subpar.core.parse.call(null, s);
  var vec__19360__19362 = subpar.core.get_wrapper.call(null, p__19361, i);
  var o__19363 = cljs.core.nth.call(null, vec__19360__19362, 0, null);
  var c__19364 = cljs.core.nth.call(null, vec__19360__19362, 1, null);
  var in_list__19365 = cljs.core.not_EQ_.call(null, -1, o__19363);
  var starts__19367 = function() {
    var and__3822__auto____19366 = in_list__19365;
    if(and__3822__auto____19366) {
      return subpar.core.get_siblings.call(null, i, cljs.core.keys, cljs.core.constantly.call(null, true), p__19361)
    }else {
      return and__3822__auto____19366
    }
  }();
  var a__19370 = function() {
    var and__3822__auto____19368 = o__19363;
    if(cljs.core.truth_(and__3822__auto____19368)) {
      var and__3822__auto____19369 = in_list__19365;
      if(and__3822__auto____19369) {
        return cljs.core.nth.call(null, s, o__19363, null)
      }else {
        return and__3822__auto____19369
      }
    }else {
      return and__3822__auto____19368
    }
  }();
  var r__19372 = function() {
    var or__3824__auto____19371 = subpar.core.count_lines.call(null, s, o__19363, c__19364);
    if(cljs.core.truth_(or__3824__auto____19371)) {
      return or__3824__auto____19371
    }else {
      return 1
    }
  }();
  var num__19373 = cljs.core.truth_(starts__19367) ? cljs.core.count.call(null, starts__19367) : 0;
  if(num__19373 > 1) {
    return cljs.core.PersistentVector.fromArray([a__19370, o__19363, cljs.core.second.call(null, starts__19367), false, r__19372], true)
  }else {
    if(cljs.core._EQ_.call(null, num__19373, 1)) {
      return cljs.core.PersistentVector.fromArray([a__19370, o__19363, c__19364, true, r__19372], true)
    }else {
      if(true) {
        return cljs.core.PersistentVector.EMPTY
      }else {
        return null
      }
    }
  }
};
goog.exportSymbol("subpar.core.backward_barf_vals", subpar.core.backward_barf_vals);
subpar.core.splice_vals = function splice_vals(s, i) {
  var p__19386 = subpar.core.parse.call(null, s);
  var vec__19385__19387 = subpar.core.get_wrapper.call(null, p__19386, i);
  var o__19388 = cljs.core.nth.call(null, vec__19385__19387, 0, null);
  var c__19389 = cljs.core.nth.call(null, vec__19385__19387, 1, null);
  var in_list__19390 = cljs.core.not_EQ_.call(null, -1, o__19388);
  if(in_list__19390) {
    var vec__19391__19392 = subpar.core.get_wrapper.call(null, p__19386, o__19388);
    var n__19393 = cljs.core.nth.call(null, vec__19391__19392, 0, null);
    var d__19394 = cljs.core.nth.call(null, vec__19391__19392, 1, null);
    var r__19395 = subpar.core.count_lines.call(null, s, n__19393, d__19394);
    return[o__19388, c__19389, 0 > n__19393 ? 0 : n__19393, r__19395]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.splice_vals", subpar.core.splice_vals);
subpar.core.splice_killing_backward = function splice_killing_backward(s, i) {
  var p__19408 = subpar.core.parse.call(null, s);
  var vec__19407__19409 = subpar.core.get_wrapper.call(null, p__19408, i);
  var o__19410 = cljs.core.nth.call(null, vec__19407__19409, 0, null);
  var c__19411 = cljs.core.nth.call(null, vec__19407__19409, 1, null);
  var in_list__19412 = cljs.core.not_EQ_.call(null, -1, o__19410);
  if(in_list__19412) {
    var vec__19413__19414 = subpar.core.get_wrapper.call(null, p__19408, o__19410);
    var n__19415 = cljs.core.nth.call(null, vec__19413__19414, 0, null);
    var d__19416 = cljs.core.nth.call(null, vec__19413__19414, 1, null);
    var r__19417 = subpar.core.count_lines.call(null, s, n__19415, d__19416);
    return[o__19410, o__19410 > i ? o__19410 : i, c__19411, 0 > n__19415 ? 0 : n__19415, r__19417]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.splice_killing_backward", subpar.core.splice_killing_backward);
subpar.core.splice_killing_forward = function splice_killing_forward(s, i) {
  var p__19430 = subpar.core.parse.call(null, s);
  var vec__19429__19431 = subpar.core.get_wrapper.call(null, p__19430, i);
  var o__19432 = cljs.core.nth.call(null, vec__19429__19431, 0, null);
  var c__19433 = cljs.core.nth.call(null, vec__19429__19431, 1, null);
  var in_list__19434 = cljs.core.not_EQ_.call(null, -1, o__19432);
  if(in_list__19434) {
    var vec__19435__19436 = subpar.core.get_wrapper.call(null, p__19430, o__19432);
    var n__19437 = cljs.core.nth.call(null, vec__19435__19436, 0, null);
    var d__19438 = cljs.core.nth.call(null, vec__19435__19436, 1, null);
    var r__19439 = subpar.core.count_lines.call(null, s, n__19437, d__19438);
    return[o__19432, i, c__19433 + 1, 0 > n__19437 ? 0 : n__19437, r__19439]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.splice_killing_forward", subpar.core.splice_killing_forward);
subpar.core.parse = function parse(ss) {
  var s__19478 = [cljs.core.str(ss), cljs.core.str(" ")].join("");
  var i__19479 = 0;
  var mode__19480 = subpar.core.code;
  var openings__19481 = cljs.core.list.call(null, -1);
  var start__19482 = -1;
  var t__19483 = cljs.core.PersistentVector.EMPTY;
  var families__19484 = cljs.core.PersistentArrayMap.fromArrays([-1], [cljs.core.ObjMap.fromObject(["\ufdd0'children"], {"\ufdd0'children":cljs.core.ObjMap.EMPTY})]);
  var escaping__19485 = false;
  var in_word__19486 = false;
  while(true) {
    var a__19487 = cljs.core.nth.call(null, s__19478, i__19479, null);
    var j__19488 = i__19479 + 1;
    var o__19489 = cljs.core.peek.call(null, openings__19481);
    if(cljs.core.truth_(function() {
      var and__3822__auto____19490 = a__19487 == null;
      if(and__3822__auto____19490) {
        return in_word__19486
      }else {
        return and__3822__auto____19490
      }
    }())) {
      return cljs.core.ObjMap.fromObject(["\ufdd0'chars", "\ufdd0'families"], {"\ufdd0'chars":t__19483, "\ufdd0'families":cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([-1, "\ufdd0'closer"], true), i__19479 - 1), cljs.core.PersistentVector.fromArray([-1, "\ufdd0'children", start__19482], true), i__19479 - 1)})
    }else {
      if(a__19487 == null) {
        return cljs.core.ObjMap.fromObject(["\ufdd0'chars", "\ufdd0'families"], {"\ufdd0'chars":t__19483, "\ufdd0'families":cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([-1, "\ufdd0'closer"], true), i__19479 - 1)})
      }else {
        if(function() {
          var and__3822__auto____19491 = cljs.core.not_EQ_.call(null, subpar.core.cmmnt, mode__19480);
          if(and__3822__auto____19491) {
            var and__3822__auto____19492 = cljs.core._EQ_.call(null, "\\", a__19487);
            if(and__3822__auto____19492) {
              var and__3822__auto____19493 = cljs.core.not.call(null, escaping__19485);
              if(and__3822__auto____19493) {
                return cljs.core.not.call(null, in_word__19486)
              }else {
                return and__3822__auto____19493
              }
            }else {
              return and__3822__auto____19492
            }
          }else {
            return and__3822__auto____19491
          }
        }()) {
          var G__19516 = j__19488;
          var G__19517 = mode__19480;
          var G__19518 = openings__19481;
          var G__19519 = i__19479;
          var G__19520 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
          var G__19521 = cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'children", i__19479], true), j__19488);
          var G__19522 = true;
          var G__19523 = true;
          i__19479 = G__19516;
          mode__19480 = G__19517;
          openings__19481 = G__19518;
          start__19482 = G__19519;
          t__19483 = G__19520;
          families__19484 = G__19521;
          escaping__19485 = G__19522;
          in_word__19486 = G__19523;
          continue
        }else {
          if(function() {
            var and__3822__auto____19494 = cljs.core.not_EQ_.call(null, subpar.core.cmmnt, mode__19480);
            if(and__3822__auto____19494) {
              var and__3822__auto____19495 = cljs.core._EQ_.call(null, "\\", a__19487);
              if(and__3822__auto____19495) {
                return cljs.core.not.call(null, escaping__19485)
              }else {
                return and__3822__auto____19495
              }
            }else {
              return and__3822__auto____19494
            }
          }()) {
            var G__19524 = j__19488;
            var G__19525 = mode__19480;
            var G__19526 = openings__19481;
            var G__19527 = i__19479;
            var G__19528 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
            var G__19529 = families__19484;
            var G__19530 = true;
            var G__19531 = true;
            i__19479 = G__19524;
            mode__19480 = G__19525;
            openings__19481 = G__19526;
            start__19482 = G__19527;
            t__19483 = G__19528;
            families__19484 = G__19529;
            escaping__19485 = G__19530;
            in_word__19486 = G__19531;
            continue
          }else {
            if(function() {
              var and__3822__auto____19496 = cljs.core._EQ_.call(null, subpar.core.code, mode__19480);
              if(and__3822__auto____19496) {
                var and__3822__auto____19497 = cljs.core._EQ_.call(null, ";", a__19487);
                if(and__3822__auto____19497) {
                  return cljs.core.not.call(null, escaping__19485)
                }else {
                  return and__3822__auto____19497
                }
              }else {
                return and__3822__auto____19496
              }
            }()) {
              var G__19532 = j__19488;
              var G__19533 = subpar.core.cmmnt;
              var G__19534 = openings__19481;
              var G__19535 = start__19482;
              var G__19536 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
              var G__19537 = families__19484;
              var G__19538 = false;
              var G__19539 = false;
              i__19479 = G__19532;
              mode__19480 = G__19533;
              openings__19481 = G__19534;
              start__19482 = G__19535;
              t__19483 = G__19536;
              families__19484 = G__19537;
              escaping__19485 = G__19538;
              in_word__19486 = G__19539;
              continue
            }else {
              if(function() {
                var and__3822__auto____19498 = cljs.core._EQ_.call(null, subpar.core.cmmnt, mode__19480);
                if(and__3822__auto____19498) {
                  return cljs.core._EQ_.call(null, "\n", a__19487)
                }else {
                  return and__3822__auto____19498
                }
              }()) {
                var G__19540 = j__19488;
                var G__19541 = subpar.core.code;
                var G__19542 = openings__19481;
                var G__19543 = start__19482;
                var G__19544 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                var G__19545 = families__19484;
                var G__19546 = false;
                var G__19547 = false;
                i__19479 = G__19540;
                mode__19480 = G__19541;
                openings__19481 = G__19542;
                start__19482 = G__19543;
                t__19483 = G__19544;
                families__19484 = G__19545;
                escaping__19485 = G__19546;
                in_word__19486 = G__19547;
                continue
              }else {
                if(cljs.core._EQ_.call(null, subpar.core.cmmnt, mode__19480)) {
                  var G__19548 = j__19488;
                  var G__19549 = subpar.core.cmmnt;
                  var G__19550 = openings__19481;
                  var G__19551 = start__19482;
                  var G__19552 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                  var G__19553 = families__19484;
                  var G__19554 = false;
                  var G__19555 = false;
                  i__19479 = G__19548;
                  mode__19480 = G__19549;
                  openings__19481 = G__19550;
                  start__19482 = G__19551;
                  t__19483 = G__19552;
                  families__19484 = G__19553;
                  escaping__19485 = G__19554;
                  in_word__19486 = G__19555;
                  continue
                }else {
                  if(function() {
                    var and__3822__auto____19499 = cljs.core._EQ_.call(null, subpar.core.code, mode__19480);
                    if(and__3822__auto____19499) {
                      var and__3822__auto____19500 = cljs.core._EQ_.call(null, '"', a__19487);
                      if(and__3822__auto____19500) {
                        return cljs.core.not.call(null, escaping__19485)
                      }else {
                        return and__3822__auto____19500
                      }
                    }else {
                      return and__3822__auto____19499
                    }
                  }()) {
                    var G__19556 = j__19488;
                    var G__19557 = subpar.core.string;
                    var G__19558 = cljs.core.conj.call(null, openings__19481, i__19479);
                    var G__19559 = -1;
                    var G__19560 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                    var G__19561 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([i__19479, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY), cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'children", i__19479], true), j__19488);
                    var G__19562 = false;
                    var G__19563 = false;
                    i__19479 = G__19556;
                    mode__19480 = G__19557;
                    openings__19481 = G__19558;
                    start__19482 = G__19559;
                    t__19483 = G__19560;
                    families__19484 = G__19561;
                    escaping__19485 = G__19562;
                    in_word__19486 = G__19563;
                    continue
                  }else {
                    if(cljs.core.truth_(function() {
                      var and__3822__auto____19501 = cljs.core._EQ_.call(null, subpar.core.string, mode__19480);
                      if(and__3822__auto____19501) {
                        var and__3822__auto____19502 = cljs.core._EQ_.call(null, '"', a__19487);
                        if(and__3822__auto____19502) {
                          var and__3822__auto____19503 = cljs.core.not.call(null, escaping__19485);
                          if(and__3822__auto____19503) {
                            return in_word__19486
                          }else {
                            return and__3822__auto____19503
                          }
                        }else {
                          return and__3822__auto____19502
                        }
                      }else {
                        return and__3822__auto____19501
                      }
                    }())) {
                      var G__19564 = j__19488;
                      var G__19565 = subpar.core.code;
                      var G__19566 = cljs.core.pop.call(null, openings__19481);
                      var G__19567 = -1;
                      var G__19568 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                      var G__19569 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'closer"], true), i__19479), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__19481), "\ufdd0'children", o__19489], true), i__19479), cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'children", start__19482], true), i__19479 - 1);
                      var G__19570 = false;
                      var G__19571 = false;
                      i__19479 = G__19564;
                      mode__19480 = G__19565;
                      openings__19481 = G__19566;
                      start__19482 = G__19567;
                      t__19483 = G__19568;
                      families__19484 = G__19569;
                      escaping__19485 = G__19570;
                      in_word__19486 = G__19571;
                      continue
                    }else {
                      if(function() {
                        var and__3822__auto____19504 = cljs.core._EQ_.call(null, subpar.core.string, mode__19480);
                        if(and__3822__auto____19504) {
                          var and__3822__auto____19505 = cljs.core._EQ_.call(null, '"', a__19487);
                          if(and__3822__auto____19505) {
                            return cljs.core.not.call(null, escaping__19485)
                          }else {
                            return and__3822__auto____19505
                          }
                        }else {
                          return and__3822__auto____19504
                        }
                      }()) {
                        var G__19572 = j__19488;
                        var G__19573 = subpar.core.code;
                        var G__19574 = cljs.core.pop.call(null, openings__19481);
                        var G__19575 = -1;
                        var G__19576 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                        var G__19577 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'closer"], true), i__19479), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__19481), "\ufdd0'children", o__19489], true), i__19479);
                        var G__19578 = false;
                        var G__19579 = false;
                        i__19479 = G__19572;
                        mode__19480 = G__19573;
                        openings__19481 = G__19574;
                        start__19482 = G__19575;
                        t__19483 = G__19576;
                        families__19484 = G__19577;
                        escaping__19485 = G__19578;
                        in_word__19486 = G__19579;
                        continue
                      }else {
                        if(function() {
                          var and__3822__auto____19506 = cljs.core._EQ_.call(null, subpar.core.string, mode__19480);
                          if(and__3822__auto____19506) {
                            var and__3822__auto____19507 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__19487));
                            if(and__3822__auto____19507) {
                              return cljs.core.not.call(null, in_word__19486)
                            }else {
                              return and__3822__auto____19507
                            }
                          }else {
                            return and__3822__auto____19506
                          }
                        }()) {
                          var G__19580 = j__19488;
                          var G__19581 = subpar.core.string;
                          var G__19582 = openings__19481;
                          var G__19583 = i__19479;
                          var G__19584 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                          var G__19585 = cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'children", i__19479], true), i__19479);
                          var G__19586 = false;
                          var G__19587 = true;
                          i__19479 = G__19580;
                          mode__19480 = G__19581;
                          openings__19481 = G__19582;
                          start__19482 = G__19583;
                          t__19483 = G__19584;
                          families__19484 = G__19585;
                          escaping__19485 = G__19586;
                          in_word__19486 = G__19587;
                          continue
                        }else {
                          if(cljs.core.truth_(function() {
                            var and__3822__auto____19508 = cljs.core._EQ_.call(null, subpar.core.string, mode__19480);
                            if(and__3822__auto____19508) {
                              var and__3822__auto____19509 = subpar.core.whitespace_QMARK_.call(null, a__19487);
                              if(cljs.core.truth_(and__3822__auto____19509)) {
                                return in_word__19486
                              }else {
                                return and__3822__auto____19509
                              }
                            }else {
                              return and__3822__auto____19508
                            }
                          }())) {
                            var G__19588 = j__19488;
                            var G__19589 = subpar.core.string;
                            var G__19590 = openings__19481;
                            var G__19591 = -1;
                            var G__19592 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                            var G__19593 = cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'children", start__19482], true), i__19479 - 1);
                            var G__19594 = false;
                            var G__19595 = false;
                            i__19479 = G__19588;
                            mode__19480 = G__19589;
                            openings__19481 = G__19590;
                            start__19482 = G__19591;
                            t__19483 = G__19592;
                            families__19484 = G__19593;
                            escaping__19485 = G__19594;
                            in_word__19486 = G__19595;
                            continue
                          }else {
                            if(cljs.core._EQ_.call(null, subpar.core.string, mode__19480)) {
                              var G__19596 = j__19488;
                              var G__19597 = subpar.core.string;
                              var G__19598 = openings__19481;
                              var G__19599 = start__19482;
                              var G__19600 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                              var G__19601 = families__19484;
                              var G__19602 = false;
                              var G__19603 = in_word__19486;
                              i__19479 = G__19596;
                              mode__19480 = G__19597;
                              openings__19481 = G__19598;
                              start__19482 = G__19599;
                              t__19483 = G__19600;
                              families__19484 = G__19601;
                              escaping__19485 = G__19602;
                              in_word__19486 = G__19603;
                              continue
                            }else {
                              if(cljs.core.truth_(function() {
                                var and__3822__auto____19510 = subpar.core.opener_QMARK_.call(null, a__19487);
                                if(cljs.core.truth_(and__3822__auto____19510)) {
                                  return in_word__19486
                                }else {
                                  return and__3822__auto____19510
                                }
                              }())) {
                                var G__19604 = j__19488;
                                var G__19605 = subpar.core.code;
                                var G__19606 = cljs.core.conj.call(null, openings__19481, i__19479);
                                var G__19607 = -1;
                                var G__19608 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                                var G__19609 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'children", start__19482], true), i__19479 - 1), cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'children", i__19479], true), i__19479), cljs.core.PersistentVector.fromArray([i__19479, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY);
                                var G__19610 = false;
                                var G__19611 = false;
                                i__19479 = G__19604;
                                mode__19480 = G__19605;
                                openings__19481 = G__19606;
                                start__19482 = G__19607;
                                t__19483 = G__19608;
                                families__19484 = G__19609;
                                escaping__19485 = G__19610;
                                in_word__19486 = G__19611;
                                continue
                              }else {
                                if(cljs.core.truth_(subpar.core.opener_QMARK_.call(null, a__19487))) {
                                  var G__19612 = j__19488;
                                  var G__19613 = subpar.core.code;
                                  var G__19614 = cljs.core.conj.call(null, openings__19481, i__19479);
                                  var G__19615 = -1;
                                  var G__19616 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                                  var G__19617 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'children", i__19479], true), i__19479), cljs.core.PersistentVector.fromArray([i__19479, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY);
                                  var G__19618 = false;
                                  var G__19619 = false;
                                  i__19479 = G__19612;
                                  mode__19480 = G__19613;
                                  openings__19481 = G__19614;
                                  start__19482 = G__19615;
                                  t__19483 = G__19616;
                                  families__19484 = G__19617;
                                  escaping__19485 = G__19618;
                                  in_word__19486 = G__19619;
                                  continue
                                }else {
                                  if(cljs.core.truth_(function() {
                                    var and__3822__auto____19511 = subpar.core.closer_QMARK_.call(null, a__19487);
                                    if(cljs.core.truth_(and__3822__auto____19511)) {
                                      return in_word__19486
                                    }else {
                                      return and__3822__auto____19511
                                    }
                                  }())) {
                                    var G__19620 = j__19488;
                                    var G__19621 = subpar.core.code;
                                    var G__19622 = cljs.core.pop.call(null, openings__19481);
                                    var G__19623 = -1;
                                    var G__19624 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                                    var G__19625 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'children", start__19482], true), i__19479 - 1), cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'closer"], true), i__19479), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__19481), "\ufdd0'children", o__19489], true), i__19479);
                                    var G__19626 = false;
                                    var G__19627 = false;
                                    i__19479 = G__19620;
                                    mode__19480 = G__19621;
                                    openings__19481 = G__19622;
                                    start__19482 = G__19623;
                                    t__19483 = G__19624;
                                    families__19484 = G__19625;
                                    escaping__19485 = G__19626;
                                    in_word__19486 = G__19627;
                                    continue
                                  }else {
                                    if(cljs.core.truth_(subpar.core.closer_QMARK_.call(null, a__19487))) {
                                      var G__19628 = j__19488;
                                      var G__19629 = subpar.core.code;
                                      var G__19630 = cljs.core.pop.call(null, openings__19481);
                                      var G__19631 = -1;
                                      var G__19632 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                                      var G__19633 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'closer"], true), i__19479), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__19481), "\ufdd0'children", o__19489], true), i__19479);
                                      var G__19634 = false;
                                      var G__19635 = false;
                                      i__19479 = G__19628;
                                      mode__19480 = G__19629;
                                      openings__19481 = G__19630;
                                      start__19482 = G__19631;
                                      t__19483 = G__19632;
                                      families__19484 = G__19633;
                                      escaping__19485 = G__19634;
                                      in_word__19486 = G__19635;
                                      continue
                                    }else {
                                      if(function() {
                                        var and__3822__auto____19512 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__19487));
                                        if(and__3822__auto____19512) {
                                          return cljs.core.not.call(null, in_word__19486)
                                        }else {
                                          return and__3822__auto____19512
                                        }
                                      }()) {
                                        var G__19636 = j__19488;
                                        var G__19637 = subpar.core.code;
                                        var G__19638 = openings__19481;
                                        var G__19639 = i__19479;
                                        var G__19640 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                                        var G__19641 = cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'children", i__19479], true), i__19479);
                                        var G__19642 = false;
                                        var G__19643 = true;
                                        i__19479 = G__19636;
                                        mode__19480 = G__19637;
                                        openings__19481 = G__19638;
                                        start__19482 = G__19639;
                                        t__19483 = G__19640;
                                        families__19484 = G__19641;
                                        escaping__19485 = G__19642;
                                        in_word__19486 = G__19643;
                                        continue
                                      }else {
                                        if(cljs.core.truth_(function() {
                                          var and__3822__auto____19513 = subpar.core.whitespace_QMARK_.call(null, a__19487);
                                          if(cljs.core.truth_(and__3822__auto____19513)) {
                                            return in_word__19486
                                          }else {
                                            return and__3822__auto____19513
                                          }
                                        }())) {
                                          var G__19644 = j__19488;
                                          var G__19645 = subpar.core.code;
                                          var G__19646 = openings__19481;
                                          var G__19647 = -1;
                                          var G__19648 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                                          var G__19649 = cljs.core.assoc_in.call(null, families__19484, cljs.core.PersistentVector.fromArray([o__19489, "\ufdd0'children", start__19482], true), i__19479 - 1);
                                          var G__19650 = false;
                                          var G__19651 = false;
                                          i__19479 = G__19644;
                                          mode__19480 = G__19645;
                                          openings__19481 = G__19646;
                                          start__19482 = G__19647;
                                          t__19483 = G__19648;
                                          families__19484 = G__19649;
                                          escaping__19485 = G__19650;
                                          in_word__19486 = G__19651;
                                          continue
                                        }else {
                                          if(cljs.core.truth_(function() {
                                            var and__3822__auto____19514 = subpar.core.whitespace_QMARK_.call(null, a__19487);
                                            if(cljs.core.truth_(and__3822__auto____19514)) {
                                              return cljs.core.not.call(null, in_word__19486)
                                            }else {
                                              return and__3822__auto____19514
                                            }
                                          }())) {
                                            var G__19652 = j__19488;
                                            var G__19653 = subpar.core.code;
                                            var G__19654 = openings__19481;
                                            var G__19655 = -1;
                                            var G__19656 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                                            var G__19657 = families__19484;
                                            var G__19658 = false;
                                            var G__19659 = false;
                                            i__19479 = G__19652;
                                            mode__19480 = G__19653;
                                            openings__19481 = G__19654;
                                            start__19482 = G__19655;
                                            t__19483 = G__19656;
                                            families__19484 = G__19657;
                                            escaping__19485 = G__19658;
                                            in_word__19486 = G__19659;
                                            continue
                                          }else {
                                            if(cljs.core.truth_(function() {
                                              var and__3822__auto____19515 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__19487));
                                              if(and__3822__auto____19515) {
                                                return in_word__19486
                                              }else {
                                                return and__3822__auto____19515
                                              }
                                            }())) {
                                              var G__19660 = j__19488;
                                              var G__19661 = subpar.core.code;
                                              var G__19662 = openings__19481;
                                              var G__19663 = start__19482;
                                              var G__19664 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray([mode__19480, o__19489], true));
                                              var G__19665 = families__19484;
                                              var G__19666 = false;
                                              var G__19667 = true;
                                              i__19479 = G__19660;
                                              mode__19480 = G__19661;
                                              openings__19481 = G__19662;
                                              start__19482 = G__19663;
                                              t__19483 = G__19664;
                                              families__19484 = G__19665;
                                              escaping__19485 = G__19666;
                                              in_word__19486 = G__19667;
                                              continue
                                            }else {
                                              if("\ufdd0'default") {
                                                var G__19668 = j__19488;
                                                var G__19669 = subpar.core.code;
                                                var G__19670 = openings__19481;
                                                var G__19671 = start__19482;
                                                var G__19672 = cljs.core.conj.call(null, t__19483, cljs.core.PersistentVector.fromArray(["?", o__19489], true));
                                                var G__19673 = families__19484;
                                                var G__19674 = escaping__19485;
                                                var G__19675 = in_word__19486;
                                                i__19479 = G__19668;
                                                mode__19480 = G__19669;
                                                openings__19481 = G__19670;
                                                start__19482 = G__19671;
                                                t__19483 = G__19672;
                                                families__19484 = G__19673;
                                                escaping__19485 = G__19674;
                                                in_word__19486 = G__19675;
                                                continue
                                              }else {
                                                return null
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    break
  }
};
subpar.core.open_expression = function open_expression(cm, pair) {
  var vec__19681__19682 = subpar.core.get_info.call(null, cm);
  var cur__19683 = cljs.core.nth.call(null, vec__19681__19682, 0, null);
  var i__19684 = cljs.core.nth.call(null, vec__19681__19682, 1, null);
  var s__19685 = cljs.core.nth.call(null, vec__19681__19682, 2, null);
  if(cljs.core.truth_(subpar.core.in_string.call(null, s__19685, i__19684))) {
    cm.replaceRange(cljs.core.nth.call(null, pair, 0), cur__19683);
    return cm.setCursor(cur__19683.line, cur__19683.ch + 1)
  }else {
    return cm.compoundChange(function() {
      cm.replaceRange(pair, cur__19683);
      cm.setCursor(cur__19683.line, cur__19683.ch + 1);
      return cm.indentLine(cur__19683.line)
    })
  }
};
goog.exportSymbol("subpar.core.open_expression", subpar.core.open_expression);
subpar.core.forward_delete = function forward_delete(cm) {
  if(cljs.core.truth_(subpar.core.nothing_selected_QMARK_.call(null, cm))) {
    var vec__19703__19704 = subpar.core.get_info.call(null, cm);
    var cur__19705 = cljs.core.nth.call(null, vec__19703__19704, 0, null);
    var i__19706 = cljs.core.nth.call(null, vec__19703__19704, 1, null);
    var s__19707 = cljs.core.nth.call(null, vec__19703__19704, 2, null);
    var act__19708 = subpar.core.forward_delete_action.call(null, s__19707, i__19706);
    var s1__19709 = cm.posFromIndex(i__19706);
    var e1__19710 = cm.posFromIndex(i__19706 + 1);
    var s2__19711 = cm.posFromIndex(i__19706 - 1);
    var e2__19712 = e1__19710;
    var s3__19713 = s1__19709;
    var e3__19714 = cm.posFromIndex(i__19706 + 2);
    var pred__19715__19718 = cljs.core._EQ_;
    var expr__19716__19719 = act__19708;
    if(pred__19715__19718.call(null, 1, expr__19716__19719)) {
      return cm.replaceRange("", s1__19709, e1__19710)
    }else {
      if(pred__19715__19718.call(null, 2, expr__19716__19719)) {
        return cm.replaceRange("", s2__19711, e2__19712)
      }else {
        if(pred__19715__19718.call(null, 3, expr__19716__19719)) {
          return cm.replaceRange("", s3__19713, e3__19714)
        }else {
          if(pred__19715__19718.call(null, 4, expr__19716__19719)) {
            return cm.setCursor(e1__19710)
          }else {
            throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__19716__19719)].join(""));
          }
        }
      }
    }
  }else {
    return cm.replaceSelection("")
  }
};
goog.exportSymbol("subpar.core.forward_delete", subpar.core.forward_delete);
subpar.core.backward_delete = function backward_delete(cm) {
  if(cljs.core.truth_(subpar.core.nothing_selected_QMARK_.call(null, cm))) {
    var vec__19737__19738 = subpar.core.get_info.call(null, cm);
    var cur__19739 = cljs.core.nth.call(null, vec__19737__19738, 0, null);
    var i__19740 = cljs.core.nth.call(null, vec__19737__19738, 1, null);
    var s__19741 = cljs.core.nth.call(null, vec__19737__19738, 2, null);
    var act__19742 = subpar.core.backward_delete_action.call(null, s__19741, i__19740);
    var s1__19743 = cm.posFromIndex(i__19740 - 1);
    var e1__19744 = cm.posFromIndex(i__19740);
    var s2__19745 = s1__19743;
    var e2__19746 = cm.posFromIndex(i__19740 + 1);
    var s3__19747 = cm.posFromIndex(i__19740 - 2);
    var e3__19748 = e1__19744;
    var pred__19749__19752 = cljs.core._EQ_;
    var expr__19750__19753 = act__19742;
    if(pred__19749__19752.call(null, 1, expr__19750__19753)) {
      return cm.replaceRange("", s1__19743, e1__19744)
    }else {
      if(pred__19749__19752.call(null, 2, expr__19750__19753)) {
        return cm.replaceRange("", s2__19745, e2__19746)
      }else {
        if(pred__19749__19752.call(null, 3, expr__19750__19753)) {
          return cm.replaceRange("", s3__19747, e3__19748)
        }else {
          if(pred__19749__19752.call(null, 4, expr__19750__19753)) {
            return cm.setCursor(s1__19743)
          }else {
            throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__19750__19753)].join(""));
          }
        }
      }
    }
  }else {
    return cm.replaceSelection("")
  }
};
goog.exportSymbol("subpar.core.backward_delete", subpar.core.backward_delete);
subpar.core.double_quote = function double_quote(cm) {
  var vec__19765__19766 = subpar.core.get_info.call(null, cm);
  var cur__19767 = cljs.core.nth.call(null, vec__19765__19766, 0, null);
  var i__19768 = cljs.core.nth.call(null, vec__19765__19766, 1, null);
  var s__19769 = cljs.core.nth.call(null, vec__19765__19766, 2, null);
  var act__19770 = subpar.core.double_quote_action.call(null, s__19769, i__19768);
  var pred__19771__19774 = cljs.core._EQ_;
  var expr__19772__19775 = act__19770;
  if(pred__19771__19774.call(null, 0, expr__19772__19775)) {
    return subpar.core.open_expression.call(null, cm, '""')
  }else {
    if(pred__19771__19774.call(null, 1, expr__19772__19775)) {
      return cm.replaceRange('\\"', cur__19767)
    }else {
      if(pred__19771__19774.call(null, 2, expr__19772__19775)) {
        return subpar.core.go_to_index.call(null, cm, i__19768, i__19768 + 1)
      }else {
        if(pred__19771__19774.call(null, 3, expr__19772__19775)) {
          return cm.replaceRange('"', cur__19767)
        }else {
          throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__19772__19775)].join(""));
        }
      }
    }
  }
};
goog.exportSymbol("subpar.core.double_quote", subpar.core.double_quote);
subpar.core.close_expression = function close_expression(cm, c) {
  var vec__19788__19789 = subpar.core.get_info.call(null, cm);
  var cur__19790 = cljs.core.nth.call(null, vec__19788__19789, 0, null);
  var i__19791 = cljs.core.nth.call(null, vec__19788__19789, 1, null);
  var s__19792 = cljs.core.nth.call(null, vec__19788__19789, 2, null);
  var p__19793 = subpar.core.parse.call(null, s__19792);
  if(cljs.core.truth_(subpar.core.in_string_QMARK_.call(null, p__19793, i__19791))) {
    cm.replaceRange(c, cur__19790);
    return cm.setCursor(cur__19790.line, cur__19790.ch + 1)
  }else {
    var vec__19794__19795 = subpar.core.close_expression_vals.call(null, p__19793, i__19791);
    var del__19796 = cljs.core.nth.call(null, vec__19794__19795, 0, null);
    var beg__19797 = cljs.core.nth.call(null, vec__19794__19795, 1, null);
    var end__19798 = cljs.core.nth.call(null, vec__19794__19795, 2, null);
    var dst__19799 = cljs.core.nth.call(null, vec__19794__19795, 3, null);
    if(cljs.core.truth_(dst__19799)) {
      if(cljs.core.truth_(del__19796)) {
        cm.replaceRange("", cm.posFromIndex(beg__19797), cm.posFromIndex(end__19798))
      }else {
      }
      return subpar.core.go_to_index.call(null, cm, i__19791, dst__19799)
    }else {
      return null
    }
  }
};
goog.exportSymbol("subpar.core.close_expression", subpar.core.close_expression);
subpar.core.go = function go(cm, f) {
  var vec__19806__19807 = subpar.core.get_info.call(null, cm);
  var cur__19808 = cljs.core.nth.call(null, vec__19806__19807, 0, null);
  var i__19809 = cljs.core.nth.call(null, vec__19806__19807, 1, null);
  var s__19810 = cljs.core.nth.call(null, vec__19806__19807, 2, null);
  var j__19811 = f.call(null, s__19810, i__19809);
  return subpar.core.go_to_index.call(null, cm, i__19809, j__19811)
};
subpar.core.backward_up = function backward_up(cm) {
  return subpar.core.go.call(null, cm, subpar.core.backward_up_fn)
};
goog.exportSymbol("subpar.core.backward_up", subpar.core.backward_up);
subpar.core.forward_down = function forward_down(cm) {
  return subpar.core.go.call(null, cm, subpar.core.forward_down_fn)
};
goog.exportSymbol("subpar.core.forward_down", subpar.core.forward_down);
subpar.core.backward = function backward(cm) {
  return subpar.core.go.call(null, cm, subpar.core.backward_fn)
};
goog.exportSymbol("subpar.core.backward", subpar.core.backward);
subpar.core.forward = function forward(cm) {
  return subpar.core.go.call(null, cm, subpar.core.forward_fn)
};
goog.exportSymbol("subpar.core.forward", subpar.core.forward);
subpar.core.backward_down = function backward_down(cm) {
  return subpar.core.go.call(null, cm, subpar.core.backward_down_fn)
};
goog.exportSymbol("subpar.core.backward_down", subpar.core.backward_down);
subpar.core.forward_up = function forward_up(cm) {
  return subpar.core.go.call(null, cm, subpar.core.forward_up_fn)
};
goog.exportSymbol("subpar.core.forward_up", subpar.core.forward_up);
subpar.core.forward_slurp = function forward_slurp(cm) {
  var vec__19830__19832 = subpar.core.get_info.call(null, cm);
  var cur__19833 = cljs.core.nth.call(null, vec__19830__19832, 0, null);
  var i__19834 = cljs.core.nth.call(null, vec__19830__19832, 1, null);
  var s__19835 = cljs.core.nth.call(null, vec__19830__19832, 2, null);
  var vec__19831__19836 = subpar.core.forward_slurp_vals.call(null, s__19835, i__19834);
  var delimiter__19837 = cljs.core.nth.call(null, vec__19831__19836, 0, null);
  var si__19838 = cljs.core.nth.call(null, vec__19831__19836, 1, null);
  var di__19839 = cljs.core.nth.call(null, vec__19831__19836, 2, null);
  var ri__19840 = cljs.core.nth.call(null, vec__19831__19836, 3, null);
  if(cljs.core.truth_(ri__19840)) {
    var start__19841 = cm.posFromIndex(si__19838);
    var end__19842 = cm.posFromIndex(si__19838 + 1);
    var destination__19843 = cm.posFromIndex(di__19839);
    var line__19844 = start__19841.line;
    var update__19845 = function() {
      cm.replaceRange(delimiter__19837, destination__19843);
      cm.replaceRange("", start__19841, end__19842);
      return cljs.core.map.call(null, function(p1__19812_SHARP_) {
        return cm.indentLine(p1__19812_SHARP_)
      }, cljs.core.range.call(null, line__19844, line__19844 + ri__19840))
    };
    return cm.compoundChange(update__19845)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.forward_slurp", subpar.core.forward_slurp);
subpar.core.backward_slurp = function backward_slurp(cm) {
  var vec__19863__19865 = subpar.core.get_info.call(null, cm);
  var cur__19866 = cljs.core.nth.call(null, vec__19863__19865, 0, null);
  var i__19867 = cljs.core.nth.call(null, vec__19863__19865, 1, null);
  var s__19868 = cljs.core.nth.call(null, vec__19863__19865, 2, null);
  var vec__19864__19869 = subpar.core.backward_slurp_vals.call(null, s__19868, i__19867);
  var delimiter__19870 = cljs.core.nth.call(null, vec__19864__19869, 0, null);
  var si__19871 = cljs.core.nth.call(null, vec__19864__19869, 1, null);
  var di__19872 = cljs.core.nth.call(null, vec__19864__19869, 2, null);
  var ri__19873 = cljs.core.nth.call(null, vec__19864__19869, 3, null);
  if(cljs.core.truth_(ri__19873)) {
    var start__19874 = cm.posFromIndex(si__19871);
    var end__19875 = cm.posFromIndex(si__19871 + 1);
    var destination__19876 = cm.posFromIndex(di__19872);
    var line__19877 = start__19874.line;
    var update__19878 = function() {
      cm.replaceRange("", start__19874, end__19875);
      cm.replaceRange(delimiter__19870, destination__19876);
      return cljs.core.map.call(null, function(p1__19813_SHARP_) {
        return cm.indentLine(p1__19813_SHARP_)
      }, cljs.core.range.call(null, line__19877, line__19877 + ri__19873))
    };
    return cm.compoundChange(update__19878)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.backward_slurp", subpar.core.backward_slurp);
subpar.core.backward_barf = function backward_barf(cm) {
  var vec__19898__19900 = subpar.core.get_info.call(null, cm);
  var cur__19901 = cljs.core.nth.call(null, vec__19898__19900, 0, null);
  var i__19902 = cljs.core.nth.call(null, vec__19898__19900, 1, null);
  var s__19903 = cljs.core.nth.call(null, vec__19898__19900, 2, null);
  var vec__19899__19904 = subpar.core.backward_barf_vals.call(null, s__19903, i__19902);
  var delimiter__19905 = cljs.core.nth.call(null, vec__19899__19904, 0, null);
  var si__19906 = cljs.core.nth.call(null, vec__19899__19904, 1, null);
  var di__19907 = cljs.core.nth.call(null, vec__19899__19904, 2, null);
  var pad__19908 = cljs.core.nth.call(null, vec__19899__19904, 3, null);
  var ri__19909 = cljs.core.nth.call(null, vec__19899__19904, 4, null);
  if(cljs.core.truth_(ri__19909)) {
    var delimiter__19910 = cljs.core.truth_(pad__19908) ? [cljs.core.str(" "), cljs.core.str(delimiter__19905)].join("") : delimiter__19905;
    var destination__19911 = cm.posFromIndex(di__19907);
    var start__19912 = cm.posFromIndex(si__19906);
    var end__19913 = cm.posFromIndex(si__19906 + 1);
    var line__19914 = start__19912.line;
    var update__19915 = function() {
      cm.replaceRange(delimiter__19910, destination__19911);
      cm.replaceRange("", start__19912, end__19913);
      return cljs.core.map.call(null, function(p1__19846_SHARP_) {
        return cm.indentLine(p1__19846_SHARP_)
      }, cljs.core.range.call(null, line__19914, line__19914 + ri__19909))
    };
    return cm.compoundChange(update__19915)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.backward_barf", subpar.core.backward_barf);
subpar.core.forward_barf = function forward_barf(cm) {
  var vec__19936__19938 = subpar.core.get_info.call(null, cm);
  var cur__19939 = cljs.core.nth.call(null, vec__19936__19938, 0, null);
  var i__19940 = cljs.core.nth.call(null, vec__19936__19938, 1, null);
  var s__19941 = cljs.core.nth.call(null, vec__19936__19938, 2, null);
  var vec__19937__19942 = subpar.core.forward_barf_vals.call(null, s__19941, i__19940);
  var delimiter__19943 = cljs.core.nth.call(null, vec__19937__19942, 0, null);
  var si__19944 = cljs.core.nth.call(null, vec__19937__19942, 1, null);
  var di__19945 = cljs.core.nth.call(null, vec__19937__19942, 2, null);
  var pad__19946 = cljs.core.nth.call(null, vec__19937__19942, 3, null);
  var ri__19947 = cljs.core.nth.call(null, vec__19937__19942, 4, null);
  var i0__19948 = cljs.core.nth.call(null, vec__19937__19942, 5, null);
  if(cljs.core.truth_(ri__19947)) {
    var delimiter__19949 = cljs.core.truth_(pad__19946) ? [cljs.core.str(" "), cljs.core.str(delimiter__19943)].join("") : delimiter__19943;
    var destination__19950 = cm.posFromIndex(di__19945);
    var start__19951 = cm.posFromIndex(si__19944);
    var end__19952 = cm.posFromIndex(si__19944 + 1);
    var line__19953 = cm.posFromIndex(i0__19948).line;
    var update__19954 = function() {
      cm.replaceRange("", start__19951, end__19952);
      cm.replaceRange(delimiter__19949, destination__19950);
      return cljs.core.map.call(null, function(p1__19879_SHARP_) {
        return cm.indentLine(p1__19879_SHARP_)
      }, cljs.core.range.call(null, line__19953, line__19953 + ri__19947))
    };
    return cm.compoundChange(update__19954)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.forward_barf", subpar.core.forward_barf);
subpar.core.splice_delete_backward = function splice_delete_backward(cm) {
  var vec__19974__19976 = subpar.core.get_info.call(null, cm);
  var cur__19977 = cljs.core.nth.call(null, vec__19974__19976, 0, null);
  var i__19978 = cljs.core.nth.call(null, vec__19974__19976, 1, null);
  var s__19979 = cljs.core.nth.call(null, vec__19974__19976, 2, null);
  var vec__19975__19980 = subpar.core.splice_killing_backward.call(null, s__19979, i__19978);
  var start__19981 = cljs.core.nth.call(null, vec__19975__19980, 0, null);
  var end__19982 = cljs.core.nth.call(null, vec__19975__19980, 1, null);
  var closer__19983 = cljs.core.nth.call(null, vec__19975__19980, 2, null);
  var reindent__19984 = cljs.core.nth.call(null, vec__19975__19980, 3, null);
  var num__19985 = cljs.core.nth.call(null, vec__19975__19980, 4, null);
  if(cljs.core.truth_(reindent__19984)) {
    var line__19986 = cm.posFromIndex(reindent__19984).line;
    var c0__19987 = cm.posFromIndex(closer__19983);
    var c1__19988 = cm.posFromIndex(closer__19983 + 1);
    var s0__19989 = cm.posFromIndex(start__19981);
    var s1__19990 = cm.posFromIndex(end__19982);
    var update__19991 = function() {
      cm.replaceRange("", c0__19987, c1__19988);
      cm.replaceRange("", s0__19989, s1__19990);
      return cljs.core.map.call(null, function(p1__19916_SHARP_) {
        return cm.indentLine(p1__19916_SHARP_)
      }, cljs.core.range.call(null, line__19986, line__19986 + num__19985))
    };
    return cm.compoundChange(update__19991)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.splice_delete_backward", subpar.core.splice_delete_backward);
subpar.core.splice_delete_forward = function splice_delete_forward(cm) {
  var vec__20011__20013 = subpar.core.get_info.call(null, cm);
  var cur__20014 = cljs.core.nth.call(null, vec__20011__20013, 0, null);
  var i__20015 = cljs.core.nth.call(null, vec__20011__20013, 1, null);
  var s__20016 = cljs.core.nth.call(null, vec__20011__20013, 2, null);
  var vec__20012__20017 = subpar.core.splice_killing_forward.call(null, s__20016, i__20015);
  var opener__20018 = cljs.core.nth.call(null, vec__20012__20017, 0, null);
  var start__20019 = cljs.core.nth.call(null, vec__20012__20017, 1, null);
  var end__20020 = cljs.core.nth.call(null, vec__20012__20017, 2, null);
  var reindent__20021 = cljs.core.nth.call(null, vec__20012__20017, 3, null);
  var num__20022 = cljs.core.nth.call(null, vec__20012__20017, 4, null);
  if(cljs.core.truth_(reindent__20021)) {
    var line__20023 = cm.posFromIndex(reindent__20021).line;
    var o0__20024 = cm.posFromIndex(opener__20018);
    var o1__20025 = cm.posFromIndex(opener__20018 + 1);
    var s0__20026 = cm.posFromIndex(start__20019);
    var s1__20027 = cm.posFromIndex(end__20020);
    var update__20028 = function() {
      cm.replaceRange("", s0__20026, s1__20027);
      cm.replaceRange("", o0__20024, o1__20025);
      return cljs.core.map.call(null, function(p1__19955_SHARP_) {
        return cm.indentLine(p1__19955_SHARP_)
      }, cljs.core.range.call(null, line__20023, line__20023 + num__20022))
    };
    return cm.compoundChange(update__20028)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.splice_delete_forward", subpar.core.splice_delete_forward);
subpar.core.splice = function splice(cm) {
  var vec__20047__20049 = subpar.core.get_info.call(null, cm);
  var cur__20050 = cljs.core.nth.call(null, vec__20047__20049, 0, null);
  var i__20051 = cljs.core.nth.call(null, vec__20047__20049, 1, null);
  var s__20052 = cljs.core.nth.call(null, vec__20047__20049, 2, null);
  var vec__20048__20053 = subpar.core.splice_vals.call(null, s__20052, i__20051);
  var opener__20054 = cljs.core.nth.call(null, vec__20048__20053, 0, null);
  var closer__20055 = cljs.core.nth.call(null, vec__20048__20053, 1, null);
  var reindent__20056 = cljs.core.nth.call(null, vec__20048__20053, 2, null);
  var num__20057 = cljs.core.nth.call(null, vec__20048__20053, 3, null);
  if(cljs.core.truth_(reindent__20056)) {
    var line__20058 = cm.posFromIndex(reindent__20056).line;
    var o0__20059 = cm.posFromIndex(opener__20054);
    var o1__20060 = cm.posFromIndex(opener__20054 + 1);
    var c0__20061 = cm.posFromIndex(closer__20055);
    var c1__20062 = cm.posFromIndex(closer__20055 + 1);
    var update__20063 = function() {
      cm.replaceRange("", c0__20061, c1__20062);
      cm.replaceRange("", o0__20059, o1__20060);
      return cljs.core.map.call(null, function(p1__19992_SHARP_) {
        return cm.indentLine(p1__19992_SHARP_)
      }, cljs.core.range.call(null, line__20058, line__20058 + num__20057))
    };
    return cm.compoundChange(update__20063)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.splice", subpar.core.splice);
subpar.core.indent_selection = function indent_selection(cm) {
  if(cljs.core.truth_(cm.somethingSelected())) {
    var start__20067 = cm.getCursor(true).line;
    var end__20068 = cm.getCursor(false).line;
    var f__20069 = function() {
      return cljs.core.map.call(null, function(p1__20029_SHARP_) {
        return cm.indentLine(p1__20029_SHARP_)
      }, cljs.core.range.call(null, start__20067, end__20068 + 1))
    };
    return cm.compoundChange(f__20069)
  }else {
    return cm.indentLine(cm.getCursor().line)
  }
};
goog.exportSymbol("subpar.core.indent_selection", subpar.core.indent_selection);
goog.provide("subpar.test.tests");
goog.require("cljs.core");
goog.require("subpar.core");
goog.require("subpar.core");
subpar.test.tests.arr_EQ_ = function arr_EQ_(a, b) {
  return cljs.core._EQ_.call(null, cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, a), cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, b))
};
goog.exportSymbol("subpar.test.tests.arr_EQ_", subpar.test.tests.arr_EQ_);
subpar.test.tests.run = function run() {
  if(cljs.core._EQ_.call(null, 4, subpar.core.count_lines.call(null, "\n\n\n\n", 0, 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'count-lines", "\n\n\n\n", 0, 2), cljs.core.hash_map("\ufdd0'line", 24))), cljs.core.hash_map("\ufdd0'line", 24))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.count_lines.call(null, "0\n\n\n\n", 0, 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'count-lines", "0\n\n\n\n", 0, 2), cljs.core.hash_map("\ufdd0'line", 25))), cljs.core.hash_map("\ufdd0'line", 25))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.core.count_lines.call(null, "01\n\n\n\n", 0, 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'count-lines", "01\n\n\n\n", 0, 2), cljs.core.hash_map("\ufdd0'line", 26))), cljs.core.hash_map("\ufdd0'line", 26))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.count_lines.call(null, "012\n\n\n\n", 0, 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'count-lines", "012\n\n\n\n", 0, 2), cljs.core.hash_map("\ufdd0'line", 27))), cljs.core.hash_map("\ufdd0'line", 27))))].join(""));
  }
  if(cljs.core._EQ_.call(null, -1, subpar.core.get_opening_delimiter_index.call(null, " ()", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", -1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " ()", 0), cljs.core.hash_map("\ufdd0'line", 29))), cljs.core.hash_map("\ufdd0'line", 29))))].join(""));
  }
  if(cljs.core._EQ_.call(null, -1, subpar.core.get_opening_delimiter_index.call(null, " ()", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", -1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " ()", 1), cljs.core.hash_map("\ufdd0'line", 30))), cljs.core.hash_map("\ufdd0'line", 30))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.get_opening_delimiter_index.call(null, " ()", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " ()", 2), cljs.core.hash_map("\ufdd0'line", 31))), cljs.core.hash_map("\ufdd0'line", 31))))].join(""));
  }
  if(cljs.core._EQ_.call(null, -1, subpar.core.get_opening_delimiter_index.call(null, " ()", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", -1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " ()", 3), cljs.core.hash_map("\ufdd0'line", 32))), cljs.core.hash_map("\ufdd0'line", 32))))].join(""));
  }
  if(cljs.core._EQ_.call(null, -1, subpar.core.get_opening_delimiter_index.call(null, " () []", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", -1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " () []", 3), cljs.core.hash_map("\ufdd0'line", 33))), cljs.core.hash_map("\ufdd0'line", 33))))].join(""));
  }
  if(cljs.core._EQ_.call(null, -1, subpar.core.get_opening_delimiter_index.call(null, " () []", 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", -1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " () []", 4), cljs.core.hash_map("\ufdd0'line", 34))), cljs.core.hash_map("\ufdd0'line", 34))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.core.get_opening_delimiter_index.call(null, " () []", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " () []", 5), cljs.core.hash_map("\ufdd0'line", 35))), cljs.core.hash_map("\ufdd0'line", 35))))].join(""));
  }
  if(cljs.core._EQ_.call(null, -1, subpar.core.get_opening_delimiter_index.call(null, " () []", 6))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", -1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " () []", 6), cljs.core.hash_map("\ufdd0'line", 36))), cljs.core.hash_map("\ufdd0'line", 36))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.get_opening_delimiter_index.call(null, " ([a] )", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " ([a] )", 2), cljs.core.hash_map("\ufdd0'line", 37))), cljs.core.hash_map("\ufdd0'line", 37))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.core.get_opening_delimiter_index.call(null, " ([a] )", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " ([a] )", 3), cljs.core.hash_map("\ufdd0'line", 38))), cljs.core.hash_map("\ufdd0'line", 38))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.core.get_opening_delimiter_index.call(null, "([a]){b}", 6))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", "([a]){b}", 6), cljs.core.hash_map("\ufdd0'line", 39))), cljs.core.hash_map("\ufdd0'line", 39))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.get_opening_delimiter_index.call(null, " (;a\nb)", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " (;a\nb)", 5), cljs.core.hash_map("\ufdd0'line", 40))), cljs.core.hash_map("\ufdd0'line", 40))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.get_closing_delimiter_index.call(null, " ()", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " ()", 0), cljs.core.hash_map("\ufdd0'line", 42))), cljs.core.hash_map("\ufdd0'line", 42))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.get_closing_delimiter_index.call(null, " ()", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " ()", 1), cljs.core.hash_map("\ufdd0'line", 43))), cljs.core.hash_map("\ufdd0'line", 43))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.core.get_closing_delimiter_index.call(null, " ()", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " ()", 2), cljs.core.hash_map("\ufdd0'line", 44))), cljs.core.hash_map("\ufdd0'line", 44))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.get_closing_delimiter_index.call(null, " ()", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " ()", 3), cljs.core.hash_map("\ufdd0'line", 45))), cljs.core.hash_map("\ufdd0'line", 45))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.core.get_closing_delimiter_index.call(null, " () []", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " () []", 3), cljs.core.hash_map("\ufdd0'line", 46))), cljs.core.hash_map("\ufdd0'line", 46))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.core.get_closing_delimiter_index.call(null, " () []", 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " () []", 4), cljs.core.hash_map("\ufdd0'line", 47))), cljs.core.hash_map("\ufdd0'line", 47))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.core.get_closing_delimiter_index.call(null, " () []", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " () []", 5), cljs.core.hash_map("\ufdd0'line", 48))), cljs.core.hash_map("\ufdd0'line", 48))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.core.get_closing_delimiter_index.call(null, " () []", 6))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " () []", 6), cljs.core.hash_map("\ufdd0'line", 49))), cljs.core.hash_map("\ufdd0'line", 49))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.core.get_closing_delimiter_index.call(null, " ([a] )", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " ([a] )", 2), cljs.core.hash_map("\ufdd0'line", 50))), cljs.core.hash_map("\ufdd0'line", 50))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.core.get_closing_delimiter_index.call(null, " ([a] )", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " ([a] )", 3), cljs.core.hash_map("\ufdd0'line", 51))), cljs.core.hash_map("\ufdd0'line", 51))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 7, subpar.core.get_closing_delimiter_index.call(null, "([a]){b}", 6))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 7, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", "([a]){b}", 6), cljs.core.hash_map("\ufdd0'line", 52))), cljs.core.hash_map("\ufdd0'line", 52))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 10, subpar.core.get_closing_delimiter_index.call(null, " (;a\nb () )", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 10, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " (;a\nb () )", 5), cljs.core.hash_map("\ufdd0'line", 53))), cljs.core.hash_map("\ufdd0'line", 53))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.in_comment_QMARK_.call(null, subpar.core.parse.call(null, "a;b"), 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-comment?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b"), cljs.core.hash_map("\ufdd0'line", 55)), 0), cljs.core.hash_map("\ufdd0'line", 55))), cljs.core.hash_map("\ufdd0'line", 55))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.in_comment_QMARK_.call(null, subpar.core.parse.call(null, "a;b"), 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-comment?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b"), cljs.core.hash_map("\ufdd0'line", 56)), 1), cljs.core.hash_map("\ufdd0'line", 56))), cljs.core.hash_map("\ufdd0'line", 56))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.core.in_comment_QMARK_.call(null, subpar.core.parse.call(null, "a;b"), 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-comment?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b"), cljs.core.hash_map("\ufdd0'line", 57)), 2), cljs.core.hash_map("\ufdd0'line", 57))), cljs.core.hash_map("\ufdd0'line", 57))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.core.in_comment_QMARK_.call(null, subpar.core.parse.call(null, "a;b\nc"), 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-comment?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b\nc"), cljs.core.hash_map("\ufdd0'line", 58)), 3), cljs.core.hash_map("\ufdd0'line", 58))), cljs.core.hash_map("\ufdd0'line", 58))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.in_comment_QMARK_.call(null, subpar.core.parse.call(null, "a;b\nc"), 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-comment?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b\nc"), cljs.core.hash_map("\ufdd0'line", 59)), 4), cljs.core.hash_map("\ufdd0'line", 59))), cljs.core.hash_map("\ufdd0'line", 59))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.core.in_comment_QMARK_.call(null, subpar.core.parse.call(null, 'a;"b"'), 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-comment?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a;"b"'), cljs.core.hash_map("\ufdd0'line", 60)), 3), cljs.core.hash_map("\ufdd0'line", 60))), cljs.core.hash_map("\ufdd0'line", 60))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.core.in_code_QMARK_.call(null, subpar.core.parse.call(null, "a;b"), 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-code?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b"), cljs.core.hash_map("\ufdd0'line", 62)), 0), cljs.core.hash_map("\ufdd0'line", 62))), cljs.core.hash_map("\ufdd0'line", 62))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.core.in_code_QMARK_.call(null, subpar.core.parse.call(null, "a;b"), 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-code?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b"), cljs.core.hash_map("\ufdd0'line", 63)), 1), cljs.core.hash_map("\ufdd0'line", 63))), cljs.core.hash_map("\ufdd0'line", 63))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.in_code_QMARK_.call(null, subpar.core.parse.call(null, "a;b"), 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-code?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b"), cljs.core.hash_map("\ufdd0'line", 64)), 2), cljs.core.hash_map("\ufdd0'line", 64))), cljs.core.hash_map("\ufdd0'line", 64))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.core.in_code_QMARK_.call(null, subpar.core.parse.call(null, "a;b\nc"), 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-code?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b\nc"), cljs.core.hash_map("\ufdd0'line", 65)), 4), cljs.core.hash_map("\ufdd0'line", 65))), cljs.core.hash_map("\ufdd0'line", 65))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.in_code_QMARK_.call(null, subpar.core.parse.call(null, 'a;"b"'), 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-code?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a;"b"'), cljs.core.hash_map("\ufdd0'line", 66)), 3), cljs.core.hash_map("\ufdd0'line", 66))), cljs.core.hash_map("\ufdd0'line", 66))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.in_string_QMARK_.call(null, subpar.core.parse.call(null, 'a;"b"'), 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-string?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a;"b"'), cljs.core.hash_map("\ufdd0'line", 68)), 0), cljs.core.hash_map("\ufdd0'line", 68))), cljs.core.hash_map("\ufdd0'line", 68))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.in_string_QMARK_.call(null, subpar.core.parse.call(null, 'a;"b"'), 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-string?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a;"b"'), cljs.core.hash_map("\ufdd0'line", 69)), 3), cljs.core.hash_map("\ufdd0'line", 69))), cljs.core.hash_map("\ufdd0'line", 69))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.in_string_QMARK_.call(null, subpar.core.parse.call(null, 'a "b"'), 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-string?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a "b"'), cljs.core.hash_map("\ufdd0'line", 70)), 2), cljs.core.hash_map("\ufdd0'line", 70))), cljs.core.hash_map("\ufdd0'line", 70))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.core.in_string_QMARK_.call(null, subpar.core.parse.call(null, 'a "b"'), 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-string?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a "b"'), cljs.core.hash_map("\ufdd0'line", 71)), 3), cljs.core.hash_map("\ufdd0'line", 71))), cljs.core.hash_map("\ufdd0'line", 71))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.core.in_string_QMARK_.call(null, subpar.core.parse.call(null, 'a "b"'), 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-string?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a "b"'), cljs.core.hash_map("\ufdd0'line", 72)), 4), cljs.core.hash_map("\ufdd0'line", 72))), cljs.core.hash_map("\ufdd0'line", 72))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.doublequote.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'doublequote", "", 0), cljs.core.hash_map("\ufdd0'line", 74))), cljs.core.hash_map("\ufdd0'line", 74))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.doublequote.call(null, "  ", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'doublequote", "  ", 1), cljs.core.hash_map("\ufdd0'line", 75))), cljs.core.hash_map("\ufdd0'line", 75))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.doublequote.call(null, '""', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'doublequote", '""', 0), cljs.core.hash_map("\ufdd0'line", 76))), cljs.core.hash_map("\ufdd0'line", 76))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.core.doublequote.call(null, '""', 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'doublequote", '""', 1), cljs.core.hash_map("\ufdd0'line", 77))), cljs.core.hash_map("\ufdd0'line", 77))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.doublequote.call(null, '" "', 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'doublequote", '" "', 1), cljs.core.hash_map("\ufdd0'line", 78))), cljs.core.hash_map("\ufdd0'line", 78))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.doublequote.call(null, '" \\" "', 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'doublequote", '" \\" "', 2), cljs.core.hash_map("\ufdd0'line", 79))), cljs.core.hash_map("\ufdd0'line", 79))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.core.doublequote.call(null, '" \\" "', 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'doublequote", '" \\" "', 3), cljs.core.hash_map("\ufdd0'line", 80))), cljs.core.hash_map("\ufdd0'line", 80))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.doublequote.call(null, '; " "', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'doublequote", '; " "', 0), cljs.core.hash_map("\ufdd0'line", 81))), cljs.core.hash_map("\ufdd0'line", 81))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.doublequote.call(null, '; " "', 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'doublequote", '; " "', 1), cljs.core.hash_map("\ufdd0'line", 82))), cljs.core.hash_map("\ufdd0'line", 82))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.doublequote.call(null, '; " "', 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'doublequote", '; " "', 2), cljs.core.hash_map("\ufdd0'line", 83))), cljs.core.hash_map("\ufdd0'line", 83))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.doublequote.call(null, '; " "', 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'doublequote", '; " "', 3), cljs.core.hash_map("\ufdd0'line", 84))), cljs.core.hash_map("\ufdd0'line", 84))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.doublequote.call(null, '; " "', 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'doublequote", '; " "', 4), cljs.core.hash_map("\ufdd0'line", 85))), cljs.core.hash_map("\ufdd0'line", 85))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.get_start_of_next_list.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "", 0), cljs.core.hash_map("\ufdd0'line", 87))), cljs.core.hash_map("\ufdd0'line", 87))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.get_start_of_next_list.call(null, " ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", " ", 0), cljs.core.hash_map("\ufdd0'line", 88))), cljs.core.hash_map("\ufdd0'line", 88))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.get_start_of_next_list.call(null, "()  ", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "()  ", 2), cljs.core.hash_map("\ufdd0'line", 89))), cljs.core.hash_map("\ufdd0'line", 89))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.get_start_of_next_list.call(null, "()", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "()", 1), cljs.core.hash_map("\ufdd0'line", 90))), cljs.core.hash_map("\ufdd0'line", 90))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.get_start_of_next_list.call(null, "() ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "() ", 0), cljs.core.hash_map("\ufdd0'line", 91))), cljs.core.hash_map("\ufdd0'line", 91))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.get_start_of_next_list.call(null, ";()", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ";()", 0), cljs.core.hash_map("\ufdd0'line", 92))), cljs.core.hash_map("\ufdd0'line", 92))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.get_start_of_next_list.call(null, ";[]", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ";[]", 0), cljs.core.hash_map("\ufdd0'line", 93))), cljs.core.hash_map("\ufdd0'line", 93))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.get_start_of_next_list.call(null, ";{}", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ";{}", 0), cljs.core.hash_map("\ufdd0'line", 94))), cljs.core.hash_map("\ufdd0'line", 94))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.get_start_of_next_list.call(null, ';""', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ';""', 0), cljs.core.hash_map("\ufdd0'line", 95))), cljs.core.hash_map("\ufdd0'line", 95))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.get_start_of_next_list.call(null, " () ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", " () ", 0), cljs.core.hash_map("\ufdd0'line", 96))), cljs.core.hash_map("\ufdd0'line", 96))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.get_start_of_next_list.call(null, " [] ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", " [] ", 0), cljs.core.hash_map("\ufdd0'line", 97))), cljs.core.hash_map("\ufdd0'line", 97))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.get_start_of_next_list.call(null, " {} ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", " {} ", 0), cljs.core.hash_map("\ufdd0'line", 98))), cljs.core.hash_map("\ufdd0'line", 98))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.get_start_of_next_list.call(null, ' "" ', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ' "" ', 0), cljs.core.hash_map("\ufdd0'line", 99))), cljs.core.hash_map("\ufdd0'line", 99))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.get_start_of_next_list.call(null, ';""', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ';""', 0), cljs.core.hash_map("\ufdd0'line", 100))), cljs.core.hash_map("\ufdd0'line", 100))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.get_start_of_next_list.call(null, ';""', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ';""', 0), cljs.core.hash_map("\ufdd0'line", 101))), cljs.core.hash_map("\ufdd0'line", 101))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.core.get_start_of_next_list.call(null, "();a\n()", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "();a\n()", 1), cljs.core.hash_map("\ufdd0'line", 102))), cljs.core.hash_map("\ufdd0'line", 102))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.core.get_start_of_next_list.call(null, "();a\n()", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "();a\n()", 2), cljs.core.hash_map("\ufdd0'line", 103))), cljs.core.hash_map("\ufdd0'line", 103))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.core.get_start_of_next_list.call(null, "( [] [])", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "( [] [])", 1), cljs.core.hash_map("\ufdd0'line", 104))), cljs.core.hash_map("\ufdd0'line", 104))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.core.get_start_of_next_list.call(null, "(aaa []())", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "(aaa []())", 1), cljs.core.hash_map("\ufdd0'line", 105))), cljs.core.hash_map("\ufdd0'line", 105))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.backward_up.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up", "", 0), cljs.core.hash_map("\ufdd0'line", 107))), cljs.core.hash_map("\ufdd0'line", 107))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.backward_up.call(null, " ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up", " ", 0), cljs.core.hash_map("\ufdd0'line", 108))), cljs.core.hash_map("\ufdd0'line", 108))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.backward_up.call(null, " ", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up", " ", 1), cljs.core.hash_map("\ufdd0'line", 109))), cljs.core.hash_map("\ufdd0'line", 109))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.backward_up.call(null, " ( )", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up", " ( )", 2), cljs.core.hash_map("\ufdd0'line", 110))), cljs.core.hash_map("\ufdd0'line", 110))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.backward_up.call(null, " ()", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up", " ()", 3), cljs.core.hash_map("\ufdd0'line", 111))), cljs.core.hash_map("\ufdd0'line", 111))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.core.backward_up.call(null, " ()\n;\n", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up", " ()\n;\n", 5), cljs.core.hash_map("\ufdd0'line", 112))), cljs.core.hash_map("\ufdd0'line", 112))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.backward_up.call(null, " ( [ ])", 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up", " ( [ ])", 4), cljs.core.hash_map("\ufdd0'line", 113))), cljs.core.hash_map("\ufdd0'line", 113))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.backward_up.call(null, " ( [ asdf])", 7))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up", " ( [ asdf])", 7), cljs.core.hash_map("\ufdd0'line", 114))), cljs.core.hash_map("\ufdd0'line", 114))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.backward_up.call(null, " ( [ asdf])", 9))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up", " ( [ asdf])", 9), cljs.core.hash_map("\ufdd0'line", 115))), cljs.core.hash_map("\ufdd0'line", 115))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.backward_up.call(null, " ( [ asdf])", 10))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up", " ( [ asdf])", 10), cljs.core.hash_map("\ufdd0'line", 116))), cljs.core.hash_map("\ufdd0'line", 116))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 11, subpar.core.backward_up.call(null, " ( [ asdf])", 11))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 11, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up", " ( [ asdf])", 11), cljs.core.hash_map("\ufdd0'line", 117))), cljs.core.hash_map("\ufdd0'line", 117))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 13, subpar.core.backward_up.call(null, " ( [ asdf])  ", 13))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 13, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up", " ( [ asdf])  ", 13), cljs.core.hash_map("\ufdd0'line", 118))), cljs.core.hash_map("\ufdd0'line", 118))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.forward.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", "", 0), cljs.core.hash_map("\ufdd0'line", 120))), cljs.core.hash_map("\ufdd0'line", 120))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.forward.call(null, " ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", " ", 0), cljs.core.hash_map("\ufdd0'line", 121))), cljs.core.hash_map("\ufdd0'line", 121))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.forward.call(null, " ()", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", " ()", 0), cljs.core.hash_map("\ufdd0'line", 122))), cljs.core.hash_map("\ufdd0'line", 122))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.forward.call(null, "\n()", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", "\n()", 0), cljs.core.hash_map("\ufdd0'line", 123))), cljs.core.hash_map("\ufdd0'line", 123))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 11, subpar.core.forward.call(null, " (asdf (a))", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 11, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", " (asdf (a))", 0), cljs.core.hash_map("\ufdd0'line", 124))), cljs.core.hash_map("\ufdd0'line", 124))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 11, subpar.core.forward.call(null, " (asdf (a))", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 11, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", " (asdf (a))", 1), cljs.core.hash_map("\ufdd0'line", 125))), cljs.core.hash_map("\ufdd0'line", 125))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.core.forward.call(null, " (asdf (a))", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", " (asdf (a))", 2), cljs.core.hash_map("\ufdd0'line", 126))), cljs.core.hash_map("\ufdd0'line", 126))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.core.forward.call(null, " (asdf (a))", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", " (asdf (a))", 3), cljs.core.hash_map("\ufdd0'line", 127))), cljs.core.hash_map("\ufdd0'line", 127))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 10, subpar.core.forward.call(null, " (asdf (a))", 6))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 10, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", " (asdf (a))", 6), cljs.core.hash_map("\ufdd0'line", 128))), cljs.core.hash_map("\ufdd0'line", 128))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.core.forward.call(null, "((ab ) )", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", "((ab ) )", 1), cljs.core.hash_map("\ufdd0'line", 129))), cljs.core.hash_map("\ufdd0'line", 129))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.core.forward.call(null, "((ab ) )", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", "((ab ) )", 2), cljs.core.hash_map("\ufdd0'line", 130))), cljs.core.hash_map("\ufdd0'line", 130))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.core.forward.call(null, "((ab ) )", 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", "((ab ) )", 4), cljs.core.hash_map("\ufdd0'line", 131))), cljs.core.hash_map("\ufdd0'line", 131))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 13, subpar.core.forward.call(null, ";a\n[asdf {a}]", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 13, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", ";a\n[asdf {a}]", 0), cljs.core.hash_map("\ufdd0'line", 132))), cljs.core.hash_map("\ufdd0'line", 132))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.core.forward.call(null, " asdf ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", " asdf ", 0), cljs.core.hash_map("\ufdd0'line", 133))), cljs.core.hash_map("\ufdd0'line", 133))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.core.forward.call(null, " asdf ", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", " asdf ", 2), cljs.core.hash_map("\ufdd0'line", 134))), cljs.core.hash_map("\ufdd0'line", 134))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 9, subpar.core.forward.call(null, "( a ;b\n c)", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 9, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", "( a ;b\n c)", 3), cljs.core.hash_map("\ufdd0'line", 135))), cljs.core.hash_map("\ufdd0'line", 135))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.core.forward.call(null, '"\\n"', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'forward", '"\\n"', 0), cljs.core.hash_map("\ufdd0'line", 136))), cljs.core.hash_map("\ufdd0'line", 136))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [")", 1, 4, 1], subpar.core.forward_slurp.call(null, "() a", 1)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", ")", 1, 4, 1), cljs.core.hash_map("\ufdd0'line", 138)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp", "() a", 1), cljs.core.hash_map("\ufdd0'line", 138))), cljs.core.hash_map("\ufdd0'line", 138))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [")", 1, 6, 1], subpar.core.forward_slurp.call(null, "() (a)", 1)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", ")", 1, 6, 1), cljs.core.hash_map("\ufdd0'line", 139)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp", "() (a)", 1), cljs.core.hash_map("\ufdd0'line", 139))), cljs.core.hash_map("\ufdd0'line", 139))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [")", 1, 8, 1], subpar.core.forward_slurp.call(null, "() (a b)", 1)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", ")", 1, 8, 1), cljs.core.hash_map("\ufdd0'line", 140)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp", "() (a b)", 1), cljs.core.hash_map("\ufdd0'line", 140))), cljs.core.hash_map("\ufdd0'line", 140))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [")", 1, 10, 2], subpar.core.forward_slurp.call(null, "();c\n(a b)", 1)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", ")", 1, 10, 2), cljs.core.hash_map("\ufdd0'line", 141)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp", "();c\n(a b)", 1), cljs.core.hash_map("\ufdd0'line", 141))), cljs.core.hash_map("\ufdd0'line", 141))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [], subpar.core.forward_slurp.call(null, "() ", 2)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array"), cljs.core.hash_map("\ufdd0'line", 142)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp", "() ", 2), cljs.core.hash_map("\ufdd0'line", 142))), cljs.core.hash_map("\ufdd0'line", 142))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [], subpar.core.forward_slurp.call(null, " () ", 0)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array"), cljs.core.hash_map("\ufdd0'line", 143)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp", " () ", 0), cljs.core.hash_map("\ufdd0'line", 143))), cljs.core.hash_map("\ufdd0'line", 143))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [")", 1, 8, 1], subpar.core.forward_slurp.call(null, '() "a b"', 1)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", ")", 1, 8, 1), cljs.core.hash_map("\ufdd0'line", 144)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp", '() "a b"', 1), cljs.core.hash_map("\ufdd0'line", 144))), cljs.core.hash_map("\ufdd0'line", 144))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [], subpar.core.forward_slurp.call(null, '({a "b"} c)', 6)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array"), cljs.core.hash_map("\ufdd0'line", 145)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp", '({a "b"} c)', 6), cljs.core.hash_map("\ufdd0'line", 145))), cljs.core.hash_map("\ufdd0'line", 145))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [")", 4, 7, 1], subpar.core.forward_slurp.call(null, "(abc) a", 2)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", ")", 4, 7, 1), cljs.core.hash_map("\ufdd0'line", 146)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp", "(abc) a", 2), cljs.core.hash_map("\ufdd0'line", 146))), cljs.core.hash_map("\ufdd0'line", 146))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, ["(", 3, 1, 1], subpar.core.backward_slurp.call(null, " a () ", 4)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", "(", 3, 1, 1), cljs.core.hash_map("\ufdd0'line", 148)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp", " a () ", 4), cljs.core.hash_map("\ufdd0'line", 148))), cljs.core.hash_map("\ufdd0'line", 148))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, ["(", 2, 0, 1], subpar.core.backward_slurp.call(null, "a () ", 3)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", "(", 2, 0, 1), cljs.core.hash_map("\ufdd0'line", 149)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp", "a () ", 3), cljs.core.hash_map("\ufdd0'line", 149))), cljs.core.hash_map("\ufdd0'line", 149))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [], subpar.core.backward_slurp.call(null, "a () ", 2)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array"), cljs.core.hash_map("\ufdd0'line", 150)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp", "a () ", 2), cljs.core.hash_map("\ufdd0'line", 150))), cljs.core.hash_map("\ufdd0'line", 150))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, ["(", 6, 1, 1], subpar.core.backward_slurp.call(null, " [ab] (c d) ", 9)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", "(", 6, 1, 1), cljs.core.hash_map("\ufdd0'line", 151)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp", " [ab] (c d) ", 9), cljs.core.hash_map("\ufdd0'line", 151))), cljs.core.hash_map("\ufdd0'line", 151))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, ["(", 6, 1, 1], subpar.core.backward_slurp.call(null, " {ab} (c d) ", 8)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", "(", 6, 1, 1), cljs.core.hash_map("\ufdd0'line", 152)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp", " {ab} (c d) ", 8), cljs.core.hash_map("\ufdd0'line", 152))), cljs.core.hash_map("\ufdd0'line", 152))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, ["(", 7, 1, 1], subpar.core.backward_slurp.call(null, " (a b) (c d) ", 8)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", "(", 7, 1, 1), cljs.core.hash_map("\ufdd0'line", 153)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp", " (a b) (c d) ", 8), cljs.core.hash_map("\ufdd0'line", 153))), cljs.core.hash_map("\ufdd0'line", 153))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, ["(", 7, 1, 1], subpar.core.backward_slurp.call(null, ' "a b" (c d) ', 8)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", "(", 7, 1, 1), cljs.core.hash_map("\ufdd0'line", 154)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp", ' "a b" (c d) ', 8), cljs.core.hash_map("\ufdd0'line", 154))), cljs.core.hash_map("\ufdd0'line", 154))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [], subpar.core.backward_slurp.call(null, "(a [{}])", 5)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array"), cljs.core.hash_map("\ufdd0'line", 155)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp", "(a [{}])", 5), cljs.core.hash_map("\ufdd0'line", 155))), cljs.core.hash_map("\ufdd0'line", 155))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.forward_delete.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", "", 0), cljs.core.hash_map("\ufdd0'line", 157))), cljs.core.hash_map("\ufdd0'line", 157))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.forward_delete.call(null, "a", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", "a", 1), cljs.core.hash_map("\ufdd0'line", 158))), cljs.core.hash_map("\ufdd0'line", 158))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.forward_delete.call(null, "a", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", "a", 0), cljs.core.hash_map("\ufdd0'line", 159))), cljs.core.hash_map("\ufdd0'line", 159))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.forward_delete.call(null, "[]", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", "[]", 0), cljs.core.hash_map("\ufdd0'line", 160))), cljs.core.hash_map("\ufdd0'line", 160))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.core.forward_delete.call(null, "[]", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", "[]", 1), cljs.core.hash_map("\ufdd0'line", 161))), cljs.core.hash_map("\ufdd0'line", 161))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.forward_delete.call(null, "[a]", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", "[a]", 2), cljs.core.hash_map("\ufdd0'line", 162))), cljs.core.hash_map("\ufdd0'line", 162))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.forward_delete.call(null, "[ ]", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", "[ ]", 2), cljs.core.hash_map("\ufdd0'line", 163))), cljs.core.hash_map("\ufdd0'line", 163))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.core.forward_delete.call(null, "( )", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", "( )", 0), cljs.core.hash_map("\ufdd0'line", 164))), cljs.core.hash_map("\ufdd0'line", 164))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.core.forward_delete.call(null, "(a)", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", "(a)", 0), cljs.core.hash_map("\ufdd0'line", 165))), cljs.core.hash_map("\ufdd0'line", 165))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.core.forward_delete.call(null, '"a"', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", '"a"', 0), cljs.core.hash_map("\ufdd0'line", 166))), cljs.core.hash_map("\ufdd0'line", 166))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.forward_delete.call(null, '""', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", '""', 0), cljs.core.hash_map("\ufdd0'line", 167))), cljs.core.hash_map("\ufdd0'line", 167))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.forward_delete.call(null, '" "', 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", '" "', 2), cljs.core.hash_map("\ufdd0'line", 168))), cljs.core.hash_map("\ufdd0'line", 168))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.forward_delete.call(null, "\\a", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", "\\a", 0), cljs.core.hash_map("\ufdd0'line", 169))), cljs.core.hash_map("\ufdd0'line", 169))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.core.forward_delete.call(null, "\\a", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", "\\a", 1), cljs.core.hash_map("\ufdd0'line", 170))), cljs.core.hash_map("\ufdd0'line", 170))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.forward_delete.call(null, '"\\a"', 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", '"\\a"', 1), cljs.core.hash_map("\ufdd0'line", 171))), cljs.core.hash_map("\ufdd0'line", 171))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.core.forward_delete.call(null, '"\\a"', 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete", '"\\a"', 2), cljs.core.hash_map("\ufdd0'line", 172))), cljs.core.hash_map("\ufdd0'line", 172))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.backward_delete.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete", "", 0), cljs.core.hash_map("\ufdd0'line", 174))), cljs.core.hash_map("\ufdd0'line", 174))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.backward_delete.call(null, " ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete", " ", 0), cljs.core.hash_map("\ufdd0'line", 175))), cljs.core.hash_map("\ufdd0'line", 175))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.core.backward_delete.call(null, " ", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete", " ", 1), cljs.core.hash_map("\ufdd0'line", 176))), cljs.core.hash_map("\ufdd0'line", 176))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.core.backward_delete.call(null, "( )", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete", "( )", 1), cljs.core.hash_map("\ufdd0'line", 177))), cljs.core.hash_map("\ufdd0'line", 177))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.core.backward_delete.call(null, "( )", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete", "( )", 3), cljs.core.hash_map("\ufdd0'line", 178))), cljs.core.hash_map("\ufdd0'line", 178))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.backward_delete.call(null, "()", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete", "()", 2), cljs.core.hash_map("\ufdd0'line", 179))), cljs.core.hash_map("\ufdd0'line", 179))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.core.backward_delete.call(null, "(asdf)", 6))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete", "(asdf)", 6), cljs.core.hash_map("\ufdd0'line", 180))), cljs.core.hash_map("\ufdd0'line", 180))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.core.backward_delete.call(null, "\\a", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete", "\\a", 1), cljs.core.hash_map("\ufdd0'line", 181))), cljs.core.hash_map("\ufdd0'line", 181))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.backward_delete.call(null, "\\a", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete", "\\a", 2), cljs.core.hash_map("\ufdd0'line", 182))), cljs.core.hash_map("\ufdd0'line", 182))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.core.backward_delete.call(null, '""', 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete", '""', 1), cljs.core.hash_map("\ufdd0'line", 183))), cljs.core.hash_map("\ufdd0'line", 183))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.backward_delete.call(null, '""', 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete", '""', 2), cljs.core.hash_map("\ufdd0'line", 184))), cljs.core.hash_map("\ufdd0'line", 184))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.core.backward_delete.call(null, '"\\"', 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete", '"\\"', 2), cljs.core.hash_map("\ufdd0'line", 185))), cljs.core.hash_map("\ufdd0'line", 185))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.core.backward_delete.call(null, '"\\"', 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete", '"\\"', 3), cljs.core.hash_map("\ufdd0'line", 186))), cljs.core.hash_map("\ufdd0'line", 186))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [], subpar.core.backward_barf.call(null, "", 0)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array"), cljs.core.hash_map("\ufdd0'line", 188)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf", "", 0), cljs.core.hash_map("\ufdd0'line", 188))), cljs.core.hash_map("\ufdd0'line", 188))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [], subpar.core.backward_barf.call(null, "()", 1)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array"), cljs.core.hash_map("\ufdd0'line", 189)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf", "()", 1), cljs.core.hash_map("\ufdd0'line", 189))), cljs.core.hash_map("\ufdd0'line", 189))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, ["(", 0, 2, true, 1], subpar.core.backward_barf.call(null, "(a)", 1)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", "(", 0, 2, true, 1), cljs.core.hash_map("\ufdd0'line", 190)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf", "(a)", 1), cljs.core.hash_map("\ufdd0'line", 190))), cljs.core.hash_map("\ufdd0'line", 190))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, ["(", 0, 3, false, 1], subpar.core.backward_barf.call(null, "(a b)", 1)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", "(", 0, 3, false, 1), cljs.core.hash_map("\ufdd0'line", 191)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf", "(a b)", 1), cljs.core.hash_map("\ufdd0'line", 191))), cljs.core.hash_map("\ufdd0'line", 191))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, ["(", 0, 3, false, 2], subpar.core.backward_barf.call(null, "(a\nb)", 1)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", "(", 0, 3, false, 2), cljs.core.hash_map("\ufdd0'line", 192)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf", "(a\nb)", 1), cljs.core.hash_map("\ufdd0'line", 192))), cljs.core.hash_map("\ufdd0'line", 192))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [], subpar.core.backward_barf.call(null, "(a b)", 5)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array"), cljs.core.hash_map("\ufdd0'line", 193)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf", "(a b)", 5), cljs.core.hash_map("\ufdd0'line", 193))), cljs.core.hash_map("\ufdd0'line", 193))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [], subpar.core.backward_barf.call(null, "(a b) ", 5)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array"), cljs.core.hash_map("\ufdd0'line", 194)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf", "(a b) ", 5), cljs.core.hash_map("\ufdd0'line", 194))), cljs.core.hash_map("\ufdd0'line", 194))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, ["[", 3, 5, true, 1], subpar.core.backward_barf.call(null, "(a [b]) ", 4)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", "[", 3, 5, true, 1), cljs.core.hash_map("\ufdd0'line", 195)), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf", "(a [b]) ", 4), cljs.core.hash_map("\ufdd0'line", 195))), cljs.core.hash_map("\ufdd0'line", 195))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [], subpar.core.forward_barf.call(null, "", 0)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array"), cljs.core.hash_map("\ufdd0'line", 197)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf", "", 0), cljs.core.hash_map("\ufdd0'line", 197))), cljs.core.hash_map("\ufdd0'line", 197))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [], subpar.core.forward_barf.call(null, "()", 1)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array"), cljs.core.hash_map("\ufdd0'line", 198)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf", "()", 1), cljs.core.hash_map("\ufdd0'line", 198))), cljs.core.hash_map("\ufdd0'line", 198))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [")", 2, 1, true, 1, 0], subpar.core.forward_barf.call(null, "(a)", 1)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", ")", 2, 1, true, 1, 0), cljs.core.hash_map("\ufdd0'line", 199)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf", "(a)", 1), cljs.core.hash_map("\ufdd0'line", 199))), cljs.core.hash_map("\ufdd0'line", 199))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [")", 4, 2, false, 1, 0], subpar.core.forward_barf.call(null, "(a b)", 1)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", ")", 4, 2, false, 1, 0), cljs.core.hash_map("\ufdd0'line", 200)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf", "(a b)", 1), cljs.core.hash_map("\ufdd0'line", 200))), cljs.core.hash_map("\ufdd0'line", 200))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [")", 4, 2, false, 2, 0], subpar.core.forward_barf.call(null, "(a\nb)", 1)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", ")", 4, 2, false, 2, 0), cljs.core.hash_map("\ufdd0'line", 201)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf", "(a\nb)", 1), cljs.core.hash_map("\ufdd0'line", 201))), cljs.core.hash_map("\ufdd0'line", 201))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [], subpar.core.forward_barf.call(null, "(a b)", 5)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array"), cljs.core.hash_map("\ufdd0'line", 202)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf", "(a b)", 5), cljs.core.hash_map("\ufdd0'line", 202))), cljs.core.hash_map("\ufdd0'line", 202))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [], subpar.core.forward_barf.call(null, "(a b) ", 5)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array"), cljs.core.hash_map("\ufdd0'line", 203)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf", "(a b) ", 5), cljs.core.hash_map("\ufdd0'line", 203))), cljs.core.hash_map("\ufdd0'line", 203))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, ["]", 5, 4, true, 1, 3], subpar.core.forward_barf.call(null, "(a [b]) ", 4)))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", "]", 5, 4, true, 1, 3), cljs.core.hash_map("\ufdd0'line", 204)), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf", "(a [b]) ", 4), cljs.core.hash_map("\ufdd0'line", 204))), cljs.core.hash_map("\ufdd0'line", 204))))].join(""));
  }
  if(cljs.core.truth_(subpar.test.tests.arr_EQ_.call(null, [true, 1, 4, 2], subpar.core.close_expression.call(null, "[   ]", 1)))) {
    return null
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'arr=", cljs.core.with_meta(cljs.core.list("\ufdd1'array", true, 1, 4, 2), cljs.core.hash_map("\ufdd0'line", 206)), cljs.core.with_meta(cljs.core.list("\ufdd1'close-expression", "[   ]", 1), cljs.core.hash_map("\ufdd0'line", 206))), cljs.core.hash_map("\ufdd0'line", 206))))].join(""));
  }
};
goog.provide("subpar.test");
goog.require("cljs.core");
goog.require("subpar.test.tests");
subpar.test.success = 0;
subpar.test.run = function run() {
  console.log("Subpar tests started.");
  subpar.test.tests.run.call(null);
  return subpar.test.success
};
goog.exportSymbol("subpar.test.run", subpar.test.run);
