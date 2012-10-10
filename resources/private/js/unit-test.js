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
  var x__14438 = x == null ? null : x;
  if(p[goog.typeOf(x__14438)]) {
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
    var G__14439__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__14439 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14439__delegate.call(this, array, i, idxs)
    };
    G__14439.cljs$lang$maxFixedArity = 2;
    G__14439.cljs$lang$applyTo = function(arglist__14440) {
      var array = cljs.core.first(arglist__14440);
      var i = cljs.core.first(cljs.core.next(arglist__14440));
      var idxs = cljs.core.rest(cljs.core.next(arglist__14440));
      return G__14439__delegate(array, i, idxs)
    };
    G__14439.cljs$lang$arity$variadic = G__14439__delegate;
    return G__14439
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
      var and__3822__auto____14525 = this$;
      if(and__3822__auto____14525) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____14525
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____14526 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14527 = cljs.core._invoke[goog.typeOf(x__2363__auto____14526)];
        if(or__3824__auto____14527) {
          return or__3824__auto____14527
        }else {
          var or__3824__auto____14528 = cljs.core._invoke["_"];
          if(or__3824__auto____14528) {
            return or__3824__auto____14528
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____14529 = this$;
      if(and__3822__auto____14529) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____14529
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____14530 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14531 = cljs.core._invoke[goog.typeOf(x__2363__auto____14530)];
        if(or__3824__auto____14531) {
          return or__3824__auto____14531
        }else {
          var or__3824__auto____14532 = cljs.core._invoke["_"];
          if(or__3824__auto____14532) {
            return or__3824__auto____14532
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____14533 = this$;
      if(and__3822__auto____14533) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____14533
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____14534 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14535 = cljs.core._invoke[goog.typeOf(x__2363__auto____14534)];
        if(or__3824__auto____14535) {
          return or__3824__auto____14535
        }else {
          var or__3824__auto____14536 = cljs.core._invoke["_"];
          if(or__3824__auto____14536) {
            return or__3824__auto____14536
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____14537 = this$;
      if(and__3822__auto____14537) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____14537
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____14538 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14539 = cljs.core._invoke[goog.typeOf(x__2363__auto____14538)];
        if(or__3824__auto____14539) {
          return or__3824__auto____14539
        }else {
          var or__3824__auto____14540 = cljs.core._invoke["_"];
          if(or__3824__auto____14540) {
            return or__3824__auto____14540
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____14541 = this$;
      if(and__3822__auto____14541) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____14541
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____14542 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14543 = cljs.core._invoke[goog.typeOf(x__2363__auto____14542)];
        if(or__3824__auto____14543) {
          return or__3824__auto____14543
        }else {
          var or__3824__auto____14544 = cljs.core._invoke["_"];
          if(or__3824__auto____14544) {
            return or__3824__auto____14544
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____14545 = this$;
      if(and__3822__auto____14545) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____14545
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____14546 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14547 = cljs.core._invoke[goog.typeOf(x__2363__auto____14546)];
        if(or__3824__auto____14547) {
          return or__3824__auto____14547
        }else {
          var or__3824__auto____14548 = cljs.core._invoke["_"];
          if(or__3824__auto____14548) {
            return or__3824__auto____14548
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____14549 = this$;
      if(and__3822__auto____14549) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____14549
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____14550 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14551 = cljs.core._invoke[goog.typeOf(x__2363__auto____14550)];
        if(or__3824__auto____14551) {
          return or__3824__auto____14551
        }else {
          var or__3824__auto____14552 = cljs.core._invoke["_"];
          if(or__3824__auto____14552) {
            return or__3824__auto____14552
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____14553 = this$;
      if(and__3822__auto____14553) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____14553
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____14554 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14555 = cljs.core._invoke[goog.typeOf(x__2363__auto____14554)];
        if(or__3824__auto____14555) {
          return or__3824__auto____14555
        }else {
          var or__3824__auto____14556 = cljs.core._invoke["_"];
          if(or__3824__auto____14556) {
            return or__3824__auto____14556
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____14557 = this$;
      if(and__3822__auto____14557) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____14557
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____14558 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14559 = cljs.core._invoke[goog.typeOf(x__2363__auto____14558)];
        if(or__3824__auto____14559) {
          return or__3824__auto____14559
        }else {
          var or__3824__auto____14560 = cljs.core._invoke["_"];
          if(or__3824__auto____14560) {
            return or__3824__auto____14560
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____14561 = this$;
      if(and__3822__auto____14561) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____14561
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____14562 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14563 = cljs.core._invoke[goog.typeOf(x__2363__auto____14562)];
        if(or__3824__auto____14563) {
          return or__3824__auto____14563
        }else {
          var or__3824__auto____14564 = cljs.core._invoke["_"];
          if(or__3824__auto____14564) {
            return or__3824__auto____14564
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____14565 = this$;
      if(and__3822__auto____14565) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____14565
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____14566 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14567 = cljs.core._invoke[goog.typeOf(x__2363__auto____14566)];
        if(or__3824__auto____14567) {
          return or__3824__auto____14567
        }else {
          var or__3824__auto____14568 = cljs.core._invoke["_"];
          if(or__3824__auto____14568) {
            return or__3824__auto____14568
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____14569 = this$;
      if(and__3822__auto____14569) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____14569
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____14570 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14571 = cljs.core._invoke[goog.typeOf(x__2363__auto____14570)];
        if(or__3824__auto____14571) {
          return or__3824__auto____14571
        }else {
          var or__3824__auto____14572 = cljs.core._invoke["_"];
          if(or__3824__auto____14572) {
            return or__3824__auto____14572
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____14573 = this$;
      if(and__3822__auto____14573) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____14573
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____14574 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14575 = cljs.core._invoke[goog.typeOf(x__2363__auto____14574)];
        if(or__3824__auto____14575) {
          return or__3824__auto____14575
        }else {
          var or__3824__auto____14576 = cljs.core._invoke["_"];
          if(or__3824__auto____14576) {
            return or__3824__auto____14576
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____14577 = this$;
      if(and__3822__auto____14577) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____14577
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____14578 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14579 = cljs.core._invoke[goog.typeOf(x__2363__auto____14578)];
        if(or__3824__auto____14579) {
          return or__3824__auto____14579
        }else {
          var or__3824__auto____14580 = cljs.core._invoke["_"];
          if(or__3824__auto____14580) {
            return or__3824__auto____14580
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____14581 = this$;
      if(and__3822__auto____14581) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____14581
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____14582 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14583 = cljs.core._invoke[goog.typeOf(x__2363__auto____14582)];
        if(or__3824__auto____14583) {
          return or__3824__auto____14583
        }else {
          var or__3824__auto____14584 = cljs.core._invoke["_"];
          if(or__3824__auto____14584) {
            return or__3824__auto____14584
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____14585 = this$;
      if(and__3822__auto____14585) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____14585
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____14586 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14587 = cljs.core._invoke[goog.typeOf(x__2363__auto____14586)];
        if(or__3824__auto____14587) {
          return or__3824__auto____14587
        }else {
          var or__3824__auto____14588 = cljs.core._invoke["_"];
          if(or__3824__auto____14588) {
            return or__3824__auto____14588
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____14589 = this$;
      if(and__3822__auto____14589) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____14589
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____14590 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14591 = cljs.core._invoke[goog.typeOf(x__2363__auto____14590)];
        if(or__3824__auto____14591) {
          return or__3824__auto____14591
        }else {
          var or__3824__auto____14592 = cljs.core._invoke["_"];
          if(or__3824__auto____14592) {
            return or__3824__auto____14592
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____14593 = this$;
      if(and__3822__auto____14593) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____14593
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____14594 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14595 = cljs.core._invoke[goog.typeOf(x__2363__auto____14594)];
        if(or__3824__auto____14595) {
          return or__3824__auto____14595
        }else {
          var or__3824__auto____14596 = cljs.core._invoke["_"];
          if(or__3824__auto____14596) {
            return or__3824__auto____14596
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____14597 = this$;
      if(and__3822__auto____14597) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____14597
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____14598 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14599 = cljs.core._invoke[goog.typeOf(x__2363__auto____14598)];
        if(or__3824__auto____14599) {
          return or__3824__auto____14599
        }else {
          var or__3824__auto____14600 = cljs.core._invoke["_"];
          if(or__3824__auto____14600) {
            return or__3824__auto____14600
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____14601 = this$;
      if(and__3822__auto____14601) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____14601
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____14602 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14603 = cljs.core._invoke[goog.typeOf(x__2363__auto____14602)];
        if(or__3824__auto____14603) {
          return or__3824__auto____14603
        }else {
          var or__3824__auto____14604 = cljs.core._invoke["_"];
          if(or__3824__auto____14604) {
            return or__3824__auto____14604
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____14605 = this$;
      if(and__3822__auto____14605) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____14605
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____14606 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14607 = cljs.core._invoke[goog.typeOf(x__2363__auto____14606)];
        if(or__3824__auto____14607) {
          return or__3824__auto____14607
        }else {
          var or__3824__auto____14608 = cljs.core._invoke["_"];
          if(or__3824__auto____14608) {
            return or__3824__auto____14608
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
    var and__3822__auto____14613 = coll;
    if(and__3822__auto____14613) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____14613
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____14614 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14615 = cljs.core._count[goog.typeOf(x__2363__auto____14614)];
      if(or__3824__auto____14615) {
        return or__3824__auto____14615
      }else {
        var or__3824__auto____14616 = cljs.core._count["_"];
        if(or__3824__auto____14616) {
          return or__3824__auto____14616
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
    var and__3822__auto____14621 = coll;
    if(and__3822__auto____14621) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____14621
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____14622 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14623 = cljs.core._empty[goog.typeOf(x__2363__auto____14622)];
      if(or__3824__auto____14623) {
        return or__3824__auto____14623
      }else {
        var or__3824__auto____14624 = cljs.core._empty["_"];
        if(or__3824__auto____14624) {
          return or__3824__auto____14624
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
    var and__3822__auto____14629 = coll;
    if(and__3822__auto____14629) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____14629
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____14630 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14631 = cljs.core._conj[goog.typeOf(x__2363__auto____14630)];
      if(or__3824__auto____14631) {
        return or__3824__auto____14631
      }else {
        var or__3824__auto____14632 = cljs.core._conj["_"];
        if(or__3824__auto____14632) {
          return or__3824__auto____14632
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
      var and__3822__auto____14641 = coll;
      if(and__3822__auto____14641) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____14641
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____14642 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____14643 = cljs.core._nth[goog.typeOf(x__2363__auto____14642)];
        if(or__3824__auto____14643) {
          return or__3824__auto____14643
        }else {
          var or__3824__auto____14644 = cljs.core._nth["_"];
          if(or__3824__auto____14644) {
            return or__3824__auto____14644
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____14645 = coll;
      if(and__3822__auto____14645) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____14645
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____14646 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____14647 = cljs.core._nth[goog.typeOf(x__2363__auto____14646)];
        if(or__3824__auto____14647) {
          return or__3824__auto____14647
        }else {
          var or__3824__auto____14648 = cljs.core._nth["_"];
          if(or__3824__auto____14648) {
            return or__3824__auto____14648
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
    var and__3822__auto____14653 = coll;
    if(and__3822__auto____14653) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____14653
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____14654 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14655 = cljs.core._first[goog.typeOf(x__2363__auto____14654)];
      if(or__3824__auto____14655) {
        return or__3824__auto____14655
      }else {
        var or__3824__auto____14656 = cljs.core._first["_"];
        if(or__3824__auto____14656) {
          return or__3824__auto____14656
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____14661 = coll;
    if(and__3822__auto____14661) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____14661
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____14662 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14663 = cljs.core._rest[goog.typeOf(x__2363__auto____14662)];
      if(or__3824__auto____14663) {
        return or__3824__auto____14663
      }else {
        var or__3824__auto____14664 = cljs.core._rest["_"];
        if(or__3824__auto____14664) {
          return or__3824__auto____14664
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
    var and__3822__auto____14669 = coll;
    if(and__3822__auto____14669) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____14669
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____14670 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14671 = cljs.core._next[goog.typeOf(x__2363__auto____14670)];
      if(or__3824__auto____14671) {
        return or__3824__auto____14671
      }else {
        var or__3824__auto____14672 = cljs.core._next["_"];
        if(or__3824__auto____14672) {
          return or__3824__auto____14672
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
      var and__3822__auto____14681 = o;
      if(and__3822__auto____14681) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____14681
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____14682 = o == null ? null : o;
      return function() {
        var or__3824__auto____14683 = cljs.core._lookup[goog.typeOf(x__2363__auto____14682)];
        if(or__3824__auto____14683) {
          return or__3824__auto____14683
        }else {
          var or__3824__auto____14684 = cljs.core._lookup["_"];
          if(or__3824__auto____14684) {
            return or__3824__auto____14684
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____14685 = o;
      if(and__3822__auto____14685) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____14685
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____14686 = o == null ? null : o;
      return function() {
        var or__3824__auto____14687 = cljs.core._lookup[goog.typeOf(x__2363__auto____14686)];
        if(or__3824__auto____14687) {
          return or__3824__auto____14687
        }else {
          var or__3824__auto____14688 = cljs.core._lookup["_"];
          if(or__3824__auto____14688) {
            return or__3824__auto____14688
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
    var and__3822__auto____14693 = coll;
    if(and__3822__auto____14693) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____14693
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____14694 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14695 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____14694)];
      if(or__3824__auto____14695) {
        return or__3824__auto____14695
      }else {
        var or__3824__auto____14696 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____14696) {
          return or__3824__auto____14696
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____14701 = coll;
    if(and__3822__auto____14701) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____14701
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____14702 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14703 = cljs.core._assoc[goog.typeOf(x__2363__auto____14702)];
      if(or__3824__auto____14703) {
        return or__3824__auto____14703
      }else {
        var or__3824__auto____14704 = cljs.core._assoc["_"];
        if(or__3824__auto____14704) {
          return or__3824__auto____14704
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
    var and__3822__auto____14709 = coll;
    if(and__3822__auto____14709) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____14709
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____14710 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14711 = cljs.core._dissoc[goog.typeOf(x__2363__auto____14710)];
      if(or__3824__auto____14711) {
        return or__3824__auto____14711
      }else {
        var or__3824__auto____14712 = cljs.core._dissoc["_"];
        if(or__3824__auto____14712) {
          return or__3824__auto____14712
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
    var and__3822__auto____14717 = coll;
    if(and__3822__auto____14717) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____14717
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____14718 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14719 = cljs.core._key[goog.typeOf(x__2363__auto____14718)];
      if(or__3824__auto____14719) {
        return or__3824__auto____14719
      }else {
        var or__3824__auto____14720 = cljs.core._key["_"];
        if(or__3824__auto____14720) {
          return or__3824__auto____14720
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____14725 = coll;
    if(and__3822__auto____14725) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____14725
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____14726 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14727 = cljs.core._val[goog.typeOf(x__2363__auto____14726)];
      if(or__3824__auto____14727) {
        return or__3824__auto____14727
      }else {
        var or__3824__auto____14728 = cljs.core._val["_"];
        if(or__3824__auto____14728) {
          return or__3824__auto____14728
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
    var and__3822__auto____14733 = coll;
    if(and__3822__auto____14733) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____14733
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____14734 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14735 = cljs.core._disjoin[goog.typeOf(x__2363__auto____14734)];
      if(or__3824__auto____14735) {
        return or__3824__auto____14735
      }else {
        var or__3824__auto____14736 = cljs.core._disjoin["_"];
        if(or__3824__auto____14736) {
          return or__3824__auto____14736
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
    var and__3822__auto____14741 = coll;
    if(and__3822__auto____14741) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____14741
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____14742 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14743 = cljs.core._peek[goog.typeOf(x__2363__auto____14742)];
      if(or__3824__auto____14743) {
        return or__3824__auto____14743
      }else {
        var or__3824__auto____14744 = cljs.core._peek["_"];
        if(or__3824__auto____14744) {
          return or__3824__auto____14744
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____14749 = coll;
    if(and__3822__auto____14749) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____14749
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____14750 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14751 = cljs.core._pop[goog.typeOf(x__2363__auto____14750)];
      if(or__3824__auto____14751) {
        return or__3824__auto____14751
      }else {
        var or__3824__auto____14752 = cljs.core._pop["_"];
        if(or__3824__auto____14752) {
          return or__3824__auto____14752
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
    var and__3822__auto____14757 = coll;
    if(and__3822__auto____14757) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____14757
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____14758 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14759 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____14758)];
      if(or__3824__auto____14759) {
        return or__3824__auto____14759
      }else {
        var or__3824__auto____14760 = cljs.core._assoc_n["_"];
        if(or__3824__auto____14760) {
          return or__3824__auto____14760
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
    var and__3822__auto____14765 = o;
    if(and__3822__auto____14765) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____14765
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____14766 = o == null ? null : o;
    return function() {
      var or__3824__auto____14767 = cljs.core._deref[goog.typeOf(x__2363__auto____14766)];
      if(or__3824__auto____14767) {
        return or__3824__auto____14767
      }else {
        var or__3824__auto____14768 = cljs.core._deref["_"];
        if(or__3824__auto____14768) {
          return or__3824__auto____14768
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
    var and__3822__auto____14773 = o;
    if(and__3822__auto____14773) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____14773
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____14774 = o == null ? null : o;
    return function() {
      var or__3824__auto____14775 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____14774)];
      if(or__3824__auto____14775) {
        return or__3824__auto____14775
      }else {
        var or__3824__auto____14776 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____14776) {
          return or__3824__auto____14776
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
    var and__3822__auto____14781 = o;
    if(and__3822__auto____14781) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____14781
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____14782 = o == null ? null : o;
    return function() {
      var or__3824__auto____14783 = cljs.core._meta[goog.typeOf(x__2363__auto____14782)];
      if(or__3824__auto____14783) {
        return or__3824__auto____14783
      }else {
        var or__3824__auto____14784 = cljs.core._meta["_"];
        if(or__3824__auto____14784) {
          return or__3824__auto____14784
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
    var and__3822__auto____14789 = o;
    if(and__3822__auto____14789) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____14789
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____14790 = o == null ? null : o;
    return function() {
      var or__3824__auto____14791 = cljs.core._with_meta[goog.typeOf(x__2363__auto____14790)];
      if(or__3824__auto____14791) {
        return or__3824__auto____14791
      }else {
        var or__3824__auto____14792 = cljs.core._with_meta["_"];
        if(or__3824__auto____14792) {
          return or__3824__auto____14792
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
      var and__3822__auto____14801 = coll;
      if(and__3822__auto____14801) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____14801
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____14802 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____14803 = cljs.core._reduce[goog.typeOf(x__2363__auto____14802)];
        if(or__3824__auto____14803) {
          return or__3824__auto____14803
        }else {
          var or__3824__auto____14804 = cljs.core._reduce["_"];
          if(or__3824__auto____14804) {
            return or__3824__auto____14804
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____14805 = coll;
      if(and__3822__auto____14805) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____14805
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____14806 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____14807 = cljs.core._reduce[goog.typeOf(x__2363__auto____14806)];
        if(or__3824__auto____14807) {
          return or__3824__auto____14807
        }else {
          var or__3824__auto____14808 = cljs.core._reduce["_"];
          if(or__3824__auto____14808) {
            return or__3824__auto____14808
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
    var and__3822__auto____14813 = coll;
    if(and__3822__auto____14813) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____14813
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____14814 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14815 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____14814)];
      if(or__3824__auto____14815) {
        return or__3824__auto____14815
      }else {
        var or__3824__auto____14816 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____14816) {
          return or__3824__auto____14816
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
    var and__3822__auto____14821 = o;
    if(and__3822__auto____14821) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____14821
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____14822 = o == null ? null : o;
    return function() {
      var or__3824__auto____14823 = cljs.core._equiv[goog.typeOf(x__2363__auto____14822)];
      if(or__3824__auto____14823) {
        return or__3824__auto____14823
      }else {
        var or__3824__auto____14824 = cljs.core._equiv["_"];
        if(or__3824__auto____14824) {
          return or__3824__auto____14824
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
    var and__3822__auto____14829 = o;
    if(and__3822__auto____14829) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____14829
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____14830 = o == null ? null : o;
    return function() {
      var or__3824__auto____14831 = cljs.core._hash[goog.typeOf(x__2363__auto____14830)];
      if(or__3824__auto____14831) {
        return or__3824__auto____14831
      }else {
        var or__3824__auto____14832 = cljs.core._hash["_"];
        if(or__3824__auto____14832) {
          return or__3824__auto____14832
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
    var and__3822__auto____14837 = o;
    if(and__3822__auto____14837) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____14837
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____14838 = o == null ? null : o;
    return function() {
      var or__3824__auto____14839 = cljs.core._seq[goog.typeOf(x__2363__auto____14838)];
      if(or__3824__auto____14839) {
        return or__3824__auto____14839
      }else {
        var or__3824__auto____14840 = cljs.core._seq["_"];
        if(or__3824__auto____14840) {
          return or__3824__auto____14840
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
    var and__3822__auto____14845 = coll;
    if(and__3822__auto____14845) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____14845
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____14846 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14847 = cljs.core._rseq[goog.typeOf(x__2363__auto____14846)];
      if(or__3824__auto____14847) {
        return or__3824__auto____14847
      }else {
        var or__3824__auto____14848 = cljs.core._rseq["_"];
        if(or__3824__auto____14848) {
          return or__3824__auto____14848
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
    var and__3822__auto____14853 = coll;
    if(and__3822__auto____14853) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____14853
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____14854 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14855 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____14854)];
      if(or__3824__auto____14855) {
        return or__3824__auto____14855
      }else {
        var or__3824__auto____14856 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____14856) {
          return or__3824__auto____14856
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____14861 = coll;
    if(and__3822__auto____14861) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____14861
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____14862 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14863 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____14862)];
      if(or__3824__auto____14863) {
        return or__3824__auto____14863
      }else {
        var or__3824__auto____14864 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____14864) {
          return or__3824__auto____14864
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____14869 = coll;
    if(and__3822__auto____14869) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____14869
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____14870 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14871 = cljs.core._entry_key[goog.typeOf(x__2363__auto____14870)];
      if(or__3824__auto____14871) {
        return or__3824__auto____14871
      }else {
        var or__3824__auto____14872 = cljs.core._entry_key["_"];
        if(or__3824__auto____14872) {
          return or__3824__auto____14872
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____14877 = coll;
    if(and__3822__auto____14877) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____14877
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____14878 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14879 = cljs.core._comparator[goog.typeOf(x__2363__auto____14878)];
      if(or__3824__auto____14879) {
        return or__3824__auto____14879
      }else {
        var or__3824__auto____14880 = cljs.core._comparator["_"];
        if(or__3824__auto____14880) {
          return or__3824__auto____14880
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
    var and__3822__auto____14885 = o;
    if(and__3822__auto____14885) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____14885
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____14886 = o == null ? null : o;
    return function() {
      var or__3824__auto____14887 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____14886)];
      if(or__3824__auto____14887) {
        return or__3824__auto____14887
      }else {
        var or__3824__auto____14888 = cljs.core._pr_seq["_"];
        if(or__3824__auto____14888) {
          return or__3824__auto____14888
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
    var and__3822__auto____14893 = d;
    if(and__3822__auto____14893) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____14893
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____14894 = d == null ? null : d;
    return function() {
      var or__3824__auto____14895 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____14894)];
      if(or__3824__auto____14895) {
        return or__3824__auto____14895
      }else {
        var or__3824__auto____14896 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____14896) {
          return or__3824__auto____14896
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
    var and__3822__auto____14901 = this$;
    if(and__3822__auto____14901) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____14901
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____14902 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14903 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____14902)];
      if(or__3824__auto____14903) {
        return or__3824__auto____14903
      }else {
        var or__3824__auto____14904 = cljs.core._notify_watches["_"];
        if(or__3824__auto____14904) {
          return or__3824__auto____14904
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____14909 = this$;
    if(and__3822__auto____14909) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____14909
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____14910 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14911 = cljs.core._add_watch[goog.typeOf(x__2363__auto____14910)];
      if(or__3824__auto____14911) {
        return or__3824__auto____14911
      }else {
        var or__3824__auto____14912 = cljs.core._add_watch["_"];
        if(or__3824__auto____14912) {
          return or__3824__auto____14912
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____14917 = this$;
    if(and__3822__auto____14917) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____14917
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____14918 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14919 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____14918)];
      if(or__3824__auto____14919) {
        return or__3824__auto____14919
      }else {
        var or__3824__auto____14920 = cljs.core._remove_watch["_"];
        if(or__3824__auto____14920) {
          return or__3824__auto____14920
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
    var and__3822__auto____14925 = coll;
    if(and__3822__auto____14925) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____14925
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____14926 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14927 = cljs.core._as_transient[goog.typeOf(x__2363__auto____14926)];
      if(or__3824__auto____14927) {
        return or__3824__auto____14927
      }else {
        var or__3824__auto____14928 = cljs.core._as_transient["_"];
        if(or__3824__auto____14928) {
          return or__3824__auto____14928
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
    var and__3822__auto____14933 = tcoll;
    if(and__3822__auto____14933) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____14933
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____14934 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14935 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____14934)];
      if(or__3824__auto____14935) {
        return or__3824__auto____14935
      }else {
        var or__3824__auto____14936 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____14936) {
          return or__3824__auto____14936
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____14941 = tcoll;
    if(and__3822__auto____14941) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____14941
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____14942 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14943 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____14942)];
      if(or__3824__auto____14943) {
        return or__3824__auto____14943
      }else {
        var or__3824__auto____14944 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____14944) {
          return or__3824__auto____14944
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
    var and__3822__auto____14949 = tcoll;
    if(and__3822__auto____14949) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____14949
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____14950 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14951 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____14950)];
      if(or__3824__auto____14951) {
        return or__3824__auto____14951
      }else {
        var or__3824__auto____14952 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____14952) {
          return or__3824__auto____14952
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
    var and__3822__auto____14957 = tcoll;
    if(and__3822__auto____14957) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____14957
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____14958 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14959 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____14958)];
      if(or__3824__auto____14959) {
        return or__3824__auto____14959
      }else {
        var or__3824__auto____14960 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____14960) {
          return or__3824__auto____14960
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
    var and__3822__auto____14965 = tcoll;
    if(and__3822__auto____14965) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____14965
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____14966 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14967 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____14966)];
      if(or__3824__auto____14967) {
        return or__3824__auto____14967
      }else {
        var or__3824__auto____14968 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____14968) {
          return or__3824__auto____14968
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____14973 = tcoll;
    if(and__3822__auto____14973) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____14973
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____14974 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14975 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____14974)];
      if(or__3824__auto____14975) {
        return or__3824__auto____14975
      }else {
        var or__3824__auto____14976 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____14976) {
          return or__3824__auto____14976
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
    var and__3822__auto____14981 = tcoll;
    if(and__3822__auto____14981) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____14981
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____14982 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14983 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____14982)];
      if(or__3824__auto____14983) {
        return or__3824__auto____14983
      }else {
        var or__3824__auto____14984 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____14984) {
          return or__3824__auto____14984
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
    var and__3822__auto____14989 = x;
    if(and__3822__auto____14989) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____14989
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____14990 = x == null ? null : x;
    return function() {
      var or__3824__auto____14991 = cljs.core._compare[goog.typeOf(x__2363__auto____14990)];
      if(or__3824__auto____14991) {
        return or__3824__auto____14991
      }else {
        var or__3824__auto____14992 = cljs.core._compare["_"];
        if(or__3824__auto____14992) {
          return or__3824__auto____14992
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
    var and__3822__auto____14997 = coll;
    if(and__3822__auto____14997) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____14997
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____14998 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14999 = cljs.core._drop_first[goog.typeOf(x__2363__auto____14998)];
      if(or__3824__auto____14999) {
        return or__3824__auto____14999
      }else {
        var or__3824__auto____15000 = cljs.core._drop_first["_"];
        if(or__3824__auto____15000) {
          return or__3824__auto____15000
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
    var and__3822__auto____15005 = coll;
    if(and__3822__auto____15005) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____15005
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____15006 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15007 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____15006)];
      if(or__3824__auto____15007) {
        return or__3824__auto____15007
      }else {
        var or__3824__auto____15008 = cljs.core._chunked_first["_"];
        if(or__3824__auto____15008) {
          return or__3824__auto____15008
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____15013 = coll;
    if(and__3822__auto____15013) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____15013
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____15014 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15015 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____15014)];
      if(or__3824__auto____15015) {
        return or__3824__auto____15015
      }else {
        var or__3824__auto____15016 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____15016) {
          return or__3824__auto____15016
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
    var and__3822__auto____15021 = coll;
    if(and__3822__auto____15021) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____15021
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____15022 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15023 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____15022)];
      if(or__3824__auto____15023) {
        return or__3824__auto____15023
      }else {
        var or__3824__auto____15024 = cljs.core._chunked_next["_"];
        if(or__3824__auto____15024) {
          return or__3824__auto____15024
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
    var or__3824__auto____15026 = x === y;
    if(or__3824__auto____15026) {
      return or__3824__auto____15026
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__15027__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__15028 = y;
            var G__15029 = cljs.core.first.call(null, more);
            var G__15030 = cljs.core.next.call(null, more);
            x = G__15028;
            y = G__15029;
            more = G__15030;
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
    var G__15027 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15027__delegate.call(this, x, y, more)
    };
    G__15027.cljs$lang$maxFixedArity = 2;
    G__15027.cljs$lang$applyTo = function(arglist__15031) {
      var x = cljs.core.first(arglist__15031);
      var y = cljs.core.first(cljs.core.next(arglist__15031));
      var more = cljs.core.rest(cljs.core.next(arglist__15031));
      return G__15027__delegate(x, y, more)
    };
    G__15027.cljs$lang$arity$variadic = G__15027__delegate;
    return G__15027
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
  var G__15032 = null;
  var G__15032__2 = function(o, k) {
    return null
  };
  var G__15032__3 = function(o, k, not_found) {
    return not_found
  };
  G__15032 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15032__2.call(this, o, k);
      case 3:
        return G__15032__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15032
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
  var G__15033 = null;
  var G__15033__2 = function(_, f) {
    return f.call(null)
  };
  var G__15033__3 = function(_, f, start) {
    return start
  };
  G__15033 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__15033__2.call(this, _, f);
      case 3:
        return G__15033__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15033
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
  var G__15034 = null;
  var G__15034__2 = function(_, n) {
    return null
  };
  var G__15034__3 = function(_, n, not_found) {
    return not_found
  };
  G__15034 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15034__2.call(this, _, n);
      case 3:
        return G__15034__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15034
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
  var and__3822__auto____15035 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____15035) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____15035
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
    var cnt__15048 = cljs.core._count.call(null, cicoll);
    if(cnt__15048 === 0) {
      return f.call(null)
    }else {
      var val__15049 = cljs.core._nth.call(null, cicoll, 0);
      var n__15050 = 1;
      while(true) {
        if(n__15050 < cnt__15048) {
          var nval__15051 = f.call(null, val__15049, cljs.core._nth.call(null, cicoll, n__15050));
          if(cljs.core.reduced_QMARK_.call(null, nval__15051)) {
            return cljs.core.deref.call(null, nval__15051)
          }else {
            var G__15060 = nval__15051;
            var G__15061 = n__15050 + 1;
            val__15049 = G__15060;
            n__15050 = G__15061;
            continue
          }
        }else {
          return val__15049
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__15052 = cljs.core._count.call(null, cicoll);
    var val__15053 = val;
    var n__15054 = 0;
    while(true) {
      if(n__15054 < cnt__15052) {
        var nval__15055 = f.call(null, val__15053, cljs.core._nth.call(null, cicoll, n__15054));
        if(cljs.core.reduced_QMARK_.call(null, nval__15055)) {
          return cljs.core.deref.call(null, nval__15055)
        }else {
          var G__15062 = nval__15055;
          var G__15063 = n__15054 + 1;
          val__15053 = G__15062;
          n__15054 = G__15063;
          continue
        }
      }else {
        return val__15053
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__15056 = cljs.core._count.call(null, cicoll);
    var val__15057 = val;
    var n__15058 = idx;
    while(true) {
      if(n__15058 < cnt__15056) {
        var nval__15059 = f.call(null, val__15057, cljs.core._nth.call(null, cicoll, n__15058));
        if(cljs.core.reduced_QMARK_.call(null, nval__15059)) {
          return cljs.core.deref.call(null, nval__15059)
        }else {
          var G__15064 = nval__15059;
          var G__15065 = n__15058 + 1;
          val__15057 = G__15064;
          n__15058 = G__15065;
          continue
        }
      }else {
        return val__15057
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
    var cnt__15078 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__15079 = arr[0];
      var n__15080 = 1;
      while(true) {
        if(n__15080 < cnt__15078) {
          var nval__15081 = f.call(null, val__15079, arr[n__15080]);
          if(cljs.core.reduced_QMARK_.call(null, nval__15081)) {
            return cljs.core.deref.call(null, nval__15081)
          }else {
            var G__15090 = nval__15081;
            var G__15091 = n__15080 + 1;
            val__15079 = G__15090;
            n__15080 = G__15091;
            continue
          }
        }else {
          return val__15079
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__15082 = arr.length;
    var val__15083 = val;
    var n__15084 = 0;
    while(true) {
      if(n__15084 < cnt__15082) {
        var nval__15085 = f.call(null, val__15083, arr[n__15084]);
        if(cljs.core.reduced_QMARK_.call(null, nval__15085)) {
          return cljs.core.deref.call(null, nval__15085)
        }else {
          var G__15092 = nval__15085;
          var G__15093 = n__15084 + 1;
          val__15083 = G__15092;
          n__15084 = G__15093;
          continue
        }
      }else {
        return val__15083
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__15086 = arr.length;
    var val__15087 = val;
    var n__15088 = idx;
    while(true) {
      if(n__15088 < cnt__15086) {
        var nval__15089 = f.call(null, val__15087, arr[n__15088]);
        if(cljs.core.reduced_QMARK_.call(null, nval__15089)) {
          return cljs.core.deref.call(null, nval__15089)
        }else {
          var G__15094 = nval__15089;
          var G__15095 = n__15088 + 1;
          val__15087 = G__15094;
          n__15088 = G__15095;
          continue
        }
      }else {
        return val__15087
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
  var this__15096 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__15097 = this;
  if(this__15097.i + 1 < this__15097.a.length) {
    return new cljs.core.IndexedSeq(this__15097.a, this__15097.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15098 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__15099 = this;
  var c__15100 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__15100 > 0) {
    return new cljs.core.RSeq(coll, c__15100 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__15101 = this;
  var this__15102 = this;
  return cljs.core.pr_str.call(null, this__15102)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__15103 = this;
  if(cljs.core.counted_QMARK_.call(null, this__15103.a)) {
    return cljs.core.ci_reduce.call(null, this__15103.a, f, this__15103.a[this__15103.i], this__15103.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__15103.a[this__15103.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__15104 = this;
  if(cljs.core.counted_QMARK_.call(null, this__15104.a)) {
    return cljs.core.ci_reduce.call(null, this__15104.a, f, start, this__15104.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__15105 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__15106 = this;
  return this__15106.a.length - this__15106.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__15107 = this;
  return this__15107.a[this__15107.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__15108 = this;
  if(this__15108.i + 1 < this__15108.a.length) {
    return new cljs.core.IndexedSeq(this__15108.a, this__15108.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15109 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15110 = this;
  var i__15111 = n + this__15110.i;
  if(i__15111 < this__15110.a.length) {
    return this__15110.a[i__15111]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15112 = this;
  var i__15113 = n + this__15112.i;
  if(i__15113 < this__15112.a.length) {
    return this__15112.a[i__15113]
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
  var G__15114 = null;
  var G__15114__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__15114__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__15114 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__15114__2.call(this, array, f);
      case 3:
        return G__15114__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15114
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__15115 = null;
  var G__15115__2 = function(array, k) {
    return array[k]
  };
  var G__15115__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__15115 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15115__2.call(this, array, k);
      case 3:
        return G__15115__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15115
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__15116 = null;
  var G__15116__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__15116__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__15116 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15116__2.call(this, array, n);
      case 3:
        return G__15116__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15116
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
  var this__15117 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15118 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__15119 = this;
  var this__15120 = this;
  return cljs.core.pr_str.call(null, this__15120)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15121 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15122 = this;
  return this__15122.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15123 = this;
  return cljs.core._nth.call(null, this__15123.ci, this__15123.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15124 = this;
  if(this__15124.i > 0) {
    return new cljs.core.RSeq(this__15124.ci, this__15124.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15125 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__15126 = this;
  return new cljs.core.RSeq(this__15126.ci, this__15126.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15127 = this;
  return this__15127.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__15131__15132 = coll;
      if(G__15131__15132) {
        if(function() {
          var or__3824__auto____15133 = G__15131__15132.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____15133) {
            return or__3824__auto____15133
          }else {
            return G__15131__15132.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__15131__15132.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__15131__15132)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__15131__15132)
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
      var G__15138__15139 = coll;
      if(G__15138__15139) {
        if(function() {
          var or__3824__auto____15140 = G__15138__15139.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____15140) {
            return or__3824__auto____15140
          }else {
            return G__15138__15139.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__15138__15139.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15138__15139)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15138__15139)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__15141 = cljs.core.seq.call(null, coll);
      if(s__15141 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__15141)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__15146__15147 = coll;
      if(G__15146__15147) {
        if(function() {
          var or__3824__auto____15148 = G__15146__15147.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____15148) {
            return or__3824__auto____15148
          }else {
            return G__15146__15147.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__15146__15147.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15146__15147)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15146__15147)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__15149 = cljs.core.seq.call(null, coll);
      if(!(s__15149 == null)) {
        return cljs.core._rest.call(null, s__15149)
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
      var G__15153__15154 = coll;
      if(G__15153__15154) {
        if(function() {
          var or__3824__auto____15155 = G__15153__15154.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____15155) {
            return or__3824__auto____15155
          }else {
            return G__15153__15154.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__15153__15154.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__15153__15154)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__15153__15154)
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
    var sn__15157 = cljs.core.next.call(null, s);
    if(!(sn__15157 == null)) {
      var G__15158 = sn__15157;
      s = G__15158;
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
    var G__15159__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__15160 = conj.call(null, coll, x);
          var G__15161 = cljs.core.first.call(null, xs);
          var G__15162 = cljs.core.next.call(null, xs);
          coll = G__15160;
          x = G__15161;
          xs = G__15162;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__15159 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15159__delegate.call(this, coll, x, xs)
    };
    G__15159.cljs$lang$maxFixedArity = 2;
    G__15159.cljs$lang$applyTo = function(arglist__15163) {
      var coll = cljs.core.first(arglist__15163);
      var x = cljs.core.first(cljs.core.next(arglist__15163));
      var xs = cljs.core.rest(cljs.core.next(arglist__15163));
      return G__15159__delegate(coll, x, xs)
    };
    G__15159.cljs$lang$arity$variadic = G__15159__delegate;
    return G__15159
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
  var s__15166 = cljs.core.seq.call(null, coll);
  var acc__15167 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__15166)) {
      return acc__15167 + cljs.core._count.call(null, s__15166)
    }else {
      var G__15168 = cljs.core.next.call(null, s__15166);
      var G__15169 = acc__15167 + 1;
      s__15166 = G__15168;
      acc__15167 = G__15169;
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
        var G__15176__15177 = coll;
        if(G__15176__15177) {
          if(function() {
            var or__3824__auto____15178 = G__15176__15177.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____15178) {
              return or__3824__auto____15178
            }else {
              return G__15176__15177.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__15176__15177.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15176__15177)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15176__15177)
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
        var G__15179__15180 = coll;
        if(G__15179__15180) {
          if(function() {
            var or__3824__auto____15181 = G__15179__15180.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____15181) {
              return or__3824__auto____15181
            }else {
              return G__15179__15180.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__15179__15180.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15179__15180)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15179__15180)
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
    var G__15184__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__15183 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__15185 = ret__15183;
          var G__15186 = cljs.core.first.call(null, kvs);
          var G__15187 = cljs.core.second.call(null, kvs);
          var G__15188 = cljs.core.nnext.call(null, kvs);
          coll = G__15185;
          k = G__15186;
          v = G__15187;
          kvs = G__15188;
          continue
        }else {
          return ret__15183
        }
        break
      }
    };
    var G__15184 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15184__delegate.call(this, coll, k, v, kvs)
    };
    G__15184.cljs$lang$maxFixedArity = 3;
    G__15184.cljs$lang$applyTo = function(arglist__15189) {
      var coll = cljs.core.first(arglist__15189);
      var k = cljs.core.first(cljs.core.next(arglist__15189));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15189)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15189)));
      return G__15184__delegate(coll, k, v, kvs)
    };
    G__15184.cljs$lang$arity$variadic = G__15184__delegate;
    return G__15184
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
    var G__15192__delegate = function(coll, k, ks) {
      while(true) {
        var ret__15191 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__15193 = ret__15191;
          var G__15194 = cljs.core.first.call(null, ks);
          var G__15195 = cljs.core.next.call(null, ks);
          coll = G__15193;
          k = G__15194;
          ks = G__15195;
          continue
        }else {
          return ret__15191
        }
        break
      }
    };
    var G__15192 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15192__delegate.call(this, coll, k, ks)
    };
    G__15192.cljs$lang$maxFixedArity = 2;
    G__15192.cljs$lang$applyTo = function(arglist__15196) {
      var coll = cljs.core.first(arglist__15196);
      var k = cljs.core.first(cljs.core.next(arglist__15196));
      var ks = cljs.core.rest(cljs.core.next(arglist__15196));
      return G__15192__delegate(coll, k, ks)
    };
    G__15192.cljs$lang$arity$variadic = G__15192__delegate;
    return G__15192
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
    var G__15200__15201 = o;
    if(G__15200__15201) {
      if(function() {
        var or__3824__auto____15202 = G__15200__15201.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____15202) {
          return or__3824__auto____15202
        }else {
          return G__15200__15201.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__15200__15201.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__15200__15201)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__15200__15201)
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
    var G__15205__delegate = function(coll, k, ks) {
      while(true) {
        var ret__15204 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__15206 = ret__15204;
          var G__15207 = cljs.core.first.call(null, ks);
          var G__15208 = cljs.core.next.call(null, ks);
          coll = G__15206;
          k = G__15207;
          ks = G__15208;
          continue
        }else {
          return ret__15204
        }
        break
      }
    };
    var G__15205 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15205__delegate.call(this, coll, k, ks)
    };
    G__15205.cljs$lang$maxFixedArity = 2;
    G__15205.cljs$lang$applyTo = function(arglist__15209) {
      var coll = cljs.core.first(arglist__15209);
      var k = cljs.core.first(cljs.core.next(arglist__15209));
      var ks = cljs.core.rest(cljs.core.next(arglist__15209));
      return G__15205__delegate(coll, k, ks)
    };
    G__15205.cljs$lang$arity$variadic = G__15205__delegate;
    return G__15205
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
  var h__15211 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__15211;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__15211
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__15213 = cljs.core.string_hash_cache[k];
  if(!(h__15213 == null)) {
    return h__15213
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
      var and__3822__auto____15215 = goog.isString(o);
      if(and__3822__auto____15215) {
        return check_cache
      }else {
        return and__3822__auto____15215
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
    var G__15219__15220 = x;
    if(G__15219__15220) {
      if(function() {
        var or__3824__auto____15221 = G__15219__15220.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____15221) {
          return or__3824__auto____15221
        }else {
          return G__15219__15220.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__15219__15220.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__15219__15220)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__15219__15220)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__15225__15226 = x;
    if(G__15225__15226) {
      if(function() {
        var or__3824__auto____15227 = G__15225__15226.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____15227) {
          return or__3824__auto____15227
        }else {
          return G__15225__15226.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__15225__15226.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__15225__15226)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__15225__15226)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__15231__15232 = x;
  if(G__15231__15232) {
    if(function() {
      var or__3824__auto____15233 = G__15231__15232.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____15233) {
        return or__3824__auto____15233
      }else {
        return G__15231__15232.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__15231__15232.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__15231__15232)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__15231__15232)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__15237__15238 = x;
  if(G__15237__15238) {
    if(function() {
      var or__3824__auto____15239 = G__15237__15238.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____15239) {
        return or__3824__auto____15239
      }else {
        return G__15237__15238.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__15237__15238.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__15237__15238)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__15237__15238)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__15243__15244 = x;
  if(G__15243__15244) {
    if(function() {
      var or__3824__auto____15245 = G__15243__15244.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____15245) {
        return or__3824__auto____15245
      }else {
        return G__15243__15244.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__15243__15244.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__15243__15244)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__15243__15244)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__15249__15250 = x;
  if(G__15249__15250) {
    if(function() {
      var or__3824__auto____15251 = G__15249__15250.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____15251) {
        return or__3824__auto____15251
      }else {
        return G__15249__15250.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__15249__15250.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15249__15250)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15249__15250)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__15255__15256 = x;
  if(G__15255__15256) {
    if(function() {
      var or__3824__auto____15257 = G__15255__15256.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____15257) {
        return or__3824__auto____15257
      }else {
        return G__15255__15256.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__15255__15256.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15255__15256)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15255__15256)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__15261__15262 = x;
    if(G__15261__15262) {
      if(function() {
        var or__3824__auto____15263 = G__15261__15262.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____15263) {
          return or__3824__auto____15263
        }else {
          return G__15261__15262.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__15261__15262.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__15261__15262)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__15261__15262)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__15267__15268 = x;
  if(G__15267__15268) {
    if(function() {
      var or__3824__auto____15269 = G__15267__15268.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____15269) {
        return or__3824__auto____15269
      }else {
        return G__15267__15268.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__15267__15268.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__15267__15268)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__15267__15268)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__15273__15274 = x;
  if(G__15273__15274) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____15275 = null;
      if(cljs.core.truth_(or__3824__auto____15275)) {
        return or__3824__auto____15275
      }else {
        return G__15273__15274.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__15273__15274.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__15273__15274)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__15273__15274)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__15276__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__15276 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__15276__delegate.call(this, keyvals)
    };
    G__15276.cljs$lang$maxFixedArity = 0;
    G__15276.cljs$lang$applyTo = function(arglist__15277) {
      var keyvals = cljs.core.seq(arglist__15277);
      return G__15276__delegate(keyvals)
    };
    G__15276.cljs$lang$arity$variadic = G__15276__delegate;
    return G__15276
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
  var keys__15279 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__15279.push(key)
  });
  return keys__15279
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__15283 = i;
  var j__15284 = j;
  var len__15285 = len;
  while(true) {
    if(len__15285 === 0) {
      return to
    }else {
      to[j__15284] = from[i__15283];
      var G__15286 = i__15283 + 1;
      var G__15287 = j__15284 + 1;
      var G__15288 = len__15285 - 1;
      i__15283 = G__15286;
      j__15284 = G__15287;
      len__15285 = G__15288;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__15292 = i + (len - 1);
  var j__15293 = j + (len - 1);
  var len__15294 = len;
  while(true) {
    if(len__15294 === 0) {
      return to
    }else {
      to[j__15293] = from[i__15292];
      var G__15295 = i__15292 - 1;
      var G__15296 = j__15293 - 1;
      var G__15297 = len__15294 - 1;
      i__15292 = G__15295;
      j__15293 = G__15296;
      len__15294 = G__15297;
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
    var G__15301__15302 = s;
    if(G__15301__15302) {
      if(function() {
        var or__3824__auto____15303 = G__15301__15302.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____15303) {
          return or__3824__auto____15303
        }else {
          return G__15301__15302.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__15301__15302.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15301__15302)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15301__15302)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__15307__15308 = s;
  if(G__15307__15308) {
    if(function() {
      var or__3824__auto____15309 = G__15307__15308.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____15309) {
        return or__3824__auto____15309
      }else {
        return G__15307__15308.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__15307__15308.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__15307__15308)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__15307__15308)
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
  var and__3822__auto____15312 = goog.isString(x);
  if(and__3822__auto____15312) {
    return!function() {
      var or__3824__auto____15313 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____15313) {
        return or__3824__auto____15313
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____15312
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____15315 = goog.isString(x);
  if(and__3822__auto____15315) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____15315
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____15317 = goog.isString(x);
  if(and__3822__auto____15317) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____15317
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____15322 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____15322) {
    return or__3824__auto____15322
  }else {
    var G__15323__15324 = f;
    if(G__15323__15324) {
      if(function() {
        var or__3824__auto____15325 = G__15323__15324.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____15325) {
          return or__3824__auto____15325
        }else {
          return G__15323__15324.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__15323__15324.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__15323__15324)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__15323__15324)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____15327 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____15327) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____15327
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
    var and__3822__auto____15330 = coll;
    if(cljs.core.truth_(and__3822__auto____15330)) {
      var and__3822__auto____15331 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____15331) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____15331
      }
    }else {
      return and__3822__auto____15330
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
    var G__15340__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__15336 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__15337 = more;
        while(true) {
          var x__15338 = cljs.core.first.call(null, xs__15337);
          var etc__15339 = cljs.core.next.call(null, xs__15337);
          if(cljs.core.truth_(xs__15337)) {
            if(cljs.core.contains_QMARK_.call(null, s__15336, x__15338)) {
              return false
            }else {
              var G__15341 = cljs.core.conj.call(null, s__15336, x__15338);
              var G__15342 = etc__15339;
              s__15336 = G__15341;
              xs__15337 = G__15342;
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
    var G__15340 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15340__delegate.call(this, x, y, more)
    };
    G__15340.cljs$lang$maxFixedArity = 2;
    G__15340.cljs$lang$applyTo = function(arglist__15343) {
      var x = cljs.core.first(arglist__15343);
      var y = cljs.core.first(cljs.core.next(arglist__15343));
      var more = cljs.core.rest(cljs.core.next(arglist__15343));
      return G__15340__delegate(x, y, more)
    };
    G__15340.cljs$lang$arity$variadic = G__15340__delegate;
    return G__15340
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
            var G__15347__15348 = x;
            if(G__15347__15348) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____15349 = null;
                if(cljs.core.truth_(or__3824__auto____15349)) {
                  return or__3824__auto____15349
                }else {
                  return G__15347__15348.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__15347__15348.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__15347__15348)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__15347__15348)
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
    var xl__15354 = cljs.core.count.call(null, xs);
    var yl__15355 = cljs.core.count.call(null, ys);
    if(xl__15354 < yl__15355) {
      return-1
    }else {
      if(xl__15354 > yl__15355) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__15354, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__15356 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____15357 = d__15356 === 0;
        if(and__3822__auto____15357) {
          return n + 1 < len
        }else {
          return and__3822__auto____15357
        }
      }()) {
        var G__15358 = xs;
        var G__15359 = ys;
        var G__15360 = len;
        var G__15361 = n + 1;
        xs = G__15358;
        ys = G__15359;
        len = G__15360;
        n = G__15361;
        continue
      }else {
        return d__15356
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
      var r__15363 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__15363)) {
        return r__15363
      }else {
        if(cljs.core.truth_(r__15363)) {
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
      var a__15365 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__15365, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__15365)
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
    var temp__3971__auto____15371 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____15371) {
      var s__15372 = temp__3971__auto____15371;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__15372), cljs.core.next.call(null, s__15372))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__15373 = val;
    var coll__15374 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__15374) {
        var nval__15375 = f.call(null, val__15373, cljs.core.first.call(null, coll__15374));
        if(cljs.core.reduced_QMARK_.call(null, nval__15375)) {
          return cljs.core.deref.call(null, nval__15375)
        }else {
          var G__15376 = nval__15375;
          var G__15377 = cljs.core.next.call(null, coll__15374);
          val__15373 = G__15376;
          coll__15374 = G__15377;
          continue
        }
      }else {
        return val__15373
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
  var a__15379 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__15379);
  return cljs.core.vec.call(null, a__15379)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__15386__15387 = coll;
      if(G__15386__15387) {
        if(function() {
          var or__3824__auto____15388 = G__15386__15387.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____15388) {
            return or__3824__auto____15388
          }else {
            return G__15386__15387.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__15386__15387.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15386__15387)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15386__15387)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__15389__15390 = coll;
      if(G__15389__15390) {
        if(function() {
          var or__3824__auto____15391 = G__15389__15390.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____15391) {
            return or__3824__auto____15391
          }else {
            return G__15389__15390.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__15389__15390.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15389__15390)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15389__15390)
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
  var this__15392 = this;
  return this__15392.val
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
    var G__15393__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__15393 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15393__delegate.call(this, x, y, more)
    };
    G__15393.cljs$lang$maxFixedArity = 2;
    G__15393.cljs$lang$applyTo = function(arglist__15394) {
      var x = cljs.core.first(arglist__15394);
      var y = cljs.core.first(cljs.core.next(arglist__15394));
      var more = cljs.core.rest(cljs.core.next(arglist__15394));
      return G__15393__delegate(x, y, more)
    };
    G__15393.cljs$lang$arity$variadic = G__15393__delegate;
    return G__15393
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
    var G__15395__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__15395 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15395__delegate.call(this, x, y, more)
    };
    G__15395.cljs$lang$maxFixedArity = 2;
    G__15395.cljs$lang$applyTo = function(arglist__15396) {
      var x = cljs.core.first(arglist__15396);
      var y = cljs.core.first(cljs.core.next(arglist__15396));
      var more = cljs.core.rest(cljs.core.next(arglist__15396));
      return G__15395__delegate(x, y, more)
    };
    G__15395.cljs$lang$arity$variadic = G__15395__delegate;
    return G__15395
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
    var G__15397__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__15397 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15397__delegate.call(this, x, y, more)
    };
    G__15397.cljs$lang$maxFixedArity = 2;
    G__15397.cljs$lang$applyTo = function(arglist__15398) {
      var x = cljs.core.first(arglist__15398);
      var y = cljs.core.first(cljs.core.next(arglist__15398));
      var more = cljs.core.rest(cljs.core.next(arglist__15398));
      return G__15397__delegate(x, y, more)
    };
    G__15397.cljs$lang$arity$variadic = G__15397__delegate;
    return G__15397
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
    var G__15399__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__15399 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15399__delegate.call(this, x, y, more)
    };
    G__15399.cljs$lang$maxFixedArity = 2;
    G__15399.cljs$lang$applyTo = function(arglist__15400) {
      var x = cljs.core.first(arglist__15400);
      var y = cljs.core.first(cljs.core.next(arglist__15400));
      var more = cljs.core.rest(cljs.core.next(arglist__15400));
      return G__15399__delegate(x, y, more)
    };
    G__15399.cljs$lang$arity$variadic = G__15399__delegate;
    return G__15399
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
    var G__15401__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__15402 = y;
            var G__15403 = cljs.core.first.call(null, more);
            var G__15404 = cljs.core.next.call(null, more);
            x = G__15402;
            y = G__15403;
            more = G__15404;
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
    var G__15401 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15401__delegate.call(this, x, y, more)
    };
    G__15401.cljs$lang$maxFixedArity = 2;
    G__15401.cljs$lang$applyTo = function(arglist__15405) {
      var x = cljs.core.first(arglist__15405);
      var y = cljs.core.first(cljs.core.next(arglist__15405));
      var more = cljs.core.rest(cljs.core.next(arglist__15405));
      return G__15401__delegate(x, y, more)
    };
    G__15401.cljs$lang$arity$variadic = G__15401__delegate;
    return G__15401
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
    var G__15406__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__15407 = y;
            var G__15408 = cljs.core.first.call(null, more);
            var G__15409 = cljs.core.next.call(null, more);
            x = G__15407;
            y = G__15408;
            more = G__15409;
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
    var G__15406 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15406__delegate.call(this, x, y, more)
    };
    G__15406.cljs$lang$maxFixedArity = 2;
    G__15406.cljs$lang$applyTo = function(arglist__15410) {
      var x = cljs.core.first(arglist__15410);
      var y = cljs.core.first(cljs.core.next(arglist__15410));
      var more = cljs.core.rest(cljs.core.next(arglist__15410));
      return G__15406__delegate(x, y, more)
    };
    G__15406.cljs$lang$arity$variadic = G__15406__delegate;
    return G__15406
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
    var G__15411__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__15412 = y;
            var G__15413 = cljs.core.first.call(null, more);
            var G__15414 = cljs.core.next.call(null, more);
            x = G__15412;
            y = G__15413;
            more = G__15414;
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
    var G__15411 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15411__delegate.call(this, x, y, more)
    };
    G__15411.cljs$lang$maxFixedArity = 2;
    G__15411.cljs$lang$applyTo = function(arglist__15415) {
      var x = cljs.core.first(arglist__15415);
      var y = cljs.core.first(cljs.core.next(arglist__15415));
      var more = cljs.core.rest(cljs.core.next(arglist__15415));
      return G__15411__delegate(x, y, more)
    };
    G__15411.cljs$lang$arity$variadic = G__15411__delegate;
    return G__15411
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
    var G__15416__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__15417 = y;
            var G__15418 = cljs.core.first.call(null, more);
            var G__15419 = cljs.core.next.call(null, more);
            x = G__15417;
            y = G__15418;
            more = G__15419;
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
    var G__15416 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15416__delegate.call(this, x, y, more)
    };
    G__15416.cljs$lang$maxFixedArity = 2;
    G__15416.cljs$lang$applyTo = function(arglist__15420) {
      var x = cljs.core.first(arglist__15420);
      var y = cljs.core.first(cljs.core.next(arglist__15420));
      var more = cljs.core.rest(cljs.core.next(arglist__15420));
      return G__15416__delegate(x, y, more)
    };
    G__15416.cljs$lang$arity$variadic = G__15416__delegate;
    return G__15416
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
    var G__15421__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__15421 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15421__delegate.call(this, x, y, more)
    };
    G__15421.cljs$lang$maxFixedArity = 2;
    G__15421.cljs$lang$applyTo = function(arglist__15422) {
      var x = cljs.core.first(arglist__15422);
      var y = cljs.core.first(cljs.core.next(arglist__15422));
      var more = cljs.core.rest(cljs.core.next(arglist__15422));
      return G__15421__delegate(x, y, more)
    };
    G__15421.cljs$lang$arity$variadic = G__15421__delegate;
    return G__15421
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
    var G__15423__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__15423 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15423__delegate.call(this, x, y, more)
    };
    G__15423.cljs$lang$maxFixedArity = 2;
    G__15423.cljs$lang$applyTo = function(arglist__15424) {
      var x = cljs.core.first(arglist__15424);
      var y = cljs.core.first(cljs.core.next(arglist__15424));
      var more = cljs.core.rest(cljs.core.next(arglist__15424));
      return G__15423__delegate(x, y, more)
    };
    G__15423.cljs$lang$arity$variadic = G__15423__delegate;
    return G__15423
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
  var rem__15426 = n % d;
  return cljs.core.fix.call(null, (n - rem__15426) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__15428 = cljs.core.quot.call(null, n, d);
  return n - d * q__15428
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
  var v__15431 = v - (v >> 1 & 1431655765);
  var v__15432 = (v__15431 & 858993459) + (v__15431 >> 2 & 858993459);
  return(v__15432 + (v__15432 >> 4) & 252645135) * 16843009 >> 24
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
    var G__15433__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__15434 = y;
            var G__15435 = cljs.core.first.call(null, more);
            var G__15436 = cljs.core.next.call(null, more);
            x = G__15434;
            y = G__15435;
            more = G__15436;
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
    var G__15433 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15433__delegate.call(this, x, y, more)
    };
    G__15433.cljs$lang$maxFixedArity = 2;
    G__15433.cljs$lang$applyTo = function(arglist__15437) {
      var x = cljs.core.first(arglist__15437);
      var y = cljs.core.first(cljs.core.next(arglist__15437));
      var more = cljs.core.rest(cljs.core.next(arglist__15437));
      return G__15433__delegate(x, y, more)
    };
    G__15433.cljs$lang$arity$variadic = G__15433__delegate;
    return G__15433
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
  var n__15441 = n;
  var xs__15442 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____15443 = xs__15442;
      if(and__3822__auto____15443) {
        return n__15441 > 0
      }else {
        return and__3822__auto____15443
      }
    }())) {
      var G__15444 = n__15441 - 1;
      var G__15445 = cljs.core.next.call(null, xs__15442);
      n__15441 = G__15444;
      xs__15442 = G__15445;
      continue
    }else {
      return xs__15442
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
    var G__15446__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__15447 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__15448 = cljs.core.next.call(null, more);
            sb = G__15447;
            more = G__15448;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__15446 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__15446__delegate.call(this, x, ys)
    };
    G__15446.cljs$lang$maxFixedArity = 1;
    G__15446.cljs$lang$applyTo = function(arglist__15449) {
      var x = cljs.core.first(arglist__15449);
      var ys = cljs.core.rest(arglist__15449);
      return G__15446__delegate(x, ys)
    };
    G__15446.cljs$lang$arity$variadic = G__15446__delegate;
    return G__15446
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
    var G__15450__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__15451 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__15452 = cljs.core.next.call(null, more);
            sb = G__15451;
            more = G__15452;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__15450 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__15450__delegate.call(this, x, ys)
    };
    G__15450.cljs$lang$maxFixedArity = 1;
    G__15450.cljs$lang$applyTo = function(arglist__15453) {
      var x = cljs.core.first(arglist__15453);
      var ys = cljs.core.rest(arglist__15453);
      return G__15450__delegate(x, ys)
    };
    G__15450.cljs$lang$arity$variadic = G__15450__delegate;
    return G__15450
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
  format.cljs$lang$applyTo = function(arglist__15454) {
    var fmt = cljs.core.first(arglist__15454);
    var args = cljs.core.rest(arglist__15454);
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
    var xs__15457 = cljs.core.seq.call(null, x);
    var ys__15458 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__15457 == null) {
        return ys__15458 == null
      }else {
        if(ys__15458 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__15457), cljs.core.first.call(null, ys__15458))) {
            var G__15459 = cljs.core.next.call(null, xs__15457);
            var G__15460 = cljs.core.next.call(null, ys__15458);
            xs__15457 = G__15459;
            ys__15458 = G__15460;
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
  return cljs.core.reduce.call(null, function(p1__15461_SHARP_, p2__15462_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__15461_SHARP_, cljs.core.hash.call(null, p2__15462_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__15466 = 0;
  var s__15467 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__15467) {
      var e__15468 = cljs.core.first.call(null, s__15467);
      var G__15469 = (h__15466 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__15468)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__15468)))) % 4503599627370496;
      var G__15470 = cljs.core.next.call(null, s__15467);
      h__15466 = G__15469;
      s__15467 = G__15470;
      continue
    }else {
      return h__15466
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__15474 = 0;
  var s__15475 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__15475) {
      var e__15476 = cljs.core.first.call(null, s__15475);
      var G__15477 = (h__15474 + cljs.core.hash.call(null, e__15476)) % 4503599627370496;
      var G__15478 = cljs.core.next.call(null, s__15475);
      h__15474 = G__15477;
      s__15475 = G__15478;
      continue
    }else {
      return h__15474
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__15499__15500 = cljs.core.seq.call(null, fn_map);
  if(G__15499__15500) {
    var G__15502__15504 = cljs.core.first.call(null, G__15499__15500);
    var vec__15503__15505 = G__15502__15504;
    var key_name__15506 = cljs.core.nth.call(null, vec__15503__15505, 0, null);
    var f__15507 = cljs.core.nth.call(null, vec__15503__15505, 1, null);
    var G__15499__15508 = G__15499__15500;
    var G__15502__15509 = G__15502__15504;
    var G__15499__15510 = G__15499__15508;
    while(true) {
      var vec__15511__15512 = G__15502__15509;
      var key_name__15513 = cljs.core.nth.call(null, vec__15511__15512, 0, null);
      var f__15514 = cljs.core.nth.call(null, vec__15511__15512, 1, null);
      var G__15499__15515 = G__15499__15510;
      var str_name__15516 = cljs.core.name.call(null, key_name__15513);
      obj[str_name__15516] = f__15514;
      var temp__3974__auto____15517 = cljs.core.next.call(null, G__15499__15515);
      if(temp__3974__auto____15517) {
        var G__15499__15518 = temp__3974__auto____15517;
        var G__15519 = cljs.core.first.call(null, G__15499__15518);
        var G__15520 = G__15499__15518;
        G__15502__15509 = G__15519;
        G__15499__15510 = G__15520;
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
  var this__15521 = this;
  var h__2192__auto____15522 = this__15521.__hash;
  if(!(h__2192__auto____15522 == null)) {
    return h__2192__auto____15522
  }else {
    var h__2192__auto____15523 = cljs.core.hash_coll.call(null, coll);
    this__15521.__hash = h__2192__auto____15523;
    return h__2192__auto____15523
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__15524 = this;
  if(this__15524.count === 1) {
    return null
  }else {
    return this__15524.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15525 = this;
  return new cljs.core.List(this__15525.meta, o, coll, this__15525.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__15526 = this;
  var this__15527 = this;
  return cljs.core.pr_str.call(null, this__15527)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15528 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15529 = this;
  return this__15529.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15530 = this;
  return this__15530.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15531 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15532 = this;
  return this__15532.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15533 = this;
  if(this__15533.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__15533.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15534 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15535 = this;
  return new cljs.core.List(meta, this__15535.first, this__15535.rest, this__15535.count, this__15535.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15536 = this;
  return this__15536.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15537 = this;
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
  var this__15538 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__15539 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15540 = this;
  return new cljs.core.List(this__15540.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__15541 = this;
  var this__15542 = this;
  return cljs.core.pr_str.call(null, this__15542)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15543 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15544 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15545 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15546 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15547 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15548 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15549 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15550 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15551 = this;
  return this__15551.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15552 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__15556__15557 = coll;
  if(G__15556__15557) {
    if(function() {
      var or__3824__auto____15558 = G__15556__15557.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____15558) {
        return or__3824__auto____15558
      }else {
        return G__15556__15557.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__15556__15557.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__15556__15557)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__15556__15557)
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
    var G__15559__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__15559 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15559__delegate.call(this, x, y, z, items)
    };
    G__15559.cljs$lang$maxFixedArity = 3;
    G__15559.cljs$lang$applyTo = function(arglist__15560) {
      var x = cljs.core.first(arglist__15560);
      var y = cljs.core.first(cljs.core.next(arglist__15560));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15560)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15560)));
      return G__15559__delegate(x, y, z, items)
    };
    G__15559.cljs$lang$arity$variadic = G__15559__delegate;
    return G__15559
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
  var this__15561 = this;
  var h__2192__auto____15562 = this__15561.__hash;
  if(!(h__2192__auto____15562 == null)) {
    return h__2192__auto____15562
  }else {
    var h__2192__auto____15563 = cljs.core.hash_coll.call(null, coll);
    this__15561.__hash = h__2192__auto____15563;
    return h__2192__auto____15563
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__15564 = this;
  if(this__15564.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__15564.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15565 = this;
  return new cljs.core.Cons(null, o, coll, this__15565.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__15566 = this;
  var this__15567 = this;
  return cljs.core.pr_str.call(null, this__15567)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15568 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15569 = this;
  return this__15569.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15570 = this;
  if(this__15570.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__15570.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15571 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15572 = this;
  return new cljs.core.Cons(meta, this__15572.first, this__15572.rest, this__15572.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15573 = this;
  return this__15573.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15574 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__15574.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____15579 = coll == null;
    if(or__3824__auto____15579) {
      return or__3824__auto____15579
    }else {
      var G__15580__15581 = coll;
      if(G__15580__15581) {
        if(function() {
          var or__3824__auto____15582 = G__15580__15581.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____15582) {
            return or__3824__auto____15582
          }else {
            return G__15580__15581.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__15580__15581.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15580__15581)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15580__15581)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__15586__15587 = x;
  if(G__15586__15587) {
    if(function() {
      var or__3824__auto____15588 = G__15586__15587.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____15588) {
        return or__3824__auto____15588
      }else {
        return G__15586__15587.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__15586__15587.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__15586__15587)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__15586__15587)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__15589 = null;
  var G__15589__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__15589__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__15589 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__15589__2.call(this, string, f);
      case 3:
        return G__15589__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15589
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__15590 = null;
  var G__15590__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__15590__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__15590 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15590__2.call(this, string, k);
      case 3:
        return G__15590__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15590
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__15591 = null;
  var G__15591__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__15591__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__15591 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15591__2.call(this, string, n);
      case 3:
        return G__15591__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15591
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
  var G__15603 = null;
  var G__15603__2 = function(this_sym15594, coll) {
    var this__15596 = this;
    var this_sym15594__15597 = this;
    var ___15598 = this_sym15594__15597;
    if(coll == null) {
      return null
    }else {
      var strobj__15599 = coll.strobj;
      if(strobj__15599 == null) {
        return cljs.core._lookup.call(null, coll, this__15596.k, null)
      }else {
        return strobj__15599[this__15596.k]
      }
    }
  };
  var G__15603__3 = function(this_sym15595, coll, not_found) {
    var this__15596 = this;
    var this_sym15595__15600 = this;
    var ___15601 = this_sym15595__15600;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__15596.k, not_found)
    }
  };
  G__15603 = function(this_sym15595, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15603__2.call(this, this_sym15595, coll);
      case 3:
        return G__15603__3.call(this, this_sym15595, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15603
}();
cljs.core.Keyword.prototype.apply = function(this_sym15592, args15593) {
  var this__15602 = this;
  return this_sym15592.call.apply(this_sym15592, [this_sym15592].concat(args15593.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__15612 = null;
  var G__15612__2 = function(this_sym15606, coll) {
    var this_sym15606__15608 = this;
    var this__15609 = this_sym15606__15608;
    return cljs.core._lookup.call(null, coll, this__15609.toString(), null)
  };
  var G__15612__3 = function(this_sym15607, coll, not_found) {
    var this_sym15607__15610 = this;
    var this__15611 = this_sym15607__15610;
    return cljs.core._lookup.call(null, coll, this__15611.toString(), not_found)
  };
  G__15612 = function(this_sym15607, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15612__2.call(this, this_sym15607, coll);
      case 3:
        return G__15612__3.call(this, this_sym15607, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15612
}();
String.prototype.apply = function(this_sym15604, args15605) {
  return this_sym15604.call.apply(this_sym15604, [this_sym15604].concat(args15605.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__15614 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__15614
  }else {
    lazy_seq.x = x__15614.call(null);
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
  var this__15615 = this;
  var h__2192__auto____15616 = this__15615.__hash;
  if(!(h__2192__auto____15616 == null)) {
    return h__2192__auto____15616
  }else {
    var h__2192__auto____15617 = cljs.core.hash_coll.call(null, coll);
    this__15615.__hash = h__2192__auto____15617;
    return h__2192__auto____15617
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__15618 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15619 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__15620 = this;
  var this__15621 = this;
  return cljs.core.pr_str.call(null, this__15621)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15622 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15623 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15624 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15625 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15626 = this;
  return new cljs.core.LazySeq(meta, this__15626.realized, this__15626.x, this__15626.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15627 = this;
  return this__15627.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15628 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__15628.meta)
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
  var this__15629 = this;
  return this__15629.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__15630 = this;
  var ___15631 = this;
  this__15630.buf[this__15630.end] = o;
  return this__15630.end = this__15630.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__15632 = this;
  var ___15633 = this;
  var ret__15634 = new cljs.core.ArrayChunk(this__15632.buf, 0, this__15632.end);
  this__15632.buf = null;
  return ret__15634
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
  var this__15635 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__15635.arr[this__15635.off], this__15635.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__15636 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__15636.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__15637 = this;
  if(this__15637.off === this__15637.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__15637.arr, this__15637.off + 1, this__15637.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__15638 = this;
  return this__15638.arr[this__15638.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__15639 = this;
  if(function() {
    var and__3822__auto____15640 = i >= 0;
    if(and__3822__auto____15640) {
      return i < this__15639.end - this__15639.off
    }else {
      return and__3822__auto____15640
    }
  }()) {
    return this__15639.arr[this__15639.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__15641 = this;
  return this__15641.end - this__15641.off
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
  var this__15642 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15643 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15644 = this;
  return cljs.core._nth.call(null, this__15644.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15645 = this;
  if(cljs.core._count.call(null, this__15645.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__15645.chunk), this__15645.more, this__15645.meta)
  }else {
    if(this__15645.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__15645.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__15646 = this;
  if(this__15646.more == null) {
    return null
  }else {
    return this__15646.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15647 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__15648 = this;
  return new cljs.core.ChunkedCons(this__15648.chunk, this__15648.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15649 = this;
  return this__15649.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__15650 = this;
  return this__15650.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__15651 = this;
  if(this__15651.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__15651.more
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
    var G__15655__15656 = s;
    if(G__15655__15656) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____15657 = null;
        if(cljs.core.truth_(or__3824__auto____15657)) {
          return or__3824__auto____15657
        }else {
          return G__15655__15656.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__15655__15656.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__15655__15656)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__15655__15656)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__15660 = [];
  var s__15661 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__15661)) {
      ary__15660.push(cljs.core.first.call(null, s__15661));
      var G__15662 = cljs.core.next.call(null, s__15661);
      s__15661 = G__15662;
      continue
    }else {
      return ary__15660
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__15666 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__15667 = 0;
  var xs__15668 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__15668) {
      ret__15666[i__15667] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__15668));
      var G__15669 = i__15667 + 1;
      var G__15670 = cljs.core.next.call(null, xs__15668);
      i__15667 = G__15669;
      xs__15668 = G__15670;
      continue
    }else {
    }
    break
  }
  return ret__15666
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
    var a__15678 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__15679 = cljs.core.seq.call(null, init_val_or_seq);
      var i__15680 = 0;
      var s__15681 = s__15679;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____15682 = s__15681;
          if(and__3822__auto____15682) {
            return i__15680 < size
          }else {
            return and__3822__auto____15682
          }
        }())) {
          a__15678[i__15680] = cljs.core.first.call(null, s__15681);
          var G__15685 = i__15680 + 1;
          var G__15686 = cljs.core.next.call(null, s__15681);
          i__15680 = G__15685;
          s__15681 = G__15686;
          continue
        }else {
          return a__15678
        }
        break
      }
    }else {
      var n__2527__auto____15683 = size;
      var i__15684 = 0;
      while(true) {
        if(i__15684 < n__2527__auto____15683) {
          a__15678[i__15684] = init_val_or_seq;
          var G__15687 = i__15684 + 1;
          i__15684 = G__15687;
          continue
        }else {
        }
        break
      }
      return a__15678
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
    var a__15695 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__15696 = cljs.core.seq.call(null, init_val_or_seq);
      var i__15697 = 0;
      var s__15698 = s__15696;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____15699 = s__15698;
          if(and__3822__auto____15699) {
            return i__15697 < size
          }else {
            return and__3822__auto____15699
          }
        }())) {
          a__15695[i__15697] = cljs.core.first.call(null, s__15698);
          var G__15702 = i__15697 + 1;
          var G__15703 = cljs.core.next.call(null, s__15698);
          i__15697 = G__15702;
          s__15698 = G__15703;
          continue
        }else {
          return a__15695
        }
        break
      }
    }else {
      var n__2527__auto____15700 = size;
      var i__15701 = 0;
      while(true) {
        if(i__15701 < n__2527__auto____15700) {
          a__15695[i__15701] = init_val_or_seq;
          var G__15704 = i__15701 + 1;
          i__15701 = G__15704;
          continue
        }else {
        }
        break
      }
      return a__15695
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
    var a__15712 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__15713 = cljs.core.seq.call(null, init_val_or_seq);
      var i__15714 = 0;
      var s__15715 = s__15713;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____15716 = s__15715;
          if(and__3822__auto____15716) {
            return i__15714 < size
          }else {
            return and__3822__auto____15716
          }
        }())) {
          a__15712[i__15714] = cljs.core.first.call(null, s__15715);
          var G__15719 = i__15714 + 1;
          var G__15720 = cljs.core.next.call(null, s__15715);
          i__15714 = G__15719;
          s__15715 = G__15720;
          continue
        }else {
          return a__15712
        }
        break
      }
    }else {
      var n__2527__auto____15717 = size;
      var i__15718 = 0;
      while(true) {
        if(i__15718 < n__2527__auto____15717) {
          a__15712[i__15718] = init_val_or_seq;
          var G__15721 = i__15718 + 1;
          i__15718 = G__15721;
          continue
        }else {
        }
        break
      }
      return a__15712
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
    var s__15726 = s;
    var i__15727 = n;
    var sum__15728 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____15729 = i__15727 > 0;
        if(and__3822__auto____15729) {
          return cljs.core.seq.call(null, s__15726)
        }else {
          return and__3822__auto____15729
        }
      }())) {
        var G__15730 = cljs.core.next.call(null, s__15726);
        var G__15731 = i__15727 - 1;
        var G__15732 = sum__15728 + 1;
        s__15726 = G__15730;
        i__15727 = G__15731;
        sum__15728 = G__15732;
        continue
      }else {
        return sum__15728
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
      var s__15737 = cljs.core.seq.call(null, x);
      if(s__15737) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15737)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__15737), concat.call(null, cljs.core.chunk_rest.call(null, s__15737), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__15737), concat.call(null, cljs.core.rest.call(null, s__15737), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__15741__delegate = function(x, y, zs) {
      var cat__15740 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__15739 = cljs.core.seq.call(null, xys);
          if(xys__15739) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__15739)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__15739), cat.call(null, cljs.core.chunk_rest.call(null, xys__15739), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__15739), cat.call(null, cljs.core.rest.call(null, xys__15739), zs))
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
      return cat__15740.call(null, concat.call(null, x, y), zs)
    };
    var G__15741 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15741__delegate.call(this, x, y, zs)
    };
    G__15741.cljs$lang$maxFixedArity = 2;
    G__15741.cljs$lang$applyTo = function(arglist__15742) {
      var x = cljs.core.first(arglist__15742);
      var y = cljs.core.first(cljs.core.next(arglist__15742));
      var zs = cljs.core.rest(cljs.core.next(arglist__15742));
      return G__15741__delegate(x, y, zs)
    };
    G__15741.cljs$lang$arity$variadic = G__15741__delegate;
    return G__15741
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
    var G__15743__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__15743 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15743__delegate.call(this, a, b, c, d, more)
    };
    G__15743.cljs$lang$maxFixedArity = 4;
    G__15743.cljs$lang$applyTo = function(arglist__15744) {
      var a = cljs.core.first(arglist__15744);
      var b = cljs.core.first(cljs.core.next(arglist__15744));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15744)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15744))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15744))));
      return G__15743__delegate(a, b, c, d, more)
    };
    G__15743.cljs$lang$arity$variadic = G__15743__delegate;
    return G__15743
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
  var args__15786 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__15787 = cljs.core._first.call(null, args__15786);
    var args__15788 = cljs.core._rest.call(null, args__15786);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__15787)
      }else {
        return f.call(null, a__15787)
      }
    }else {
      var b__15789 = cljs.core._first.call(null, args__15788);
      var args__15790 = cljs.core._rest.call(null, args__15788);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__15787, b__15789)
        }else {
          return f.call(null, a__15787, b__15789)
        }
      }else {
        var c__15791 = cljs.core._first.call(null, args__15790);
        var args__15792 = cljs.core._rest.call(null, args__15790);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__15787, b__15789, c__15791)
          }else {
            return f.call(null, a__15787, b__15789, c__15791)
          }
        }else {
          var d__15793 = cljs.core._first.call(null, args__15792);
          var args__15794 = cljs.core._rest.call(null, args__15792);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__15787, b__15789, c__15791, d__15793)
            }else {
              return f.call(null, a__15787, b__15789, c__15791, d__15793)
            }
          }else {
            var e__15795 = cljs.core._first.call(null, args__15794);
            var args__15796 = cljs.core._rest.call(null, args__15794);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__15787, b__15789, c__15791, d__15793, e__15795)
              }else {
                return f.call(null, a__15787, b__15789, c__15791, d__15793, e__15795)
              }
            }else {
              var f__15797 = cljs.core._first.call(null, args__15796);
              var args__15798 = cljs.core._rest.call(null, args__15796);
              if(argc === 6) {
                if(f__15797.cljs$lang$arity$6) {
                  return f__15797.cljs$lang$arity$6(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797)
                }else {
                  return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797)
                }
              }else {
                var g__15799 = cljs.core._first.call(null, args__15798);
                var args__15800 = cljs.core._rest.call(null, args__15798);
                if(argc === 7) {
                  if(f__15797.cljs$lang$arity$7) {
                    return f__15797.cljs$lang$arity$7(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799)
                  }else {
                    return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799)
                  }
                }else {
                  var h__15801 = cljs.core._first.call(null, args__15800);
                  var args__15802 = cljs.core._rest.call(null, args__15800);
                  if(argc === 8) {
                    if(f__15797.cljs$lang$arity$8) {
                      return f__15797.cljs$lang$arity$8(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801)
                    }else {
                      return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801)
                    }
                  }else {
                    var i__15803 = cljs.core._first.call(null, args__15802);
                    var args__15804 = cljs.core._rest.call(null, args__15802);
                    if(argc === 9) {
                      if(f__15797.cljs$lang$arity$9) {
                        return f__15797.cljs$lang$arity$9(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803)
                      }else {
                        return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803)
                      }
                    }else {
                      var j__15805 = cljs.core._first.call(null, args__15804);
                      var args__15806 = cljs.core._rest.call(null, args__15804);
                      if(argc === 10) {
                        if(f__15797.cljs$lang$arity$10) {
                          return f__15797.cljs$lang$arity$10(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805)
                        }else {
                          return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805)
                        }
                      }else {
                        var k__15807 = cljs.core._first.call(null, args__15806);
                        var args__15808 = cljs.core._rest.call(null, args__15806);
                        if(argc === 11) {
                          if(f__15797.cljs$lang$arity$11) {
                            return f__15797.cljs$lang$arity$11(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807)
                          }else {
                            return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807)
                          }
                        }else {
                          var l__15809 = cljs.core._first.call(null, args__15808);
                          var args__15810 = cljs.core._rest.call(null, args__15808);
                          if(argc === 12) {
                            if(f__15797.cljs$lang$arity$12) {
                              return f__15797.cljs$lang$arity$12(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809)
                            }else {
                              return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809)
                            }
                          }else {
                            var m__15811 = cljs.core._first.call(null, args__15810);
                            var args__15812 = cljs.core._rest.call(null, args__15810);
                            if(argc === 13) {
                              if(f__15797.cljs$lang$arity$13) {
                                return f__15797.cljs$lang$arity$13(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811)
                              }else {
                                return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811)
                              }
                            }else {
                              var n__15813 = cljs.core._first.call(null, args__15812);
                              var args__15814 = cljs.core._rest.call(null, args__15812);
                              if(argc === 14) {
                                if(f__15797.cljs$lang$arity$14) {
                                  return f__15797.cljs$lang$arity$14(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813)
                                }else {
                                  return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813)
                                }
                              }else {
                                var o__15815 = cljs.core._first.call(null, args__15814);
                                var args__15816 = cljs.core._rest.call(null, args__15814);
                                if(argc === 15) {
                                  if(f__15797.cljs$lang$arity$15) {
                                    return f__15797.cljs$lang$arity$15(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813, o__15815)
                                  }else {
                                    return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813, o__15815)
                                  }
                                }else {
                                  var p__15817 = cljs.core._first.call(null, args__15816);
                                  var args__15818 = cljs.core._rest.call(null, args__15816);
                                  if(argc === 16) {
                                    if(f__15797.cljs$lang$arity$16) {
                                      return f__15797.cljs$lang$arity$16(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813, o__15815, p__15817)
                                    }else {
                                      return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813, o__15815, p__15817)
                                    }
                                  }else {
                                    var q__15819 = cljs.core._first.call(null, args__15818);
                                    var args__15820 = cljs.core._rest.call(null, args__15818);
                                    if(argc === 17) {
                                      if(f__15797.cljs$lang$arity$17) {
                                        return f__15797.cljs$lang$arity$17(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813, o__15815, p__15817, q__15819)
                                      }else {
                                        return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813, o__15815, p__15817, q__15819)
                                      }
                                    }else {
                                      var r__15821 = cljs.core._first.call(null, args__15820);
                                      var args__15822 = cljs.core._rest.call(null, args__15820);
                                      if(argc === 18) {
                                        if(f__15797.cljs$lang$arity$18) {
                                          return f__15797.cljs$lang$arity$18(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813, o__15815, p__15817, q__15819, r__15821)
                                        }else {
                                          return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813, o__15815, p__15817, q__15819, r__15821)
                                        }
                                      }else {
                                        var s__15823 = cljs.core._first.call(null, args__15822);
                                        var args__15824 = cljs.core._rest.call(null, args__15822);
                                        if(argc === 19) {
                                          if(f__15797.cljs$lang$arity$19) {
                                            return f__15797.cljs$lang$arity$19(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813, o__15815, p__15817, q__15819, r__15821, s__15823)
                                          }else {
                                            return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813, o__15815, p__15817, q__15819, r__15821, s__15823)
                                          }
                                        }else {
                                          var t__15825 = cljs.core._first.call(null, args__15824);
                                          var args__15826 = cljs.core._rest.call(null, args__15824);
                                          if(argc === 20) {
                                            if(f__15797.cljs$lang$arity$20) {
                                              return f__15797.cljs$lang$arity$20(a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813, o__15815, p__15817, q__15819, r__15821, s__15823, t__15825)
                                            }else {
                                              return f__15797.call(null, a__15787, b__15789, c__15791, d__15793, e__15795, f__15797, g__15799, h__15801, i__15803, j__15805, k__15807, l__15809, m__15811, n__15813, o__15815, p__15817, q__15819, r__15821, s__15823, t__15825)
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
    var fixed_arity__15841 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15842 = cljs.core.bounded_count.call(null, args, fixed_arity__15841 + 1);
      if(bc__15842 <= fixed_arity__15841) {
        return cljs.core.apply_to.call(null, f, bc__15842, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__15843 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__15844 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15845 = cljs.core.bounded_count.call(null, arglist__15843, fixed_arity__15844 + 1);
      if(bc__15845 <= fixed_arity__15844) {
        return cljs.core.apply_to.call(null, f, bc__15845, arglist__15843)
      }else {
        return f.cljs$lang$applyTo(arglist__15843)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__15843))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__15846 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__15847 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15848 = cljs.core.bounded_count.call(null, arglist__15846, fixed_arity__15847 + 1);
      if(bc__15848 <= fixed_arity__15847) {
        return cljs.core.apply_to.call(null, f, bc__15848, arglist__15846)
      }else {
        return f.cljs$lang$applyTo(arglist__15846)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__15846))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__15849 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__15850 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15851 = cljs.core.bounded_count.call(null, arglist__15849, fixed_arity__15850 + 1);
      if(bc__15851 <= fixed_arity__15850) {
        return cljs.core.apply_to.call(null, f, bc__15851, arglist__15849)
      }else {
        return f.cljs$lang$applyTo(arglist__15849)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__15849))
    }
  };
  var apply__6 = function() {
    var G__15855__delegate = function(f, a, b, c, d, args) {
      var arglist__15852 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__15853 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__15854 = cljs.core.bounded_count.call(null, arglist__15852, fixed_arity__15853 + 1);
        if(bc__15854 <= fixed_arity__15853) {
          return cljs.core.apply_to.call(null, f, bc__15854, arglist__15852)
        }else {
          return f.cljs$lang$applyTo(arglist__15852)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__15852))
      }
    };
    var G__15855 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__15855__delegate.call(this, f, a, b, c, d, args)
    };
    G__15855.cljs$lang$maxFixedArity = 5;
    G__15855.cljs$lang$applyTo = function(arglist__15856) {
      var f = cljs.core.first(arglist__15856);
      var a = cljs.core.first(cljs.core.next(arglist__15856));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15856)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15856))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15856)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15856)))));
      return G__15855__delegate(f, a, b, c, d, args)
    };
    G__15855.cljs$lang$arity$variadic = G__15855__delegate;
    return G__15855
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
  vary_meta.cljs$lang$applyTo = function(arglist__15857) {
    var obj = cljs.core.first(arglist__15857);
    var f = cljs.core.first(cljs.core.next(arglist__15857));
    var args = cljs.core.rest(cljs.core.next(arglist__15857));
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
    var G__15858__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__15858 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15858__delegate.call(this, x, y, more)
    };
    G__15858.cljs$lang$maxFixedArity = 2;
    G__15858.cljs$lang$applyTo = function(arglist__15859) {
      var x = cljs.core.first(arglist__15859);
      var y = cljs.core.first(cljs.core.next(arglist__15859));
      var more = cljs.core.rest(cljs.core.next(arglist__15859));
      return G__15858__delegate(x, y, more)
    };
    G__15858.cljs$lang$arity$variadic = G__15858__delegate;
    return G__15858
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
        var G__15860 = pred;
        var G__15861 = cljs.core.next.call(null, coll);
        pred = G__15860;
        coll = G__15861;
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
      var or__3824__auto____15863 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____15863)) {
        return or__3824__auto____15863
      }else {
        var G__15864 = pred;
        var G__15865 = cljs.core.next.call(null, coll);
        pred = G__15864;
        coll = G__15865;
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
    var G__15866 = null;
    var G__15866__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__15866__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__15866__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__15866__3 = function() {
      var G__15867__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__15867 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__15867__delegate.call(this, x, y, zs)
      };
      G__15867.cljs$lang$maxFixedArity = 2;
      G__15867.cljs$lang$applyTo = function(arglist__15868) {
        var x = cljs.core.first(arglist__15868);
        var y = cljs.core.first(cljs.core.next(arglist__15868));
        var zs = cljs.core.rest(cljs.core.next(arglist__15868));
        return G__15867__delegate(x, y, zs)
      };
      G__15867.cljs$lang$arity$variadic = G__15867__delegate;
      return G__15867
    }();
    G__15866 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__15866__0.call(this);
        case 1:
          return G__15866__1.call(this, x);
        case 2:
          return G__15866__2.call(this, x, y);
        default:
          return G__15866__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__15866.cljs$lang$maxFixedArity = 2;
    G__15866.cljs$lang$applyTo = G__15866__3.cljs$lang$applyTo;
    return G__15866
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__15869__delegate = function(args) {
      return x
    };
    var G__15869 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__15869__delegate.call(this, args)
    };
    G__15869.cljs$lang$maxFixedArity = 0;
    G__15869.cljs$lang$applyTo = function(arglist__15870) {
      var args = cljs.core.seq(arglist__15870);
      return G__15869__delegate(args)
    };
    G__15869.cljs$lang$arity$variadic = G__15869__delegate;
    return G__15869
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
      var G__15877 = null;
      var G__15877__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__15877__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__15877__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__15877__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__15877__4 = function() {
        var G__15878__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__15878 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15878__delegate.call(this, x, y, z, args)
        };
        G__15878.cljs$lang$maxFixedArity = 3;
        G__15878.cljs$lang$applyTo = function(arglist__15879) {
          var x = cljs.core.first(arglist__15879);
          var y = cljs.core.first(cljs.core.next(arglist__15879));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15879)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15879)));
          return G__15878__delegate(x, y, z, args)
        };
        G__15878.cljs$lang$arity$variadic = G__15878__delegate;
        return G__15878
      }();
      G__15877 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15877__0.call(this);
          case 1:
            return G__15877__1.call(this, x);
          case 2:
            return G__15877__2.call(this, x, y);
          case 3:
            return G__15877__3.call(this, x, y, z);
          default:
            return G__15877__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15877.cljs$lang$maxFixedArity = 3;
      G__15877.cljs$lang$applyTo = G__15877__4.cljs$lang$applyTo;
      return G__15877
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__15880 = null;
      var G__15880__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__15880__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__15880__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__15880__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__15880__4 = function() {
        var G__15881__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__15881 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15881__delegate.call(this, x, y, z, args)
        };
        G__15881.cljs$lang$maxFixedArity = 3;
        G__15881.cljs$lang$applyTo = function(arglist__15882) {
          var x = cljs.core.first(arglist__15882);
          var y = cljs.core.first(cljs.core.next(arglist__15882));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15882)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15882)));
          return G__15881__delegate(x, y, z, args)
        };
        G__15881.cljs$lang$arity$variadic = G__15881__delegate;
        return G__15881
      }();
      G__15880 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15880__0.call(this);
          case 1:
            return G__15880__1.call(this, x);
          case 2:
            return G__15880__2.call(this, x, y);
          case 3:
            return G__15880__3.call(this, x, y, z);
          default:
            return G__15880__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15880.cljs$lang$maxFixedArity = 3;
      G__15880.cljs$lang$applyTo = G__15880__4.cljs$lang$applyTo;
      return G__15880
    }()
  };
  var comp__4 = function() {
    var G__15883__delegate = function(f1, f2, f3, fs) {
      var fs__15874 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__15884__delegate = function(args) {
          var ret__15875 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__15874), args);
          var fs__15876 = cljs.core.next.call(null, fs__15874);
          while(true) {
            if(fs__15876) {
              var G__15885 = cljs.core.first.call(null, fs__15876).call(null, ret__15875);
              var G__15886 = cljs.core.next.call(null, fs__15876);
              ret__15875 = G__15885;
              fs__15876 = G__15886;
              continue
            }else {
              return ret__15875
            }
            break
          }
        };
        var G__15884 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__15884__delegate.call(this, args)
        };
        G__15884.cljs$lang$maxFixedArity = 0;
        G__15884.cljs$lang$applyTo = function(arglist__15887) {
          var args = cljs.core.seq(arglist__15887);
          return G__15884__delegate(args)
        };
        G__15884.cljs$lang$arity$variadic = G__15884__delegate;
        return G__15884
      }()
    };
    var G__15883 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15883__delegate.call(this, f1, f2, f3, fs)
    };
    G__15883.cljs$lang$maxFixedArity = 3;
    G__15883.cljs$lang$applyTo = function(arglist__15888) {
      var f1 = cljs.core.first(arglist__15888);
      var f2 = cljs.core.first(cljs.core.next(arglist__15888));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15888)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15888)));
      return G__15883__delegate(f1, f2, f3, fs)
    };
    G__15883.cljs$lang$arity$variadic = G__15883__delegate;
    return G__15883
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
      var G__15889__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__15889 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15889__delegate.call(this, args)
      };
      G__15889.cljs$lang$maxFixedArity = 0;
      G__15889.cljs$lang$applyTo = function(arglist__15890) {
        var args = cljs.core.seq(arglist__15890);
        return G__15889__delegate(args)
      };
      G__15889.cljs$lang$arity$variadic = G__15889__delegate;
      return G__15889
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__15891__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__15891 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15891__delegate.call(this, args)
      };
      G__15891.cljs$lang$maxFixedArity = 0;
      G__15891.cljs$lang$applyTo = function(arglist__15892) {
        var args = cljs.core.seq(arglist__15892);
        return G__15891__delegate(args)
      };
      G__15891.cljs$lang$arity$variadic = G__15891__delegate;
      return G__15891
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__15893__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__15893 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15893__delegate.call(this, args)
      };
      G__15893.cljs$lang$maxFixedArity = 0;
      G__15893.cljs$lang$applyTo = function(arglist__15894) {
        var args = cljs.core.seq(arglist__15894);
        return G__15893__delegate(args)
      };
      G__15893.cljs$lang$arity$variadic = G__15893__delegate;
      return G__15893
    }()
  };
  var partial__5 = function() {
    var G__15895__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__15896__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__15896 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__15896__delegate.call(this, args)
        };
        G__15896.cljs$lang$maxFixedArity = 0;
        G__15896.cljs$lang$applyTo = function(arglist__15897) {
          var args = cljs.core.seq(arglist__15897);
          return G__15896__delegate(args)
        };
        G__15896.cljs$lang$arity$variadic = G__15896__delegate;
        return G__15896
      }()
    };
    var G__15895 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15895__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__15895.cljs$lang$maxFixedArity = 4;
    G__15895.cljs$lang$applyTo = function(arglist__15898) {
      var f = cljs.core.first(arglist__15898);
      var arg1 = cljs.core.first(cljs.core.next(arglist__15898));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15898)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15898))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15898))));
      return G__15895__delegate(f, arg1, arg2, arg3, more)
    };
    G__15895.cljs$lang$arity$variadic = G__15895__delegate;
    return G__15895
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
      var G__15899 = null;
      var G__15899__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__15899__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__15899__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__15899__4 = function() {
        var G__15900__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__15900 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15900__delegate.call(this, a, b, c, ds)
        };
        G__15900.cljs$lang$maxFixedArity = 3;
        G__15900.cljs$lang$applyTo = function(arglist__15901) {
          var a = cljs.core.first(arglist__15901);
          var b = cljs.core.first(cljs.core.next(arglist__15901));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15901)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15901)));
          return G__15900__delegate(a, b, c, ds)
        };
        G__15900.cljs$lang$arity$variadic = G__15900__delegate;
        return G__15900
      }();
      G__15899 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__15899__1.call(this, a);
          case 2:
            return G__15899__2.call(this, a, b);
          case 3:
            return G__15899__3.call(this, a, b, c);
          default:
            return G__15899__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15899.cljs$lang$maxFixedArity = 3;
      G__15899.cljs$lang$applyTo = G__15899__4.cljs$lang$applyTo;
      return G__15899
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__15902 = null;
      var G__15902__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__15902__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__15902__4 = function() {
        var G__15903__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__15903 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15903__delegate.call(this, a, b, c, ds)
        };
        G__15903.cljs$lang$maxFixedArity = 3;
        G__15903.cljs$lang$applyTo = function(arglist__15904) {
          var a = cljs.core.first(arglist__15904);
          var b = cljs.core.first(cljs.core.next(arglist__15904));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15904)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15904)));
          return G__15903__delegate(a, b, c, ds)
        };
        G__15903.cljs$lang$arity$variadic = G__15903__delegate;
        return G__15903
      }();
      G__15902 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15902__2.call(this, a, b);
          case 3:
            return G__15902__3.call(this, a, b, c);
          default:
            return G__15902__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15902.cljs$lang$maxFixedArity = 3;
      G__15902.cljs$lang$applyTo = G__15902__4.cljs$lang$applyTo;
      return G__15902
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__15905 = null;
      var G__15905__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__15905__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__15905__4 = function() {
        var G__15906__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__15906 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15906__delegate.call(this, a, b, c, ds)
        };
        G__15906.cljs$lang$maxFixedArity = 3;
        G__15906.cljs$lang$applyTo = function(arglist__15907) {
          var a = cljs.core.first(arglist__15907);
          var b = cljs.core.first(cljs.core.next(arglist__15907));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15907)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15907)));
          return G__15906__delegate(a, b, c, ds)
        };
        G__15906.cljs$lang$arity$variadic = G__15906__delegate;
        return G__15906
      }();
      G__15905 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15905__2.call(this, a, b);
          case 3:
            return G__15905__3.call(this, a, b, c);
          default:
            return G__15905__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15905.cljs$lang$maxFixedArity = 3;
      G__15905.cljs$lang$applyTo = G__15905__4.cljs$lang$applyTo;
      return G__15905
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
  var mapi__15923 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15931 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15931) {
        var s__15932 = temp__3974__auto____15931;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15932)) {
          var c__15933 = cljs.core.chunk_first.call(null, s__15932);
          var size__15934 = cljs.core.count.call(null, c__15933);
          var b__15935 = cljs.core.chunk_buffer.call(null, size__15934);
          var n__2527__auto____15936 = size__15934;
          var i__15937 = 0;
          while(true) {
            if(i__15937 < n__2527__auto____15936) {
              cljs.core.chunk_append.call(null, b__15935, f.call(null, idx + i__15937, cljs.core._nth.call(null, c__15933, i__15937)));
              var G__15938 = i__15937 + 1;
              i__15937 = G__15938;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15935), mapi.call(null, idx + size__15934, cljs.core.chunk_rest.call(null, s__15932)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__15932)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__15932)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__15923.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15948 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15948) {
      var s__15949 = temp__3974__auto____15948;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__15949)) {
        var c__15950 = cljs.core.chunk_first.call(null, s__15949);
        var size__15951 = cljs.core.count.call(null, c__15950);
        var b__15952 = cljs.core.chunk_buffer.call(null, size__15951);
        var n__2527__auto____15953 = size__15951;
        var i__15954 = 0;
        while(true) {
          if(i__15954 < n__2527__auto____15953) {
            var x__15955 = f.call(null, cljs.core._nth.call(null, c__15950, i__15954));
            if(x__15955 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__15952, x__15955)
            }
            var G__15957 = i__15954 + 1;
            i__15954 = G__15957;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15952), keep.call(null, f, cljs.core.chunk_rest.call(null, s__15949)))
      }else {
        var x__15956 = f.call(null, cljs.core.first.call(null, s__15949));
        if(x__15956 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__15949))
        }else {
          return cljs.core.cons.call(null, x__15956, keep.call(null, f, cljs.core.rest.call(null, s__15949)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__15983 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15993 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15993) {
        var s__15994 = temp__3974__auto____15993;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15994)) {
          var c__15995 = cljs.core.chunk_first.call(null, s__15994);
          var size__15996 = cljs.core.count.call(null, c__15995);
          var b__15997 = cljs.core.chunk_buffer.call(null, size__15996);
          var n__2527__auto____15998 = size__15996;
          var i__15999 = 0;
          while(true) {
            if(i__15999 < n__2527__auto____15998) {
              var x__16000 = f.call(null, idx + i__15999, cljs.core._nth.call(null, c__15995, i__15999));
              if(x__16000 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__15997, x__16000)
              }
              var G__16002 = i__15999 + 1;
              i__15999 = G__16002;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15997), keepi.call(null, idx + size__15996, cljs.core.chunk_rest.call(null, s__15994)))
        }else {
          var x__16001 = f.call(null, idx, cljs.core.first.call(null, s__15994));
          if(x__16001 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__15994))
          }else {
            return cljs.core.cons.call(null, x__16001, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__15994)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__15983.call(null, 0, coll)
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
          var and__3822__auto____16088 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16088)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____16088
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16089 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16089)) {
            var and__3822__auto____16090 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____16090)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____16090
            }
          }else {
            return and__3822__auto____16089
          }
        }())
      };
      var ep1__4 = function() {
        var G__16159__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____16091 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____16091)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____16091
            }
          }())
        };
        var G__16159 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16159__delegate.call(this, x, y, z, args)
        };
        G__16159.cljs$lang$maxFixedArity = 3;
        G__16159.cljs$lang$applyTo = function(arglist__16160) {
          var x = cljs.core.first(arglist__16160);
          var y = cljs.core.first(cljs.core.next(arglist__16160));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16160)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16160)));
          return G__16159__delegate(x, y, z, args)
        };
        G__16159.cljs$lang$arity$variadic = G__16159__delegate;
        return G__16159
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
          var and__3822__auto____16103 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16103)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____16103
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16104 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16104)) {
            var and__3822__auto____16105 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____16105)) {
              var and__3822__auto____16106 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____16106)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____16106
              }
            }else {
              return and__3822__auto____16105
            }
          }else {
            return and__3822__auto____16104
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16107 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16107)) {
            var and__3822__auto____16108 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____16108)) {
              var and__3822__auto____16109 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____16109)) {
                var and__3822__auto____16110 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____16110)) {
                  var and__3822__auto____16111 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____16111)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____16111
                  }
                }else {
                  return and__3822__auto____16110
                }
              }else {
                return and__3822__auto____16109
              }
            }else {
              return and__3822__auto____16108
            }
          }else {
            return and__3822__auto____16107
          }
        }())
      };
      var ep2__4 = function() {
        var G__16161__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____16112 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____16112)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15958_SHARP_) {
                var and__3822__auto____16113 = p1.call(null, p1__15958_SHARP_);
                if(cljs.core.truth_(and__3822__auto____16113)) {
                  return p2.call(null, p1__15958_SHARP_)
                }else {
                  return and__3822__auto____16113
                }
              }, args)
            }else {
              return and__3822__auto____16112
            }
          }())
        };
        var G__16161 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16161__delegate.call(this, x, y, z, args)
        };
        G__16161.cljs$lang$maxFixedArity = 3;
        G__16161.cljs$lang$applyTo = function(arglist__16162) {
          var x = cljs.core.first(arglist__16162);
          var y = cljs.core.first(cljs.core.next(arglist__16162));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16162)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16162)));
          return G__16161__delegate(x, y, z, args)
        };
        G__16161.cljs$lang$arity$variadic = G__16161__delegate;
        return G__16161
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
          var and__3822__auto____16132 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16132)) {
            var and__3822__auto____16133 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16133)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____16133
            }
          }else {
            return and__3822__auto____16132
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16134 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16134)) {
            var and__3822__auto____16135 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16135)) {
              var and__3822__auto____16136 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____16136)) {
                var and__3822__auto____16137 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____16137)) {
                  var and__3822__auto____16138 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____16138)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____16138
                  }
                }else {
                  return and__3822__auto____16137
                }
              }else {
                return and__3822__auto____16136
              }
            }else {
              return and__3822__auto____16135
            }
          }else {
            return and__3822__auto____16134
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16139 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16139)) {
            var and__3822__auto____16140 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16140)) {
              var and__3822__auto____16141 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____16141)) {
                var and__3822__auto____16142 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____16142)) {
                  var and__3822__auto____16143 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____16143)) {
                    var and__3822__auto____16144 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____16144)) {
                      var and__3822__auto____16145 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____16145)) {
                        var and__3822__auto____16146 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____16146)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____16146
                        }
                      }else {
                        return and__3822__auto____16145
                      }
                    }else {
                      return and__3822__auto____16144
                    }
                  }else {
                    return and__3822__auto____16143
                  }
                }else {
                  return and__3822__auto____16142
                }
              }else {
                return and__3822__auto____16141
              }
            }else {
              return and__3822__auto____16140
            }
          }else {
            return and__3822__auto____16139
          }
        }())
      };
      var ep3__4 = function() {
        var G__16163__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____16147 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____16147)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15959_SHARP_) {
                var and__3822__auto____16148 = p1.call(null, p1__15959_SHARP_);
                if(cljs.core.truth_(and__3822__auto____16148)) {
                  var and__3822__auto____16149 = p2.call(null, p1__15959_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____16149)) {
                    return p3.call(null, p1__15959_SHARP_)
                  }else {
                    return and__3822__auto____16149
                  }
                }else {
                  return and__3822__auto____16148
                }
              }, args)
            }else {
              return and__3822__auto____16147
            }
          }())
        };
        var G__16163 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16163__delegate.call(this, x, y, z, args)
        };
        G__16163.cljs$lang$maxFixedArity = 3;
        G__16163.cljs$lang$applyTo = function(arglist__16164) {
          var x = cljs.core.first(arglist__16164);
          var y = cljs.core.first(cljs.core.next(arglist__16164));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16164)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16164)));
          return G__16163__delegate(x, y, z, args)
        };
        G__16163.cljs$lang$arity$variadic = G__16163__delegate;
        return G__16163
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
    var G__16165__delegate = function(p1, p2, p3, ps) {
      var ps__16150 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__15960_SHARP_) {
            return p1__15960_SHARP_.call(null, x)
          }, ps__16150)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__15961_SHARP_) {
            var and__3822__auto____16155 = p1__15961_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16155)) {
              return p1__15961_SHARP_.call(null, y)
            }else {
              return and__3822__auto____16155
            }
          }, ps__16150)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__15962_SHARP_) {
            var and__3822__auto____16156 = p1__15962_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16156)) {
              var and__3822__auto____16157 = p1__15962_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____16157)) {
                return p1__15962_SHARP_.call(null, z)
              }else {
                return and__3822__auto____16157
              }
            }else {
              return and__3822__auto____16156
            }
          }, ps__16150)
        };
        var epn__4 = function() {
          var G__16166__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____16158 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____16158)) {
                return cljs.core.every_QMARK_.call(null, function(p1__15963_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__15963_SHARP_, args)
                }, ps__16150)
              }else {
                return and__3822__auto____16158
              }
            }())
          };
          var G__16166 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__16166__delegate.call(this, x, y, z, args)
          };
          G__16166.cljs$lang$maxFixedArity = 3;
          G__16166.cljs$lang$applyTo = function(arglist__16167) {
            var x = cljs.core.first(arglist__16167);
            var y = cljs.core.first(cljs.core.next(arglist__16167));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16167)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16167)));
            return G__16166__delegate(x, y, z, args)
          };
          G__16166.cljs$lang$arity$variadic = G__16166__delegate;
          return G__16166
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
    var G__16165 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16165__delegate.call(this, p1, p2, p3, ps)
    };
    G__16165.cljs$lang$maxFixedArity = 3;
    G__16165.cljs$lang$applyTo = function(arglist__16168) {
      var p1 = cljs.core.first(arglist__16168);
      var p2 = cljs.core.first(cljs.core.next(arglist__16168));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16168)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16168)));
      return G__16165__delegate(p1, p2, p3, ps)
    };
    G__16165.cljs$lang$arity$variadic = G__16165__delegate;
    return G__16165
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
        var or__3824__auto____16249 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16249)) {
          return or__3824__auto____16249
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____16250 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16250)) {
          return or__3824__auto____16250
        }else {
          var or__3824__auto____16251 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____16251)) {
            return or__3824__auto____16251
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__16320__delegate = function(x, y, z, args) {
          var or__3824__auto____16252 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____16252)) {
            return or__3824__auto____16252
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__16320 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16320__delegate.call(this, x, y, z, args)
        };
        G__16320.cljs$lang$maxFixedArity = 3;
        G__16320.cljs$lang$applyTo = function(arglist__16321) {
          var x = cljs.core.first(arglist__16321);
          var y = cljs.core.first(cljs.core.next(arglist__16321));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16321)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16321)));
          return G__16320__delegate(x, y, z, args)
        };
        G__16320.cljs$lang$arity$variadic = G__16320__delegate;
        return G__16320
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
        var or__3824__auto____16264 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16264)) {
          return or__3824__auto____16264
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____16265 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16265)) {
          return or__3824__auto____16265
        }else {
          var or__3824__auto____16266 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____16266)) {
            return or__3824__auto____16266
          }else {
            var or__3824__auto____16267 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____16267)) {
              return or__3824__auto____16267
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____16268 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16268)) {
          return or__3824__auto____16268
        }else {
          var or__3824__auto____16269 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____16269)) {
            return or__3824__auto____16269
          }else {
            var or__3824__auto____16270 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____16270)) {
              return or__3824__auto____16270
            }else {
              var or__3824__auto____16271 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____16271)) {
                return or__3824__auto____16271
              }else {
                var or__3824__auto____16272 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____16272)) {
                  return or__3824__auto____16272
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__16322__delegate = function(x, y, z, args) {
          var or__3824__auto____16273 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____16273)) {
            return or__3824__auto____16273
          }else {
            return cljs.core.some.call(null, function(p1__16003_SHARP_) {
              var or__3824__auto____16274 = p1.call(null, p1__16003_SHARP_);
              if(cljs.core.truth_(or__3824__auto____16274)) {
                return or__3824__auto____16274
              }else {
                return p2.call(null, p1__16003_SHARP_)
              }
            }, args)
          }
        };
        var G__16322 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16322__delegate.call(this, x, y, z, args)
        };
        G__16322.cljs$lang$maxFixedArity = 3;
        G__16322.cljs$lang$applyTo = function(arglist__16323) {
          var x = cljs.core.first(arglist__16323);
          var y = cljs.core.first(cljs.core.next(arglist__16323));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16323)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16323)));
          return G__16322__delegate(x, y, z, args)
        };
        G__16322.cljs$lang$arity$variadic = G__16322__delegate;
        return G__16322
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
        var or__3824__auto____16293 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16293)) {
          return or__3824__auto____16293
        }else {
          var or__3824__auto____16294 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____16294)) {
            return or__3824__auto____16294
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____16295 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16295)) {
          return or__3824__auto____16295
        }else {
          var or__3824__auto____16296 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____16296)) {
            return or__3824__auto____16296
          }else {
            var or__3824__auto____16297 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____16297)) {
              return or__3824__auto____16297
            }else {
              var or__3824__auto____16298 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____16298)) {
                return or__3824__auto____16298
              }else {
                var or__3824__auto____16299 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____16299)) {
                  return or__3824__auto____16299
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____16300 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16300)) {
          return or__3824__auto____16300
        }else {
          var or__3824__auto____16301 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____16301)) {
            return or__3824__auto____16301
          }else {
            var or__3824__auto____16302 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____16302)) {
              return or__3824__auto____16302
            }else {
              var or__3824__auto____16303 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____16303)) {
                return or__3824__auto____16303
              }else {
                var or__3824__auto____16304 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____16304)) {
                  return or__3824__auto____16304
                }else {
                  var or__3824__auto____16305 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____16305)) {
                    return or__3824__auto____16305
                  }else {
                    var or__3824__auto____16306 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____16306)) {
                      return or__3824__auto____16306
                    }else {
                      var or__3824__auto____16307 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____16307)) {
                        return or__3824__auto____16307
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
        var G__16324__delegate = function(x, y, z, args) {
          var or__3824__auto____16308 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____16308)) {
            return or__3824__auto____16308
          }else {
            return cljs.core.some.call(null, function(p1__16004_SHARP_) {
              var or__3824__auto____16309 = p1.call(null, p1__16004_SHARP_);
              if(cljs.core.truth_(or__3824__auto____16309)) {
                return or__3824__auto____16309
              }else {
                var or__3824__auto____16310 = p2.call(null, p1__16004_SHARP_);
                if(cljs.core.truth_(or__3824__auto____16310)) {
                  return or__3824__auto____16310
                }else {
                  return p3.call(null, p1__16004_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__16324 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16324__delegate.call(this, x, y, z, args)
        };
        G__16324.cljs$lang$maxFixedArity = 3;
        G__16324.cljs$lang$applyTo = function(arglist__16325) {
          var x = cljs.core.first(arglist__16325);
          var y = cljs.core.first(cljs.core.next(arglist__16325));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16325)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16325)));
          return G__16324__delegate(x, y, z, args)
        };
        G__16324.cljs$lang$arity$variadic = G__16324__delegate;
        return G__16324
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
    var G__16326__delegate = function(p1, p2, p3, ps) {
      var ps__16311 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__16005_SHARP_) {
            return p1__16005_SHARP_.call(null, x)
          }, ps__16311)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__16006_SHARP_) {
            var or__3824__auto____16316 = p1__16006_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____16316)) {
              return or__3824__auto____16316
            }else {
              return p1__16006_SHARP_.call(null, y)
            }
          }, ps__16311)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__16007_SHARP_) {
            var or__3824__auto____16317 = p1__16007_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____16317)) {
              return or__3824__auto____16317
            }else {
              var or__3824__auto____16318 = p1__16007_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____16318)) {
                return or__3824__auto____16318
              }else {
                return p1__16007_SHARP_.call(null, z)
              }
            }
          }, ps__16311)
        };
        var spn__4 = function() {
          var G__16327__delegate = function(x, y, z, args) {
            var or__3824__auto____16319 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____16319)) {
              return or__3824__auto____16319
            }else {
              return cljs.core.some.call(null, function(p1__16008_SHARP_) {
                return cljs.core.some.call(null, p1__16008_SHARP_, args)
              }, ps__16311)
            }
          };
          var G__16327 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__16327__delegate.call(this, x, y, z, args)
          };
          G__16327.cljs$lang$maxFixedArity = 3;
          G__16327.cljs$lang$applyTo = function(arglist__16328) {
            var x = cljs.core.first(arglist__16328);
            var y = cljs.core.first(cljs.core.next(arglist__16328));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16328)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16328)));
            return G__16327__delegate(x, y, z, args)
          };
          G__16327.cljs$lang$arity$variadic = G__16327__delegate;
          return G__16327
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
    var G__16326 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16326__delegate.call(this, p1, p2, p3, ps)
    };
    G__16326.cljs$lang$maxFixedArity = 3;
    G__16326.cljs$lang$applyTo = function(arglist__16329) {
      var p1 = cljs.core.first(arglist__16329);
      var p2 = cljs.core.first(cljs.core.next(arglist__16329));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16329)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16329)));
      return G__16326__delegate(p1, p2, p3, ps)
    };
    G__16326.cljs$lang$arity$variadic = G__16326__delegate;
    return G__16326
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
      var temp__3974__auto____16348 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16348) {
        var s__16349 = temp__3974__auto____16348;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__16349)) {
          var c__16350 = cljs.core.chunk_first.call(null, s__16349);
          var size__16351 = cljs.core.count.call(null, c__16350);
          var b__16352 = cljs.core.chunk_buffer.call(null, size__16351);
          var n__2527__auto____16353 = size__16351;
          var i__16354 = 0;
          while(true) {
            if(i__16354 < n__2527__auto____16353) {
              cljs.core.chunk_append.call(null, b__16352, f.call(null, cljs.core._nth.call(null, c__16350, i__16354)));
              var G__16366 = i__16354 + 1;
              i__16354 = G__16366;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__16352), map.call(null, f, cljs.core.chunk_rest.call(null, s__16349)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__16349)), map.call(null, f, cljs.core.rest.call(null, s__16349)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__16355 = cljs.core.seq.call(null, c1);
      var s2__16356 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____16357 = s1__16355;
        if(and__3822__auto____16357) {
          return s2__16356
        }else {
          return and__3822__auto____16357
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__16355), cljs.core.first.call(null, s2__16356)), map.call(null, f, cljs.core.rest.call(null, s1__16355), cljs.core.rest.call(null, s2__16356)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__16358 = cljs.core.seq.call(null, c1);
      var s2__16359 = cljs.core.seq.call(null, c2);
      var s3__16360 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____16361 = s1__16358;
        if(and__3822__auto____16361) {
          var and__3822__auto____16362 = s2__16359;
          if(and__3822__auto____16362) {
            return s3__16360
          }else {
            return and__3822__auto____16362
          }
        }else {
          return and__3822__auto____16361
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__16358), cljs.core.first.call(null, s2__16359), cljs.core.first.call(null, s3__16360)), map.call(null, f, cljs.core.rest.call(null, s1__16358), cljs.core.rest.call(null, s2__16359), cljs.core.rest.call(null, s3__16360)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__16367__delegate = function(f, c1, c2, c3, colls) {
      var step__16365 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__16364 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__16364)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__16364), step.call(null, map.call(null, cljs.core.rest, ss__16364)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__16169_SHARP_) {
        return cljs.core.apply.call(null, f, p1__16169_SHARP_)
      }, step__16365.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__16367 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__16367__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__16367.cljs$lang$maxFixedArity = 4;
    G__16367.cljs$lang$applyTo = function(arglist__16368) {
      var f = cljs.core.first(arglist__16368);
      var c1 = cljs.core.first(cljs.core.next(arglist__16368));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16368)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16368))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16368))));
      return G__16367__delegate(f, c1, c2, c3, colls)
    };
    G__16367.cljs$lang$arity$variadic = G__16367__delegate;
    return G__16367
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
      var temp__3974__auto____16371 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16371) {
        var s__16372 = temp__3974__auto____16371;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__16372), take.call(null, n - 1, cljs.core.rest.call(null, s__16372)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__16378 = function(n, coll) {
    while(true) {
      var s__16376 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____16377 = n > 0;
        if(and__3822__auto____16377) {
          return s__16376
        }else {
          return and__3822__auto____16377
        }
      }())) {
        var G__16379 = n - 1;
        var G__16380 = cljs.core.rest.call(null, s__16376);
        n = G__16379;
        coll = G__16380;
        continue
      }else {
        return s__16376
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__16378.call(null, n, coll)
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
  var s__16383 = cljs.core.seq.call(null, coll);
  var lead__16384 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__16384) {
      var G__16385 = cljs.core.next.call(null, s__16383);
      var G__16386 = cljs.core.next.call(null, lead__16384);
      s__16383 = G__16385;
      lead__16384 = G__16386;
      continue
    }else {
      return s__16383
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__16392 = function(pred, coll) {
    while(true) {
      var s__16390 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____16391 = s__16390;
        if(and__3822__auto____16391) {
          return pred.call(null, cljs.core.first.call(null, s__16390))
        }else {
          return and__3822__auto____16391
        }
      }())) {
        var G__16393 = pred;
        var G__16394 = cljs.core.rest.call(null, s__16390);
        pred = G__16393;
        coll = G__16394;
        continue
      }else {
        return s__16390
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__16392.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____16397 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____16397) {
      var s__16398 = temp__3974__auto____16397;
      return cljs.core.concat.call(null, s__16398, cycle.call(null, s__16398))
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
      var s1__16403 = cljs.core.seq.call(null, c1);
      var s2__16404 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____16405 = s1__16403;
        if(and__3822__auto____16405) {
          return s2__16404
        }else {
          return and__3822__auto____16405
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__16403), cljs.core.cons.call(null, cljs.core.first.call(null, s2__16404), interleave.call(null, cljs.core.rest.call(null, s1__16403), cljs.core.rest.call(null, s2__16404))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__16407__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__16406 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__16406)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__16406), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__16406)))
        }else {
          return null
        }
      }, null)
    };
    var G__16407 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16407__delegate.call(this, c1, c2, colls)
    };
    G__16407.cljs$lang$maxFixedArity = 2;
    G__16407.cljs$lang$applyTo = function(arglist__16408) {
      var c1 = cljs.core.first(arglist__16408);
      var c2 = cljs.core.first(cljs.core.next(arglist__16408));
      var colls = cljs.core.rest(cljs.core.next(arglist__16408));
      return G__16407__delegate(c1, c2, colls)
    };
    G__16407.cljs$lang$arity$variadic = G__16407__delegate;
    return G__16407
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
  var cat__16418 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____16416 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____16416) {
        var coll__16417 = temp__3971__auto____16416;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__16417), cat.call(null, cljs.core.rest.call(null, coll__16417), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__16418.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__16419__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__16419 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16419__delegate.call(this, f, coll, colls)
    };
    G__16419.cljs$lang$maxFixedArity = 2;
    G__16419.cljs$lang$applyTo = function(arglist__16420) {
      var f = cljs.core.first(arglist__16420);
      var coll = cljs.core.first(cljs.core.next(arglist__16420));
      var colls = cljs.core.rest(cljs.core.next(arglist__16420));
      return G__16419__delegate(f, coll, colls)
    };
    G__16419.cljs$lang$arity$variadic = G__16419__delegate;
    return G__16419
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
    var temp__3974__auto____16430 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____16430) {
      var s__16431 = temp__3974__auto____16430;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__16431)) {
        var c__16432 = cljs.core.chunk_first.call(null, s__16431);
        var size__16433 = cljs.core.count.call(null, c__16432);
        var b__16434 = cljs.core.chunk_buffer.call(null, size__16433);
        var n__2527__auto____16435 = size__16433;
        var i__16436 = 0;
        while(true) {
          if(i__16436 < n__2527__auto____16435) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__16432, i__16436)))) {
              cljs.core.chunk_append.call(null, b__16434, cljs.core._nth.call(null, c__16432, i__16436))
            }else {
            }
            var G__16439 = i__16436 + 1;
            i__16436 = G__16439;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__16434), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__16431)))
      }else {
        var f__16437 = cljs.core.first.call(null, s__16431);
        var r__16438 = cljs.core.rest.call(null, s__16431);
        if(cljs.core.truth_(pred.call(null, f__16437))) {
          return cljs.core.cons.call(null, f__16437, filter.call(null, pred, r__16438))
        }else {
          return filter.call(null, pred, r__16438)
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
  var walk__16442 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__16442.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__16440_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__16440_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__16446__16447 = to;
    if(G__16446__16447) {
      if(function() {
        var or__3824__auto____16448 = G__16446__16447.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____16448) {
          return or__3824__auto____16448
        }else {
          return G__16446__16447.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__16446__16447.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__16446__16447)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__16446__16447)
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
    var G__16449__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__16449 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__16449__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__16449.cljs$lang$maxFixedArity = 4;
    G__16449.cljs$lang$applyTo = function(arglist__16450) {
      var f = cljs.core.first(arglist__16450);
      var c1 = cljs.core.first(cljs.core.next(arglist__16450));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16450)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16450))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16450))));
      return G__16449__delegate(f, c1, c2, c3, colls)
    };
    G__16449.cljs$lang$arity$variadic = G__16449__delegate;
    return G__16449
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
      var temp__3974__auto____16457 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16457) {
        var s__16458 = temp__3974__auto____16457;
        var p__16459 = cljs.core.take.call(null, n, s__16458);
        if(n === cljs.core.count.call(null, p__16459)) {
          return cljs.core.cons.call(null, p__16459, partition.call(null, n, step, cljs.core.drop.call(null, step, s__16458)))
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
      var temp__3974__auto____16460 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16460) {
        var s__16461 = temp__3974__auto____16460;
        var p__16462 = cljs.core.take.call(null, n, s__16461);
        if(n === cljs.core.count.call(null, p__16462)) {
          return cljs.core.cons.call(null, p__16462, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__16461)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__16462, pad)))
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
    var sentinel__16467 = cljs.core.lookup_sentinel;
    var m__16468 = m;
    var ks__16469 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__16469) {
        var m__16470 = cljs.core._lookup.call(null, m__16468, cljs.core.first.call(null, ks__16469), sentinel__16467);
        if(sentinel__16467 === m__16470) {
          return not_found
        }else {
          var G__16471 = sentinel__16467;
          var G__16472 = m__16470;
          var G__16473 = cljs.core.next.call(null, ks__16469);
          sentinel__16467 = G__16471;
          m__16468 = G__16472;
          ks__16469 = G__16473;
          continue
        }
      }else {
        return m__16468
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
cljs.core.assoc_in = function assoc_in(m, p__16474, v) {
  var vec__16479__16480 = p__16474;
  var k__16481 = cljs.core.nth.call(null, vec__16479__16480, 0, null);
  var ks__16482 = cljs.core.nthnext.call(null, vec__16479__16480, 1);
  if(cljs.core.truth_(ks__16482)) {
    return cljs.core.assoc.call(null, m, k__16481, assoc_in.call(null, cljs.core._lookup.call(null, m, k__16481, null), ks__16482, v))
  }else {
    return cljs.core.assoc.call(null, m, k__16481, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__16483, f, args) {
    var vec__16488__16489 = p__16483;
    var k__16490 = cljs.core.nth.call(null, vec__16488__16489, 0, null);
    var ks__16491 = cljs.core.nthnext.call(null, vec__16488__16489, 1);
    if(cljs.core.truth_(ks__16491)) {
      return cljs.core.assoc.call(null, m, k__16490, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__16490, null), ks__16491, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__16490, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__16490, null), args))
    }
  };
  var update_in = function(m, p__16483, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__16483, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__16492) {
    var m = cljs.core.first(arglist__16492);
    var p__16483 = cljs.core.first(cljs.core.next(arglist__16492));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16492)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16492)));
    return update_in__delegate(m, p__16483, f, args)
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
  var this__16495 = this;
  var h__2192__auto____16496 = this__16495.__hash;
  if(!(h__2192__auto____16496 == null)) {
    return h__2192__auto____16496
  }else {
    var h__2192__auto____16497 = cljs.core.hash_coll.call(null, coll);
    this__16495.__hash = h__2192__auto____16497;
    return h__2192__auto____16497
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16498 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16499 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16500 = this;
  var new_array__16501 = this__16500.array.slice();
  new_array__16501[k] = v;
  return new cljs.core.Vector(this__16500.meta, new_array__16501, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__16532 = null;
  var G__16532__2 = function(this_sym16502, k) {
    var this__16504 = this;
    var this_sym16502__16505 = this;
    var coll__16506 = this_sym16502__16505;
    return coll__16506.cljs$core$ILookup$_lookup$arity$2(coll__16506, k)
  };
  var G__16532__3 = function(this_sym16503, k, not_found) {
    var this__16504 = this;
    var this_sym16503__16507 = this;
    var coll__16508 = this_sym16503__16507;
    return coll__16508.cljs$core$ILookup$_lookup$arity$3(coll__16508, k, not_found)
  };
  G__16532 = function(this_sym16503, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16532__2.call(this, this_sym16503, k);
      case 3:
        return G__16532__3.call(this, this_sym16503, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16532
}();
cljs.core.Vector.prototype.apply = function(this_sym16493, args16494) {
  var this__16509 = this;
  return this_sym16493.call.apply(this_sym16493, [this_sym16493].concat(args16494.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16510 = this;
  var new_array__16511 = this__16510.array.slice();
  new_array__16511.push(o);
  return new cljs.core.Vector(this__16510.meta, new_array__16511, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__16512 = this;
  var this__16513 = this;
  return cljs.core.pr_str.call(null, this__16513)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__16514 = this;
  return cljs.core.ci_reduce.call(null, this__16514.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__16515 = this;
  return cljs.core.ci_reduce.call(null, this__16515.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16516 = this;
  if(this__16516.array.length > 0) {
    var vector_seq__16517 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__16516.array.length) {
          return cljs.core.cons.call(null, this__16516.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__16517.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16518 = this;
  return this__16518.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16519 = this;
  var count__16520 = this__16519.array.length;
  if(count__16520 > 0) {
    return this__16519.array[count__16520 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16521 = this;
  if(this__16521.array.length > 0) {
    var new_array__16522 = this__16521.array.slice();
    new_array__16522.pop();
    return new cljs.core.Vector(this__16521.meta, new_array__16522, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__16523 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16524 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16525 = this;
  return new cljs.core.Vector(meta, this__16525.array, this__16525.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16526 = this;
  return this__16526.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__16527 = this;
  if(function() {
    var and__3822__auto____16528 = 0 <= n;
    if(and__3822__auto____16528) {
      return n < this__16527.array.length
    }else {
      return and__3822__auto____16528
    }
  }()) {
    return this__16527.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__16529 = this;
  if(function() {
    var and__3822__auto____16530 = 0 <= n;
    if(and__3822__auto____16530) {
      return n < this__16529.array.length
    }else {
      return and__3822__auto____16530
    }
  }()) {
    return this__16529.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16531 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__16531.meta)
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
  var cnt__16534 = pv.cnt;
  if(cnt__16534 < 32) {
    return 0
  }else {
    return cnt__16534 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__16540 = level;
  var ret__16541 = node;
  while(true) {
    if(ll__16540 === 0) {
      return ret__16541
    }else {
      var embed__16542 = ret__16541;
      var r__16543 = cljs.core.pv_fresh_node.call(null, edit);
      var ___16544 = cljs.core.pv_aset.call(null, r__16543, 0, embed__16542);
      var G__16545 = ll__16540 - 5;
      var G__16546 = r__16543;
      ll__16540 = G__16545;
      ret__16541 = G__16546;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__16552 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__16553 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__16552, subidx__16553, tailnode);
    return ret__16552
  }else {
    var child__16554 = cljs.core.pv_aget.call(null, parent, subidx__16553);
    if(!(child__16554 == null)) {
      var node_to_insert__16555 = push_tail.call(null, pv, level - 5, child__16554, tailnode);
      cljs.core.pv_aset.call(null, ret__16552, subidx__16553, node_to_insert__16555);
      return ret__16552
    }else {
      var node_to_insert__16556 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__16552, subidx__16553, node_to_insert__16556);
      return ret__16552
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____16560 = 0 <= i;
    if(and__3822__auto____16560) {
      return i < pv.cnt
    }else {
      return and__3822__auto____16560
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__16561 = pv.root;
      var level__16562 = pv.shift;
      while(true) {
        if(level__16562 > 0) {
          var G__16563 = cljs.core.pv_aget.call(null, node__16561, i >>> level__16562 & 31);
          var G__16564 = level__16562 - 5;
          node__16561 = G__16563;
          level__16562 = G__16564;
          continue
        }else {
          return node__16561.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__16567 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__16567, i & 31, val);
    return ret__16567
  }else {
    var subidx__16568 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__16567, subidx__16568, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__16568), i, val));
    return ret__16567
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__16574 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__16575 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__16574));
    if(function() {
      var and__3822__auto____16576 = new_child__16575 == null;
      if(and__3822__auto____16576) {
        return subidx__16574 === 0
      }else {
        return and__3822__auto____16576
      }
    }()) {
      return null
    }else {
      var ret__16577 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__16577, subidx__16574, new_child__16575);
      return ret__16577
    }
  }else {
    if(subidx__16574 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__16578 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__16578, subidx__16574, null);
        return ret__16578
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
  var this__16581 = this;
  return new cljs.core.TransientVector(this__16581.cnt, this__16581.shift, cljs.core.tv_editable_root.call(null, this__16581.root), cljs.core.tv_editable_tail.call(null, this__16581.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16582 = this;
  var h__2192__auto____16583 = this__16582.__hash;
  if(!(h__2192__auto____16583 == null)) {
    return h__2192__auto____16583
  }else {
    var h__2192__auto____16584 = cljs.core.hash_coll.call(null, coll);
    this__16582.__hash = h__2192__auto____16584;
    return h__2192__auto____16584
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16585 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16586 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16587 = this;
  if(function() {
    var and__3822__auto____16588 = 0 <= k;
    if(and__3822__auto____16588) {
      return k < this__16587.cnt
    }else {
      return and__3822__auto____16588
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__16589 = this__16587.tail.slice();
      new_tail__16589[k & 31] = v;
      return new cljs.core.PersistentVector(this__16587.meta, this__16587.cnt, this__16587.shift, this__16587.root, new_tail__16589, null)
    }else {
      return new cljs.core.PersistentVector(this__16587.meta, this__16587.cnt, this__16587.shift, cljs.core.do_assoc.call(null, coll, this__16587.shift, this__16587.root, k, v), this__16587.tail, null)
    }
  }else {
    if(k === this__16587.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__16587.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__16637 = null;
  var G__16637__2 = function(this_sym16590, k) {
    var this__16592 = this;
    var this_sym16590__16593 = this;
    var coll__16594 = this_sym16590__16593;
    return coll__16594.cljs$core$ILookup$_lookup$arity$2(coll__16594, k)
  };
  var G__16637__3 = function(this_sym16591, k, not_found) {
    var this__16592 = this;
    var this_sym16591__16595 = this;
    var coll__16596 = this_sym16591__16595;
    return coll__16596.cljs$core$ILookup$_lookup$arity$3(coll__16596, k, not_found)
  };
  G__16637 = function(this_sym16591, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16637__2.call(this, this_sym16591, k);
      case 3:
        return G__16637__3.call(this, this_sym16591, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16637
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym16579, args16580) {
  var this__16597 = this;
  return this_sym16579.call.apply(this_sym16579, [this_sym16579].concat(args16580.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__16598 = this;
  var step_init__16599 = [0, init];
  var i__16600 = 0;
  while(true) {
    if(i__16600 < this__16598.cnt) {
      var arr__16601 = cljs.core.array_for.call(null, v, i__16600);
      var len__16602 = arr__16601.length;
      var init__16606 = function() {
        var j__16603 = 0;
        var init__16604 = step_init__16599[1];
        while(true) {
          if(j__16603 < len__16602) {
            var init__16605 = f.call(null, init__16604, j__16603 + i__16600, arr__16601[j__16603]);
            if(cljs.core.reduced_QMARK_.call(null, init__16605)) {
              return init__16605
            }else {
              var G__16638 = j__16603 + 1;
              var G__16639 = init__16605;
              j__16603 = G__16638;
              init__16604 = G__16639;
              continue
            }
          }else {
            step_init__16599[0] = len__16602;
            step_init__16599[1] = init__16604;
            return init__16604
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__16606)) {
        return cljs.core.deref.call(null, init__16606)
      }else {
        var G__16640 = i__16600 + step_init__16599[0];
        i__16600 = G__16640;
        continue
      }
    }else {
      return step_init__16599[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16607 = this;
  if(this__16607.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__16608 = this__16607.tail.slice();
    new_tail__16608.push(o);
    return new cljs.core.PersistentVector(this__16607.meta, this__16607.cnt + 1, this__16607.shift, this__16607.root, new_tail__16608, null)
  }else {
    var root_overflow_QMARK___16609 = this__16607.cnt >>> 5 > 1 << this__16607.shift;
    var new_shift__16610 = root_overflow_QMARK___16609 ? this__16607.shift + 5 : this__16607.shift;
    var new_root__16612 = root_overflow_QMARK___16609 ? function() {
      var n_r__16611 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__16611, 0, this__16607.root);
      cljs.core.pv_aset.call(null, n_r__16611, 1, cljs.core.new_path.call(null, null, this__16607.shift, new cljs.core.VectorNode(null, this__16607.tail)));
      return n_r__16611
    }() : cljs.core.push_tail.call(null, coll, this__16607.shift, this__16607.root, new cljs.core.VectorNode(null, this__16607.tail));
    return new cljs.core.PersistentVector(this__16607.meta, this__16607.cnt + 1, new_shift__16610, new_root__16612, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__16613 = this;
  if(this__16613.cnt > 0) {
    return new cljs.core.RSeq(coll, this__16613.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__16614 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__16615 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__16616 = this;
  var this__16617 = this;
  return cljs.core.pr_str.call(null, this__16617)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__16618 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__16619 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16620 = this;
  if(this__16620.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16621 = this;
  return this__16621.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16622 = this;
  if(this__16622.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__16622.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16623 = this;
  if(this__16623.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__16623.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__16623.meta)
    }else {
      if(1 < this__16623.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__16623.meta, this__16623.cnt - 1, this__16623.shift, this__16623.root, this__16623.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__16624 = cljs.core.array_for.call(null, coll, this__16623.cnt - 2);
          var nr__16625 = cljs.core.pop_tail.call(null, coll, this__16623.shift, this__16623.root);
          var new_root__16626 = nr__16625 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__16625;
          var cnt_1__16627 = this__16623.cnt - 1;
          if(function() {
            var and__3822__auto____16628 = 5 < this__16623.shift;
            if(and__3822__auto____16628) {
              return cljs.core.pv_aget.call(null, new_root__16626, 1) == null
            }else {
              return and__3822__auto____16628
            }
          }()) {
            return new cljs.core.PersistentVector(this__16623.meta, cnt_1__16627, this__16623.shift - 5, cljs.core.pv_aget.call(null, new_root__16626, 0), new_tail__16624, null)
          }else {
            return new cljs.core.PersistentVector(this__16623.meta, cnt_1__16627, this__16623.shift, new_root__16626, new_tail__16624, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__16629 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16630 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16631 = this;
  return new cljs.core.PersistentVector(meta, this__16631.cnt, this__16631.shift, this__16631.root, this__16631.tail, this__16631.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16632 = this;
  return this__16632.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__16633 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__16634 = this;
  if(function() {
    var and__3822__auto____16635 = 0 <= n;
    if(and__3822__auto____16635) {
      return n < this__16634.cnt
    }else {
      return and__3822__auto____16635
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16636 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__16636.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__16641 = xs.length;
  var xs__16642 = no_clone === true ? xs : xs.slice();
  if(l__16641 < 32) {
    return new cljs.core.PersistentVector(null, l__16641, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__16642, null)
  }else {
    var node__16643 = xs__16642.slice(0, 32);
    var v__16644 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__16643, null);
    var i__16645 = 32;
    var out__16646 = cljs.core._as_transient.call(null, v__16644);
    while(true) {
      if(i__16645 < l__16641) {
        var G__16647 = i__16645 + 1;
        var G__16648 = cljs.core.conj_BANG_.call(null, out__16646, xs__16642[i__16645]);
        i__16645 = G__16647;
        out__16646 = G__16648;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__16646)
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
  vector.cljs$lang$applyTo = function(arglist__16649) {
    var args = cljs.core.seq(arglist__16649);
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
  var this__16650 = this;
  if(this__16650.off + 1 < this__16650.node.length) {
    var s__16651 = cljs.core.chunked_seq.call(null, this__16650.vec, this__16650.node, this__16650.i, this__16650.off + 1);
    if(s__16651 == null) {
      return null
    }else {
      return s__16651
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16652 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16653 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16654 = this;
  return this__16654.node[this__16654.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16655 = this;
  if(this__16655.off + 1 < this__16655.node.length) {
    var s__16656 = cljs.core.chunked_seq.call(null, this__16655.vec, this__16655.node, this__16655.i, this__16655.off + 1);
    if(s__16656 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__16656
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__16657 = this;
  var l__16658 = this__16657.node.length;
  var s__16659 = this__16657.i + l__16658 < cljs.core._count.call(null, this__16657.vec) ? cljs.core.chunked_seq.call(null, this__16657.vec, this__16657.i + l__16658, 0) : null;
  if(s__16659 == null) {
    return null
  }else {
    return s__16659
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16660 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__16661 = this;
  return cljs.core.chunked_seq.call(null, this__16661.vec, this__16661.node, this__16661.i, this__16661.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__16662 = this;
  return this__16662.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16663 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__16663.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__16664 = this;
  return cljs.core.array_chunk.call(null, this__16664.node, this__16664.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__16665 = this;
  var l__16666 = this__16665.node.length;
  var s__16667 = this__16665.i + l__16666 < cljs.core._count.call(null, this__16665.vec) ? cljs.core.chunked_seq.call(null, this__16665.vec, this__16665.i + l__16666, 0) : null;
  if(s__16667 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__16667
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
  var this__16670 = this;
  var h__2192__auto____16671 = this__16670.__hash;
  if(!(h__2192__auto____16671 == null)) {
    return h__2192__auto____16671
  }else {
    var h__2192__auto____16672 = cljs.core.hash_coll.call(null, coll);
    this__16670.__hash = h__2192__auto____16672;
    return h__2192__auto____16672
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16673 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16674 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__16675 = this;
  var v_pos__16676 = this__16675.start + key;
  return new cljs.core.Subvec(this__16675.meta, cljs.core._assoc.call(null, this__16675.v, v_pos__16676, val), this__16675.start, this__16675.end > v_pos__16676 + 1 ? this__16675.end : v_pos__16676 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__16702 = null;
  var G__16702__2 = function(this_sym16677, k) {
    var this__16679 = this;
    var this_sym16677__16680 = this;
    var coll__16681 = this_sym16677__16680;
    return coll__16681.cljs$core$ILookup$_lookup$arity$2(coll__16681, k)
  };
  var G__16702__3 = function(this_sym16678, k, not_found) {
    var this__16679 = this;
    var this_sym16678__16682 = this;
    var coll__16683 = this_sym16678__16682;
    return coll__16683.cljs$core$ILookup$_lookup$arity$3(coll__16683, k, not_found)
  };
  G__16702 = function(this_sym16678, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16702__2.call(this, this_sym16678, k);
      case 3:
        return G__16702__3.call(this, this_sym16678, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16702
}();
cljs.core.Subvec.prototype.apply = function(this_sym16668, args16669) {
  var this__16684 = this;
  return this_sym16668.call.apply(this_sym16668, [this_sym16668].concat(args16669.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16685 = this;
  return new cljs.core.Subvec(this__16685.meta, cljs.core._assoc_n.call(null, this__16685.v, this__16685.end, o), this__16685.start, this__16685.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__16686 = this;
  var this__16687 = this;
  return cljs.core.pr_str.call(null, this__16687)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__16688 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__16689 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16690 = this;
  var subvec_seq__16691 = function subvec_seq(i) {
    if(i === this__16690.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__16690.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__16691.call(null, this__16690.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16692 = this;
  return this__16692.end - this__16692.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16693 = this;
  return cljs.core._nth.call(null, this__16693.v, this__16693.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16694 = this;
  if(this__16694.start === this__16694.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__16694.meta, this__16694.v, this__16694.start, this__16694.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__16695 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16696 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16697 = this;
  return new cljs.core.Subvec(meta, this__16697.v, this__16697.start, this__16697.end, this__16697.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16698 = this;
  return this__16698.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__16699 = this;
  return cljs.core._nth.call(null, this__16699.v, this__16699.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__16700 = this;
  return cljs.core._nth.call(null, this__16700.v, this__16700.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16701 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__16701.meta)
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
  var ret__16704 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__16704, 0, tl.length);
  return ret__16704
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__16708 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__16709 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__16708, subidx__16709, level === 5 ? tail_node : function() {
    var child__16710 = cljs.core.pv_aget.call(null, ret__16708, subidx__16709);
    if(!(child__16710 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__16710, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__16708
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__16715 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__16716 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__16717 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__16715, subidx__16716));
    if(function() {
      var and__3822__auto____16718 = new_child__16717 == null;
      if(and__3822__auto____16718) {
        return subidx__16716 === 0
      }else {
        return and__3822__auto____16718
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__16715, subidx__16716, new_child__16717);
      return node__16715
    }
  }else {
    if(subidx__16716 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__16715, subidx__16716, null);
        return node__16715
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____16723 = 0 <= i;
    if(and__3822__auto____16723) {
      return i < tv.cnt
    }else {
      return and__3822__auto____16723
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__16724 = tv.root;
      var node__16725 = root__16724;
      var level__16726 = tv.shift;
      while(true) {
        if(level__16726 > 0) {
          var G__16727 = cljs.core.tv_ensure_editable.call(null, root__16724.edit, cljs.core.pv_aget.call(null, node__16725, i >>> level__16726 & 31));
          var G__16728 = level__16726 - 5;
          node__16725 = G__16727;
          level__16726 = G__16728;
          continue
        }else {
          return node__16725.arr
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
  var G__16768 = null;
  var G__16768__2 = function(this_sym16731, k) {
    var this__16733 = this;
    var this_sym16731__16734 = this;
    var coll__16735 = this_sym16731__16734;
    return coll__16735.cljs$core$ILookup$_lookup$arity$2(coll__16735, k)
  };
  var G__16768__3 = function(this_sym16732, k, not_found) {
    var this__16733 = this;
    var this_sym16732__16736 = this;
    var coll__16737 = this_sym16732__16736;
    return coll__16737.cljs$core$ILookup$_lookup$arity$3(coll__16737, k, not_found)
  };
  G__16768 = function(this_sym16732, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16768__2.call(this, this_sym16732, k);
      case 3:
        return G__16768__3.call(this, this_sym16732, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16768
}();
cljs.core.TransientVector.prototype.apply = function(this_sym16729, args16730) {
  var this__16738 = this;
  return this_sym16729.call.apply(this_sym16729, [this_sym16729].concat(args16730.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16739 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16740 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__16741 = this;
  if(this__16741.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__16742 = this;
  if(function() {
    var and__3822__auto____16743 = 0 <= n;
    if(and__3822__auto____16743) {
      return n < this__16742.cnt
    }else {
      return and__3822__auto____16743
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16744 = this;
  if(this__16744.root.edit) {
    return this__16744.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__16745 = this;
  if(this__16745.root.edit) {
    if(function() {
      var and__3822__auto____16746 = 0 <= n;
      if(and__3822__auto____16746) {
        return n < this__16745.cnt
      }else {
        return and__3822__auto____16746
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__16745.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__16751 = function go(level, node) {
          var node__16749 = cljs.core.tv_ensure_editable.call(null, this__16745.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__16749, n & 31, val);
            return node__16749
          }else {
            var subidx__16750 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__16749, subidx__16750, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__16749, subidx__16750)));
            return node__16749
          }
        }.call(null, this__16745.shift, this__16745.root);
        this__16745.root = new_root__16751;
        return tcoll
      }
    }else {
      if(n === this__16745.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__16745.cnt)].join(""));
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
  var this__16752 = this;
  if(this__16752.root.edit) {
    if(this__16752.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__16752.cnt) {
        this__16752.cnt = 0;
        return tcoll
      }else {
        if((this__16752.cnt - 1 & 31) > 0) {
          this__16752.cnt = this__16752.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__16753 = cljs.core.editable_array_for.call(null, tcoll, this__16752.cnt - 2);
            var new_root__16755 = function() {
              var nr__16754 = cljs.core.tv_pop_tail.call(null, tcoll, this__16752.shift, this__16752.root);
              if(!(nr__16754 == null)) {
                return nr__16754
              }else {
                return new cljs.core.VectorNode(this__16752.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____16756 = 5 < this__16752.shift;
              if(and__3822__auto____16756) {
                return cljs.core.pv_aget.call(null, new_root__16755, 1) == null
              }else {
                return and__3822__auto____16756
              }
            }()) {
              var new_root__16757 = cljs.core.tv_ensure_editable.call(null, this__16752.root.edit, cljs.core.pv_aget.call(null, new_root__16755, 0));
              this__16752.root = new_root__16757;
              this__16752.shift = this__16752.shift - 5;
              this__16752.cnt = this__16752.cnt - 1;
              this__16752.tail = new_tail__16753;
              return tcoll
            }else {
              this__16752.root = new_root__16755;
              this__16752.cnt = this__16752.cnt - 1;
              this__16752.tail = new_tail__16753;
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
  var this__16758 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__16759 = this;
  if(this__16759.root.edit) {
    if(this__16759.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__16759.tail[this__16759.cnt & 31] = o;
      this__16759.cnt = this__16759.cnt + 1;
      return tcoll
    }else {
      var tail_node__16760 = new cljs.core.VectorNode(this__16759.root.edit, this__16759.tail);
      var new_tail__16761 = cljs.core.make_array.call(null, 32);
      new_tail__16761[0] = o;
      this__16759.tail = new_tail__16761;
      if(this__16759.cnt >>> 5 > 1 << this__16759.shift) {
        var new_root_array__16762 = cljs.core.make_array.call(null, 32);
        var new_shift__16763 = this__16759.shift + 5;
        new_root_array__16762[0] = this__16759.root;
        new_root_array__16762[1] = cljs.core.new_path.call(null, this__16759.root.edit, this__16759.shift, tail_node__16760);
        this__16759.root = new cljs.core.VectorNode(this__16759.root.edit, new_root_array__16762);
        this__16759.shift = new_shift__16763;
        this__16759.cnt = this__16759.cnt + 1;
        return tcoll
      }else {
        var new_root__16764 = cljs.core.tv_push_tail.call(null, tcoll, this__16759.shift, this__16759.root, tail_node__16760);
        this__16759.root = new_root__16764;
        this__16759.cnt = this__16759.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16765 = this;
  if(this__16765.root.edit) {
    this__16765.root.edit = null;
    var len__16766 = this__16765.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__16767 = cljs.core.make_array.call(null, len__16766);
    cljs.core.array_copy.call(null, this__16765.tail, 0, trimmed_tail__16767, 0, len__16766);
    return new cljs.core.PersistentVector(null, this__16765.cnt, this__16765.shift, this__16765.root, trimmed_tail__16767, null)
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
  var this__16769 = this;
  var h__2192__auto____16770 = this__16769.__hash;
  if(!(h__2192__auto____16770 == null)) {
    return h__2192__auto____16770
  }else {
    var h__2192__auto____16771 = cljs.core.hash_coll.call(null, coll);
    this__16769.__hash = h__2192__auto____16771;
    return h__2192__auto____16771
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16772 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__16773 = this;
  var this__16774 = this;
  return cljs.core.pr_str.call(null, this__16774)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16775 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16776 = this;
  return cljs.core._first.call(null, this__16776.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16777 = this;
  var temp__3971__auto____16778 = cljs.core.next.call(null, this__16777.front);
  if(temp__3971__auto____16778) {
    var f1__16779 = temp__3971__auto____16778;
    return new cljs.core.PersistentQueueSeq(this__16777.meta, f1__16779, this__16777.rear, null)
  }else {
    if(this__16777.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__16777.meta, this__16777.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16780 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16781 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__16781.front, this__16781.rear, this__16781.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16782 = this;
  return this__16782.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16783 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16783.meta)
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
  var this__16784 = this;
  var h__2192__auto____16785 = this__16784.__hash;
  if(!(h__2192__auto____16785 == null)) {
    return h__2192__auto____16785
  }else {
    var h__2192__auto____16786 = cljs.core.hash_coll.call(null, coll);
    this__16784.__hash = h__2192__auto____16786;
    return h__2192__auto____16786
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16787 = this;
  if(cljs.core.truth_(this__16787.front)) {
    return new cljs.core.PersistentQueue(this__16787.meta, this__16787.count + 1, this__16787.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____16788 = this__16787.rear;
      if(cljs.core.truth_(or__3824__auto____16788)) {
        return or__3824__auto____16788
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__16787.meta, this__16787.count + 1, cljs.core.conj.call(null, this__16787.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__16789 = this;
  var this__16790 = this;
  return cljs.core.pr_str.call(null, this__16790)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16791 = this;
  var rear__16792 = cljs.core.seq.call(null, this__16791.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____16793 = this__16791.front;
    if(cljs.core.truth_(or__3824__auto____16793)) {
      return or__3824__auto____16793
    }else {
      return rear__16792
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__16791.front, cljs.core.seq.call(null, rear__16792), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16794 = this;
  return this__16794.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16795 = this;
  return cljs.core._first.call(null, this__16795.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16796 = this;
  if(cljs.core.truth_(this__16796.front)) {
    var temp__3971__auto____16797 = cljs.core.next.call(null, this__16796.front);
    if(temp__3971__auto____16797) {
      var f1__16798 = temp__3971__auto____16797;
      return new cljs.core.PersistentQueue(this__16796.meta, this__16796.count - 1, f1__16798, this__16796.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__16796.meta, this__16796.count - 1, cljs.core.seq.call(null, this__16796.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16799 = this;
  return cljs.core.first.call(null, this__16799.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16800 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16801 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16802 = this;
  return new cljs.core.PersistentQueue(meta, this__16802.count, this__16802.front, this__16802.rear, this__16802.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16803 = this;
  return this__16803.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16804 = this;
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
  var this__16805 = this;
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
  var len__16808 = array.length;
  var i__16809 = 0;
  while(true) {
    if(i__16809 < len__16808) {
      if(k === array[i__16809]) {
        return i__16809
      }else {
        var G__16810 = i__16809 + incr;
        i__16809 = G__16810;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__16813 = cljs.core.hash.call(null, a);
  var b__16814 = cljs.core.hash.call(null, b);
  if(a__16813 < b__16814) {
    return-1
  }else {
    if(a__16813 > b__16814) {
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
  var ks__16822 = m.keys;
  var len__16823 = ks__16822.length;
  var so__16824 = m.strobj;
  var out__16825 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__16826 = 0;
  var out__16827 = cljs.core.transient$.call(null, out__16825);
  while(true) {
    if(i__16826 < len__16823) {
      var k__16828 = ks__16822[i__16826];
      var G__16829 = i__16826 + 1;
      var G__16830 = cljs.core.assoc_BANG_.call(null, out__16827, k__16828, so__16824[k__16828]);
      i__16826 = G__16829;
      out__16827 = G__16830;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__16827, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__16836 = {};
  var l__16837 = ks.length;
  var i__16838 = 0;
  while(true) {
    if(i__16838 < l__16837) {
      var k__16839 = ks[i__16838];
      new_obj__16836[k__16839] = obj[k__16839];
      var G__16840 = i__16838 + 1;
      i__16838 = G__16840;
      continue
    }else {
    }
    break
  }
  return new_obj__16836
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
  var this__16843 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16844 = this;
  var h__2192__auto____16845 = this__16844.__hash;
  if(!(h__2192__auto____16845 == null)) {
    return h__2192__auto____16845
  }else {
    var h__2192__auto____16846 = cljs.core.hash_imap.call(null, coll);
    this__16844.__hash = h__2192__auto____16846;
    return h__2192__auto____16846
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16847 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16848 = this;
  if(function() {
    var and__3822__auto____16849 = goog.isString(k);
    if(and__3822__auto____16849) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16848.keys) == null)
    }else {
      return and__3822__auto____16849
    }
  }()) {
    return this__16848.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16850 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____16851 = this__16850.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____16851) {
        return or__3824__auto____16851
      }else {
        return this__16850.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__16850.keys) == null)) {
        var new_strobj__16852 = cljs.core.obj_clone.call(null, this__16850.strobj, this__16850.keys);
        new_strobj__16852[k] = v;
        return new cljs.core.ObjMap(this__16850.meta, this__16850.keys, new_strobj__16852, this__16850.update_count + 1, null)
      }else {
        var new_strobj__16853 = cljs.core.obj_clone.call(null, this__16850.strobj, this__16850.keys);
        var new_keys__16854 = this__16850.keys.slice();
        new_strobj__16853[k] = v;
        new_keys__16854.push(k);
        return new cljs.core.ObjMap(this__16850.meta, new_keys__16854, new_strobj__16853, this__16850.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16855 = this;
  if(function() {
    var and__3822__auto____16856 = goog.isString(k);
    if(and__3822__auto____16856) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16855.keys) == null)
    }else {
      return and__3822__auto____16856
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__16878 = null;
  var G__16878__2 = function(this_sym16857, k) {
    var this__16859 = this;
    var this_sym16857__16860 = this;
    var coll__16861 = this_sym16857__16860;
    return coll__16861.cljs$core$ILookup$_lookup$arity$2(coll__16861, k)
  };
  var G__16878__3 = function(this_sym16858, k, not_found) {
    var this__16859 = this;
    var this_sym16858__16862 = this;
    var coll__16863 = this_sym16858__16862;
    return coll__16863.cljs$core$ILookup$_lookup$arity$3(coll__16863, k, not_found)
  };
  G__16878 = function(this_sym16858, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16878__2.call(this, this_sym16858, k);
      case 3:
        return G__16878__3.call(this, this_sym16858, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16878
}();
cljs.core.ObjMap.prototype.apply = function(this_sym16841, args16842) {
  var this__16864 = this;
  return this_sym16841.call.apply(this_sym16841, [this_sym16841].concat(args16842.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16865 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__16866 = this;
  var this__16867 = this;
  return cljs.core.pr_str.call(null, this__16867)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16868 = this;
  if(this__16868.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__16831_SHARP_) {
      return cljs.core.vector.call(null, p1__16831_SHARP_, this__16868.strobj[p1__16831_SHARP_])
    }, this__16868.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16869 = this;
  return this__16869.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16870 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16871 = this;
  return new cljs.core.ObjMap(meta, this__16871.keys, this__16871.strobj, this__16871.update_count, this__16871.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16872 = this;
  return this__16872.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16873 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__16873.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16874 = this;
  if(function() {
    var and__3822__auto____16875 = goog.isString(k);
    if(and__3822__auto____16875) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16874.keys) == null)
    }else {
      return and__3822__auto____16875
    }
  }()) {
    var new_keys__16876 = this__16874.keys.slice();
    var new_strobj__16877 = cljs.core.obj_clone.call(null, this__16874.strobj, this__16874.keys);
    new_keys__16876.splice(cljs.core.scan_array.call(null, 1, k, new_keys__16876), 1);
    cljs.core.js_delete.call(null, new_strobj__16877, k);
    return new cljs.core.ObjMap(this__16874.meta, new_keys__16876, new_strobj__16877, this__16874.update_count + 1, null)
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
  var this__16882 = this;
  var h__2192__auto____16883 = this__16882.__hash;
  if(!(h__2192__auto____16883 == null)) {
    return h__2192__auto____16883
  }else {
    var h__2192__auto____16884 = cljs.core.hash_imap.call(null, coll);
    this__16882.__hash = h__2192__auto____16884;
    return h__2192__auto____16884
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16885 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16886 = this;
  var bucket__16887 = this__16886.hashobj[cljs.core.hash.call(null, k)];
  var i__16888 = cljs.core.truth_(bucket__16887) ? cljs.core.scan_array.call(null, 2, k, bucket__16887) : null;
  if(cljs.core.truth_(i__16888)) {
    return bucket__16887[i__16888 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16889 = this;
  var h__16890 = cljs.core.hash.call(null, k);
  var bucket__16891 = this__16889.hashobj[h__16890];
  if(cljs.core.truth_(bucket__16891)) {
    var new_bucket__16892 = bucket__16891.slice();
    var new_hashobj__16893 = goog.object.clone(this__16889.hashobj);
    new_hashobj__16893[h__16890] = new_bucket__16892;
    var temp__3971__auto____16894 = cljs.core.scan_array.call(null, 2, k, new_bucket__16892);
    if(cljs.core.truth_(temp__3971__auto____16894)) {
      var i__16895 = temp__3971__auto____16894;
      new_bucket__16892[i__16895 + 1] = v;
      return new cljs.core.HashMap(this__16889.meta, this__16889.count, new_hashobj__16893, null)
    }else {
      new_bucket__16892.push(k, v);
      return new cljs.core.HashMap(this__16889.meta, this__16889.count + 1, new_hashobj__16893, null)
    }
  }else {
    var new_hashobj__16896 = goog.object.clone(this__16889.hashobj);
    new_hashobj__16896[h__16890] = [k, v];
    return new cljs.core.HashMap(this__16889.meta, this__16889.count + 1, new_hashobj__16896, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16897 = this;
  var bucket__16898 = this__16897.hashobj[cljs.core.hash.call(null, k)];
  var i__16899 = cljs.core.truth_(bucket__16898) ? cljs.core.scan_array.call(null, 2, k, bucket__16898) : null;
  if(cljs.core.truth_(i__16899)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__16924 = null;
  var G__16924__2 = function(this_sym16900, k) {
    var this__16902 = this;
    var this_sym16900__16903 = this;
    var coll__16904 = this_sym16900__16903;
    return coll__16904.cljs$core$ILookup$_lookup$arity$2(coll__16904, k)
  };
  var G__16924__3 = function(this_sym16901, k, not_found) {
    var this__16902 = this;
    var this_sym16901__16905 = this;
    var coll__16906 = this_sym16901__16905;
    return coll__16906.cljs$core$ILookup$_lookup$arity$3(coll__16906, k, not_found)
  };
  G__16924 = function(this_sym16901, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16924__2.call(this, this_sym16901, k);
      case 3:
        return G__16924__3.call(this, this_sym16901, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16924
}();
cljs.core.HashMap.prototype.apply = function(this_sym16880, args16881) {
  var this__16907 = this;
  return this_sym16880.call.apply(this_sym16880, [this_sym16880].concat(args16881.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16908 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__16909 = this;
  var this__16910 = this;
  return cljs.core.pr_str.call(null, this__16910)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16911 = this;
  if(this__16911.count > 0) {
    var hashes__16912 = cljs.core.js_keys.call(null, this__16911.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__16879_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__16911.hashobj[p1__16879_SHARP_]))
    }, hashes__16912)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16913 = this;
  return this__16913.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16914 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16915 = this;
  return new cljs.core.HashMap(meta, this__16915.count, this__16915.hashobj, this__16915.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16916 = this;
  return this__16916.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16917 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__16917.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16918 = this;
  var h__16919 = cljs.core.hash.call(null, k);
  var bucket__16920 = this__16918.hashobj[h__16919];
  var i__16921 = cljs.core.truth_(bucket__16920) ? cljs.core.scan_array.call(null, 2, k, bucket__16920) : null;
  if(cljs.core.not.call(null, i__16921)) {
    return coll
  }else {
    var new_hashobj__16922 = goog.object.clone(this__16918.hashobj);
    if(3 > bucket__16920.length) {
      cljs.core.js_delete.call(null, new_hashobj__16922, h__16919)
    }else {
      var new_bucket__16923 = bucket__16920.slice();
      new_bucket__16923.splice(i__16921, 2);
      new_hashobj__16922[h__16919] = new_bucket__16923
    }
    return new cljs.core.HashMap(this__16918.meta, this__16918.count - 1, new_hashobj__16922, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__16925 = ks.length;
  var i__16926 = 0;
  var out__16927 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__16926 < len__16925) {
      var G__16928 = i__16926 + 1;
      var G__16929 = cljs.core.assoc.call(null, out__16927, ks[i__16926], vs[i__16926]);
      i__16926 = G__16928;
      out__16927 = G__16929;
      continue
    }else {
      return out__16927
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__16933 = m.arr;
  var len__16934 = arr__16933.length;
  var i__16935 = 0;
  while(true) {
    if(len__16934 <= i__16935) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__16933[i__16935], k)) {
        return i__16935
      }else {
        if("\ufdd0'else") {
          var G__16936 = i__16935 + 2;
          i__16935 = G__16936;
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
  var this__16939 = this;
  return new cljs.core.TransientArrayMap({}, this__16939.arr.length, this__16939.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16940 = this;
  var h__2192__auto____16941 = this__16940.__hash;
  if(!(h__2192__auto____16941 == null)) {
    return h__2192__auto____16941
  }else {
    var h__2192__auto____16942 = cljs.core.hash_imap.call(null, coll);
    this__16940.__hash = h__2192__auto____16942;
    return h__2192__auto____16942
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16943 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16944 = this;
  var idx__16945 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16945 === -1) {
    return not_found
  }else {
    return this__16944.arr[idx__16945 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16946 = this;
  var idx__16947 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16947 === -1) {
    if(this__16946.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__16946.meta, this__16946.cnt + 1, function() {
        var G__16948__16949 = this__16946.arr.slice();
        G__16948__16949.push(k);
        G__16948__16949.push(v);
        return G__16948__16949
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__16946.arr[idx__16947 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__16946.meta, this__16946.cnt, function() {
          var G__16950__16951 = this__16946.arr.slice();
          G__16950__16951[idx__16947 + 1] = v;
          return G__16950__16951
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16952 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__16984 = null;
  var G__16984__2 = function(this_sym16953, k) {
    var this__16955 = this;
    var this_sym16953__16956 = this;
    var coll__16957 = this_sym16953__16956;
    return coll__16957.cljs$core$ILookup$_lookup$arity$2(coll__16957, k)
  };
  var G__16984__3 = function(this_sym16954, k, not_found) {
    var this__16955 = this;
    var this_sym16954__16958 = this;
    var coll__16959 = this_sym16954__16958;
    return coll__16959.cljs$core$ILookup$_lookup$arity$3(coll__16959, k, not_found)
  };
  G__16984 = function(this_sym16954, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16984__2.call(this, this_sym16954, k);
      case 3:
        return G__16984__3.call(this, this_sym16954, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16984
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym16937, args16938) {
  var this__16960 = this;
  return this_sym16937.call.apply(this_sym16937, [this_sym16937].concat(args16938.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16961 = this;
  var len__16962 = this__16961.arr.length;
  var i__16963 = 0;
  var init__16964 = init;
  while(true) {
    if(i__16963 < len__16962) {
      var init__16965 = f.call(null, init__16964, this__16961.arr[i__16963], this__16961.arr[i__16963 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__16965)) {
        return cljs.core.deref.call(null, init__16965)
      }else {
        var G__16985 = i__16963 + 2;
        var G__16986 = init__16965;
        i__16963 = G__16985;
        init__16964 = G__16986;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16966 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__16967 = this;
  var this__16968 = this;
  return cljs.core.pr_str.call(null, this__16968)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16969 = this;
  if(this__16969.cnt > 0) {
    var len__16970 = this__16969.arr.length;
    var array_map_seq__16971 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__16970) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__16969.arr[i], this__16969.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__16971.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16972 = this;
  return this__16972.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16973 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16974 = this;
  return new cljs.core.PersistentArrayMap(meta, this__16974.cnt, this__16974.arr, this__16974.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16975 = this;
  return this__16975.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16976 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__16976.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16977 = this;
  var idx__16978 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16978 >= 0) {
    var len__16979 = this__16977.arr.length;
    var new_len__16980 = len__16979 - 2;
    if(new_len__16980 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__16981 = cljs.core.make_array.call(null, new_len__16980);
      var s__16982 = 0;
      var d__16983 = 0;
      while(true) {
        if(s__16982 >= len__16979) {
          return new cljs.core.PersistentArrayMap(this__16977.meta, this__16977.cnt - 1, new_arr__16981, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__16977.arr[s__16982])) {
            var G__16987 = s__16982 + 2;
            var G__16988 = d__16983;
            s__16982 = G__16987;
            d__16983 = G__16988;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__16981[d__16983] = this__16977.arr[s__16982];
              new_arr__16981[d__16983 + 1] = this__16977.arr[s__16982 + 1];
              var G__16989 = s__16982 + 2;
              var G__16990 = d__16983 + 2;
              s__16982 = G__16989;
              d__16983 = G__16990;
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
  var len__16991 = cljs.core.count.call(null, ks);
  var i__16992 = 0;
  var out__16993 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__16992 < len__16991) {
      var G__16994 = i__16992 + 1;
      var G__16995 = cljs.core.assoc_BANG_.call(null, out__16993, ks[i__16992], vs[i__16992]);
      i__16992 = G__16994;
      out__16993 = G__16995;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16993)
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
  var this__16996 = this;
  if(cljs.core.truth_(this__16996.editable_QMARK_)) {
    var idx__16997 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__16997 >= 0) {
      this__16996.arr[idx__16997] = this__16996.arr[this__16996.len - 2];
      this__16996.arr[idx__16997 + 1] = this__16996.arr[this__16996.len - 1];
      var G__16998__16999 = this__16996.arr;
      G__16998__16999.pop();
      G__16998__16999.pop();
      G__16998__16999;
      this__16996.len = this__16996.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__17000 = this;
  if(cljs.core.truth_(this__17000.editable_QMARK_)) {
    var idx__17001 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__17001 === -1) {
      if(this__17000.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__17000.len = this__17000.len + 2;
        this__17000.arr.push(key);
        this__17000.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__17000.len, this__17000.arr), key, val)
      }
    }else {
      if(val === this__17000.arr[idx__17001 + 1]) {
        return tcoll
      }else {
        this__17000.arr[idx__17001 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__17002 = this;
  if(cljs.core.truth_(this__17002.editable_QMARK_)) {
    if(function() {
      var G__17003__17004 = o;
      if(G__17003__17004) {
        if(function() {
          var or__3824__auto____17005 = G__17003__17004.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____17005) {
            return or__3824__auto____17005
          }else {
            return G__17003__17004.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__17003__17004.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__17003__17004)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__17003__17004)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__17006 = cljs.core.seq.call(null, o);
      var tcoll__17007 = tcoll;
      while(true) {
        var temp__3971__auto____17008 = cljs.core.first.call(null, es__17006);
        if(cljs.core.truth_(temp__3971__auto____17008)) {
          var e__17009 = temp__3971__auto____17008;
          var G__17015 = cljs.core.next.call(null, es__17006);
          var G__17016 = tcoll__17007.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__17007, cljs.core.key.call(null, e__17009), cljs.core.val.call(null, e__17009));
          es__17006 = G__17015;
          tcoll__17007 = G__17016;
          continue
        }else {
          return tcoll__17007
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__17010 = this;
  if(cljs.core.truth_(this__17010.editable_QMARK_)) {
    this__17010.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__17010.len, 2), this__17010.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__17011 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__17012 = this;
  if(cljs.core.truth_(this__17012.editable_QMARK_)) {
    var idx__17013 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__17013 === -1) {
      return not_found
    }else {
      return this__17012.arr[idx__17013 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__17014 = this;
  if(cljs.core.truth_(this__17014.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__17014.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__17019 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__17020 = 0;
  while(true) {
    if(i__17020 < len) {
      var G__17021 = cljs.core.assoc_BANG_.call(null, out__17019, arr[i__17020], arr[i__17020 + 1]);
      var G__17022 = i__17020 + 2;
      out__17019 = G__17021;
      i__17020 = G__17022;
      continue
    }else {
      return out__17019
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
    var G__17027__17028 = arr.slice();
    G__17027__17028[i] = a;
    return G__17027__17028
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__17029__17030 = arr.slice();
    G__17029__17030[i] = a;
    G__17029__17030[j] = b;
    return G__17029__17030
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
  var new_arr__17032 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__17032, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__17032, 2 * i, new_arr__17032.length - 2 * i);
  return new_arr__17032
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
    var editable__17035 = inode.ensure_editable(edit);
    editable__17035.arr[i] = a;
    return editable__17035
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__17036 = inode.ensure_editable(edit);
    editable__17036.arr[i] = a;
    editable__17036.arr[j] = b;
    return editable__17036
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
  var len__17043 = arr.length;
  var i__17044 = 0;
  var init__17045 = init;
  while(true) {
    if(i__17044 < len__17043) {
      var init__17048 = function() {
        var k__17046 = arr[i__17044];
        if(!(k__17046 == null)) {
          return f.call(null, init__17045, k__17046, arr[i__17044 + 1])
        }else {
          var node__17047 = arr[i__17044 + 1];
          if(!(node__17047 == null)) {
            return node__17047.kv_reduce(f, init__17045)
          }else {
            return init__17045
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__17048)) {
        return cljs.core.deref.call(null, init__17048)
      }else {
        var G__17049 = i__17044 + 2;
        var G__17050 = init__17048;
        i__17044 = G__17049;
        init__17045 = G__17050;
        continue
      }
    }else {
      return init__17045
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
  var this__17051 = this;
  var inode__17052 = this;
  if(this__17051.bitmap === bit) {
    return null
  }else {
    var editable__17053 = inode__17052.ensure_editable(e);
    var earr__17054 = editable__17053.arr;
    var len__17055 = earr__17054.length;
    editable__17053.bitmap = bit ^ editable__17053.bitmap;
    cljs.core.array_copy.call(null, earr__17054, 2 * (i + 1), earr__17054, 2 * i, len__17055 - 2 * (i + 1));
    earr__17054[len__17055 - 2] = null;
    earr__17054[len__17055 - 1] = null;
    return editable__17053
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__17056 = this;
  var inode__17057 = this;
  var bit__17058 = 1 << (hash >>> shift & 31);
  var idx__17059 = cljs.core.bitmap_indexed_node_index.call(null, this__17056.bitmap, bit__17058);
  if((this__17056.bitmap & bit__17058) === 0) {
    var n__17060 = cljs.core.bit_count.call(null, this__17056.bitmap);
    if(2 * n__17060 < this__17056.arr.length) {
      var editable__17061 = inode__17057.ensure_editable(edit);
      var earr__17062 = editable__17061.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__17062, 2 * idx__17059, earr__17062, 2 * (idx__17059 + 1), 2 * (n__17060 - idx__17059));
      earr__17062[2 * idx__17059] = key;
      earr__17062[2 * idx__17059 + 1] = val;
      editable__17061.bitmap = editable__17061.bitmap | bit__17058;
      return editable__17061
    }else {
      if(n__17060 >= 16) {
        var nodes__17063 = cljs.core.make_array.call(null, 32);
        var jdx__17064 = hash >>> shift & 31;
        nodes__17063[jdx__17064] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__17065 = 0;
        var j__17066 = 0;
        while(true) {
          if(i__17065 < 32) {
            if((this__17056.bitmap >>> i__17065 & 1) === 0) {
              var G__17119 = i__17065 + 1;
              var G__17120 = j__17066;
              i__17065 = G__17119;
              j__17066 = G__17120;
              continue
            }else {
              nodes__17063[i__17065] = !(this__17056.arr[j__17066] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__17056.arr[j__17066]), this__17056.arr[j__17066], this__17056.arr[j__17066 + 1], added_leaf_QMARK_) : this__17056.arr[j__17066 + 1];
              var G__17121 = i__17065 + 1;
              var G__17122 = j__17066 + 2;
              i__17065 = G__17121;
              j__17066 = G__17122;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__17060 + 1, nodes__17063)
      }else {
        if("\ufdd0'else") {
          var new_arr__17067 = cljs.core.make_array.call(null, 2 * (n__17060 + 4));
          cljs.core.array_copy.call(null, this__17056.arr, 0, new_arr__17067, 0, 2 * idx__17059);
          new_arr__17067[2 * idx__17059] = key;
          new_arr__17067[2 * idx__17059 + 1] = val;
          cljs.core.array_copy.call(null, this__17056.arr, 2 * idx__17059, new_arr__17067, 2 * (idx__17059 + 1), 2 * (n__17060 - idx__17059));
          added_leaf_QMARK_.val = true;
          var editable__17068 = inode__17057.ensure_editable(edit);
          editable__17068.arr = new_arr__17067;
          editable__17068.bitmap = editable__17068.bitmap | bit__17058;
          return editable__17068
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__17069 = this__17056.arr[2 * idx__17059];
    var val_or_node__17070 = this__17056.arr[2 * idx__17059 + 1];
    if(key_or_nil__17069 == null) {
      var n__17071 = val_or_node__17070.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__17071 === val_or_node__17070) {
        return inode__17057
      }else {
        return cljs.core.edit_and_set.call(null, inode__17057, edit, 2 * idx__17059 + 1, n__17071)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17069)) {
        if(val === val_or_node__17070) {
          return inode__17057
        }else {
          return cljs.core.edit_and_set.call(null, inode__17057, edit, 2 * idx__17059 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__17057, edit, 2 * idx__17059, null, 2 * idx__17059 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__17069, val_or_node__17070, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__17072 = this;
  var inode__17073 = this;
  return cljs.core.create_inode_seq.call(null, this__17072.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17074 = this;
  var inode__17075 = this;
  var bit__17076 = 1 << (hash >>> shift & 31);
  if((this__17074.bitmap & bit__17076) === 0) {
    return inode__17075
  }else {
    var idx__17077 = cljs.core.bitmap_indexed_node_index.call(null, this__17074.bitmap, bit__17076);
    var key_or_nil__17078 = this__17074.arr[2 * idx__17077];
    var val_or_node__17079 = this__17074.arr[2 * idx__17077 + 1];
    if(key_or_nil__17078 == null) {
      var n__17080 = val_or_node__17079.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__17080 === val_or_node__17079) {
        return inode__17075
      }else {
        if(!(n__17080 == null)) {
          return cljs.core.edit_and_set.call(null, inode__17075, edit, 2 * idx__17077 + 1, n__17080)
        }else {
          if(this__17074.bitmap === bit__17076) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__17075.edit_and_remove_pair(edit, bit__17076, idx__17077)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17078)) {
        removed_leaf_QMARK_[0] = true;
        return inode__17075.edit_and_remove_pair(edit, bit__17076, idx__17077)
      }else {
        if("\ufdd0'else") {
          return inode__17075
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__17081 = this;
  var inode__17082 = this;
  if(e === this__17081.edit) {
    return inode__17082
  }else {
    var n__17083 = cljs.core.bit_count.call(null, this__17081.bitmap);
    var new_arr__17084 = cljs.core.make_array.call(null, n__17083 < 0 ? 4 : 2 * (n__17083 + 1));
    cljs.core.array_copy.call(null, this__17081.arr, 0, new_arr__17084, 0, 2 * n__17083);
    return new cljs.core.BitmapIndexedNode(e, this__17081.bitmap, new_arr__17084)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__17085 = this;
  var inode__17086 = this;
  return cljs.core.inode_kv_reduce.call(null, this__17085.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17087 = this;
  var inode__17088 = this;
  var bit__17089 = 1 << (hash >>> shift & 31);
  if((this__17087.bitmap & bit__17089) === 0) {
    return not_found
  }else {
    var idx__17090 = cljs.core.bitmap_indexed_node_index.call(null, this__17087.bitmap, bit__17089);
    var key_or_nil__17091 = this__17087.arr[2 * idx__17090];
    var val_or_node__17092 = this__17087.arr[2 * idx__17090 + 1];
    if(key_or_nil__17091 == null) {
      return val_or_node__17092.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17091)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__17091, val_or_node__17092], true)
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
  var this__17093 = this;
  var inode__17094 = this;
  var bit__17095 = 1 << (hash >>> shift & 31);
  if((this__17093.bitmap & bit__17095) === 0) {
    return inode__17094
  }else {
    var idx__17096 = cljs.core.bitmap_indexed_node_index.call(null, this__17093.bitmap, bit__17095);
    var key_or_nil__17097 = this__17093.arr[2 * idx__17096];
    var val_or_node__17098 = this__17093.arr[2 * idx__17096 + 1];
    if(key_or_nil__17097 == null) {
      var n__17099 = val_or_node__17098.inode_without(shift + 5, hash, key);
      if(n__17099 === val_or_node__17098) {
        return inode__17094
      }else {
        if(!(n__17099 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__17093.bitmap, cljs.core.clone_and_set.call(null, this__17093.arr, 2 * idx__17096 + 1, n__17099))
        }else {
          if(this__17093.bitmap === bit__17095) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__17093.bitmap ^ bit__17095, cljs.core.remove_pair.call(null, this__17093.arr, idx__17096))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17097)) {
        return new cljs.core.BitmapIndexedNode(null, this__17093.bitmap ^ bit__17095, cljs.core.remove_pair.call(null, this__17093.arr, idx__17096))
      }else {
        if("\ufdd0'else") {
          return inode__17094
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__17100 = this;
  var inode__17101 = this;
  var bit__17102 = 1 << (hash >>> shift & 31);
  var idx__17103 = cljs.core.bitmap_indexed_node_index.call(null, this__17100.bitmap, bit__17102);
  if((this__17100.bitmap & bit__17102) === 0) {
    var n__17104 = cljs.core.bit_count.call(null, this__17100.bitmap);
    if(n__17104 >= 16) {
      var nodes__17105 = cljs.core.make_array.call(null, 32);
      var jdx__17106 = hash >>> shift & 31;
      nodes__17105[jdx__17106] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__17107 = 0;
      var j__17108 = 0;
      while(true) {
        if(i__17107 < 32) {
          if((this__17100.bitmap >>> i__17107 & 1) === 0) {
            var G__17123 = i__17107 + 1;
            var G__17124 = j__17108;
            i__17107 = G__17123;
            j__17108 = G__17124;
            continue
          }else {
            nodes__17105[i__17107] = !(this__17100.arr[j__17108] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__17100.arr[j__17108]), this__17100.arr[j__17108], this__17100.arr[j__17108 + 1], added_leaf_QMARK_) : this__17100.arr[j__17108 + 1];
            var G__17125 = i__17107 + 1;
            var G__17126 = j__17108 + 2;
            i__17107 = G__17125;
            j__17108 = G__17126;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__17104 + 1, nodes__17105)
    }else {
      var new_arr__17109 = cljs.core.make_array.call(null, 2 * (n__17104 + 1));
      cljs.core.array_copy.call(null, this__17100.arr, 0, new_arr__17109, 0, 2 * idx__17103);
      new_arr__17109[2 * idx__17103] = key;
      new_arr__17109[2 * idx__17103 + 1] = val;
      cljs.core.array_copy.call(null, this__17100.arr, 2 * idx__17103, new_arr__17109, 2 * (idx__17103 + 1), 2 * (n__17104 - idx__17103));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__17100.bitmap | bit__17102, new_arr__17109)
    }
  }else {
    var key_or_nil__17110 = this__17100.arr[2 * idx__17103];
    var val_or_node__17111 = this__17100.arr[2 * idx__17103 + 1];
    if(key_or_nil__17110 == null) {
      var n__17112 = val_or_node__17111.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__17112 === val_or_node__17111) {
        return inode__17101
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__17100.bitmap, cljs.core.clone_and_set.call(null, this__17100.arr, 2 * idx__17103 + 1, n__17112))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17110)) {
        if(val === val_or_node__17111) {
          return inode__17101
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__17100.bitmap, cljs.core.clone_and_set.call(null, this__17100.arr, 2 * idx__17103 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__17100.bitmap, cljs.core.clone_and_set.call(null, this__17100.arr, 2 * idx__17103, null, 2 * idx__17103 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__17110, val_or_node__17111, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__17113 = this;
  var inode__17114 = this;
  var bit__17115 = 1 << (hash >>> shift & 31);
  if((this__17113.bitmap & bit__17115) === 0) {
    return not_found
  }else {
    var idx__17116 = cljs.core.bitmap_indexed_node_index.call(null, this__17113.bitmap, bit__17115);
    var key_or_nil__17117 = this__17113.arr[2 * idx__17116];
    var val_or_node__17118 = this__17113.arr[2 * idx__17116 + 1];
    if(key_or_nil__17117 == null) {
      return val_or_node__17118.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17117)) {
        return val_or_node__17118
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
  var arr__17134 = array_node.arr;
  var len__17135 = 2 * (array_node.cnt - 1);
  var new_arr__17136 = cljs.core.make_array.call(null, len__17135);
  var i__17137 = 0;
  var j__17138 = 1;
  var bitmap__17139 = 0;
  while(true) {
    if(i__17137 < len__17135) {
      if(function() {
        var and__3822__auto____17140 = !(i__17137 === idx);
        if(and__3822__auto____17140) {
          return!(arr__17134[i__17137] == null)
        }else {
          return and__3822__auto____17140
        }
      }()) {
        new_arr__17136[j__17138] = arr__17134[i__17137];
        var G__17141 = i__17137 + 1;
        var G__17142 = j__17138 + 2;
        var G__17143 = bitmap__17139 | 1 << i__17137;
        i__17137 = G__17141;
        j__17138 = G__17142;
        bitmap__17139 = G__17143;
        continue
      }else {
        var G__17144 = i__17137 + 1;
        var G__17145 = j__17138;
        var G__17146 = bitmap__17139;
        i__17137 = G__17144;
        j__17138 = G__17145;
        bitmap__17139 = G__17146;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__17139, new_arr__17136)
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
  var this__17147 = this;
  var inode__17148 = this;
  var idx__17149 = hash >>> shift & 31;
  var node__17150 = this__17147.arr[idx__17149];
  if(node__17150 == null) {
    var editable__17151 = cljs.core.edit_and_set.call(null, inode__17148, edit, idx__17149, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__17151.cnt = editable__17151.cnt + 1;
    return editable__17151
  }else {
    var n__17152 = node__17150.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__17152 === node__17150) {
      return inode__17148
    }else {
      return cljs.core.edit_and_set.call(null, inode__17148, edit, idx__17149, n__17152)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__17153 = this;
  var inode__17154 = this;
  return cljs.core.create_array_node_seq.call(null, this__17153.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17155 = this;
  var inode__17156 = this;
  var idx__17157 = hash >>> shift & 31;
  var node__17158 = this__17155.arr[idx__17157];
  if(node__17158 == null) {
    return inode__17156
  }else {
    var n__17159 = node__17158.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__17159 === node__17158) {
      return inode__17156
    }else {
      if(n__17159 == null) {
        if(this__17155.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__17156, edit, idx__17157)
        }else {
          var editable__17160 = cljs.core.edit_and_set.call(null, inode__17156, edit, idx__17157, n__17159);
          editable__17160.cnt = editable__17160.cnt - 1;
          return editable__17160
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__17156, edit, idx__17157, n__17159)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__17161 = this;
  var inode__17162 = this;
  if(e === this__17161.edit) {
    return inode__17162
  }else {
    return new cljs.core.ArrayNode(e, this__17161.cnt, this__17161.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__17163 = this;
  var inode__17164 = this;
  var len__17165 = this__17163.arr.length;
  var i__17166 = 0;
  var init__17167 = init;
  while(true) {
    if(i__17166 < len__17165) {
      var node__17168 = this__17163.arr[i__17166];
      if(!(node__17168 == null)) {
        var init__17169 = node__17168.kv_reduce(f, init__17167);
        if(cljs.core.reduced_QMARK_.call(null, init__17169)) {
          return cljs.core.deref.call(null, init__17169)
        }else {
          var G__17188 = i__17166 + 1;
          var G__17189 = init__17169;
          i__17166 = G__17188;
          init__17167 = G__17189;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__17167
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17170 = this;
  var inode__17171 = this;
  var idx__17172 = hash >>> shift & 31;
  var node__17173 = this__17170.arr[idx__17172];
  if(!(node__17173 == null)) {
    return node__17173.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__17174 = this;
  var inode__17175 = this;
  var idx__17176 = hash >>> shift & 31;
  var node__17177 = this__17174.arr[idx__17176];
  if(!(node__17177 == null)) {
    var n__17178 = node__17177.inode_without(shift + 5, hash, key);
    if(n__17178 === node__17177) {
      return inode__17175
    }else {
      if(n__17178 == null) {
        if(this__17174.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__17175, null, idx__17176)
        }else {
          return new cljs.core.ArrayNode(null, this__17174.cnt - 1, cljs.core.clone_and_set.call(null, this__17174.arr, idx__17176, n__17178))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__17174.cnt, cljs.core.clone_and_set.call(null, this__17174.arr, idx__17176, n__17178))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__17175
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__17179 = this;
  var inode__17180 = this;
  var idx__17181 = hash >>> shift & 31;
  var node__17182 = this__17179.arr[idx__17181];
  if(node__17182 == null) {
    return new cljs.core.ArrayNode(null, this__17179.cnt + 1, cljs.core.clone_and_set.call(null, this__17179.arr, idx__17181, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__17183 = node__17182.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__17183 === node__17182) {
      return inode__17180
    }else {
      return new cljs.core.ArrayNode(null, this__17179.cnt, cljs.core.clone_and_set.call(null, this__17179.arr, idx__17181, n__17183))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__17184 = this;
  var inode__17185 = this;
  var idx__17186 = hash >>> shift & 31;
  var node__17187 = this__17184.arr[idx__17186];
  if(!(node__17187 == null)) {
    return node__17187.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__17192 = 2 * cnt;
  var i__17193 = 0;
  while(true) {
    if(i__17193 < lim__17192) {
      if(cljs.core.key_test.call(null, key, arr[i__17193])) {
        return i__17193
      }else {
        var G__17194 = i__17193 + 2;
        i__17193 = G__17194;
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
  var this__17195 = this;
  var inode__17196 = this;
  if(hash === this__17195.collision_hash) {
    var idx__17197 = cljs.core.hash_collision_node_find_index.call(null, this__17195.arr, this__17195.cnt, key);
    if(idx__17197 === -1) {
      if(this__17195.arr.length > 2 * this__17195.cnt) {
        var editable__17198 = cljs.core.edit_and_set.call(null, inode__17196, edit, 2 * this__17195.cnt, key, 2 * this__17195.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__17198.cnt = editable__17198.cnt + 1;
        return editable__17198
      }else {
        var len__17199 = this__17195.arr.length;
        var new_arr__17200 = cljs.core.make_array.call(null, len__17199 + 2);
        cljs.core.array_copy.call(null, this__17195.arr, 0, new_arr__17200, 0, len__17199);
        new_arr__17200[len__17199] = key;
        new_arr__17200[len__17199 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__17196.ensure_editable_array(edit, this__17195.cnt + 1, new_arr__17200)
      }
    }else {
      if(this__17195.arr[idx__17197 + 1] === val) {
        return inode__17196
      }else {
        return cljs.core.edit_and_set.call(null, inode__17196, edit, idx__17197 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__17195.collision_hash >>> shift & 31), [null, inode__17196, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__17201 = this;
  var inode__17202 = this;
  return cljs.core.create_inode_seq.call(null, this__17201.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17203 = this;
  var inode__17204 = this;
  var idx__17205 = cljs.core.hash_collision_node_find_index.call(null, this__17203.arr, this__17203.cnt, key);
  if(idx__17205 === -1) {
    return inode__17204
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__17203.cnt === 1) {
      return null
    }else {
      var editable__17206 = inode__17204.ensure_editable(edit);
      var earr__17207 = editable__17206.arr;
      earr__17207[idx__17205] = earr__17207[2 * this__17203.cnt - 2];
      earr__17207[idx__17205 + 1] = earr__17207[2 * this__17203.cnt - 1];
      earr__17207[2 * this__17203.cnt - 1] = null;
      earr__17207[2 * this__17203.cnt - 2] = null;
      editable__17206.cnt = editable__17206.cnt - 1;
      return editable__17206
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__17208 = this;
  var inode__17209 = this;
  if(e === this__17208.edit) {
    return inode__17209
  }else {
    var new_arr__17210 = cljs.core.make_array.call(null, 2 * (this__17208.cnt + 1));
    cljs.core.array_copy.call(null, this__17208.arr, 0, new_arr__17210, 0, 2 * this__17208.cnt);
    return new cljs.core.HashCollisionNode(e, this__17208.collision_hash, this__17208.cnt, new_arr__17210)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__17211 = this;
  var inode__17212 = this;
  return cljs.core.inode_kv_reduce.call(null, this__17211.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17213 = this;
  var inode__17214 = this;
  var idx__17215 = cljs.core.hash_collision_node_find_index.call(null, this__17213.arr, this__17213.cnt, key);
  if(idx__17215 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__17213.arr[idx__17215])) {
      return cljs.core.PersistentVector.fromArray([this__17213.arr[idx__17215], this__17213.arr[idx__17215 + 1]], true)
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
  var this__17216 = this;
  var inode__17217 = this;
  var idx__17218 = cljs.core.hash_collision_node_find_index.call(null, this__17216.arr, this__17216.cnt, key);
  if(idx__17218 === -1) {
    return inode__17217
  }else {
    if(this__17216.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__17216.collision_hash, this__17216.cnt - 1, cljs.core.remove_pair.call(null, this__17216.arr, cljs.core.quot.call(null, idx__17218, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__17219 = this;
  var inode__17220 = this;
  if(hash === this__17219.collision_hash) {
    var idx__17221 = cljs.core.hash_collision_node_find_index.call(null, this__17219.arr, this__17219.cnt, key);
    if(idx__17221 === -1) {
      var len__17222 = this__17219.arr.length;
      var new_arr__17223 = cljs.core.make_array.call(null, len__17222 + 2);
      cljs.core.array_copy.call(null, this__17219.arr, 0, new_arr__17223, 0, len__17222);
      new_arr__17223[len__17222] = key;
      new_arr__17223[len__17222 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__17219.collision_hash, this__17219.cnt + 1, new_arr__17223)
    }else {
      if(cljs.core._EQ_.call(null, this__17219.arr[idx__17221], val)) {
        return inode__17220
      }else {
        return new cljs.core.HashCollisionNode(null, this__17219.collision_hash, this__17219.cnt, cljs.core.clone_and_set.call(null, this__17219.arr, idx__17221 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__17219.collision_hash >>> shift & 31), [null, inode__17220])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__17224 = this;
  var inode__17225 = this;
  var idx__17226 = cljs.core.hash_collision_node_find_index.call(null, this__17224.arr, this__17224.cnt, key);
  if(idx__17226 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__17224.arr[idx__17226])) {
      return this__17224.arr[idx__17226 + 1]
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
  var this__17227 = this;
  var inode__17228 = this;
  if(e === this__17227.edit) {
    this__17227.arr = array;
    this__17227.cnt = count;
    return inode__17228
  }else {
    return new cljs.core.HashCollisionNode(this__17227.edit, this__17227.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__17233 = cljs.core.hash.call(null, key1);
    if(key1hash__17233 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__17233, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___17234 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__17233, key1, val1, added_leaf_QMARK___17234).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___17234)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__17235 = cljs.core.hash.call(null, key1);
    if(key1hash__17235 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__17235, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___17236 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__17235, key1, val1, added_leaf_QMARK___17236).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___17236)
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
  var this__17237 = this;
  var h__2192__auto____17238 = this__17237.__hash;
  if(!(h__2192__auto____17238 == null)) {
    return h__2192__auto____17238
  }else {
    var h__2192__auto____17239 = cljs.core.hash_coll.call(null, coll);
    this__17237.__hash = h__2192__auto____17239;
    return h__2192__auto____17239
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17240 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__17241 = this;
  var this__17242 = this;
  return cljs.core.pr_str.call(null, this__17242)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__17243 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17244 = this;
  if(this__17244.s == null) {
    return cljs.core.PersistentVector.fromArray([this__17244.nodes[this__17244.i], this__17244.nodes[this__17244.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__17244.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17245 = this;
  if(this__17245.s == null) {
    return cljs.core.create_inode_seq.call(null, this__17245.nodes, this__17245.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__17245.nodes, this__17245.i, cljs.core.next.call(null, this__17245.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17246 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17247 = this;
  return new cljs.core.NodeSeq(meta, this__17247.nodes, this__17247.i, this__17247.s, this__17247.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17248 = this;
  return this__17248.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17249 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17249.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__17256 = nodes.length;
      var j__17257 = i;
      while(true) {
        if(j__17257 < len__17256) {
          if(!(nodes[j__17257] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__17257, null, null)
          }else {
            var temp__3971__auto____17258 = nodes[j__17257 + 1];
            if(cljs.core.truth_(temp__3971__auto____17258)) {
              var node__17259 = temp__3971__auto____17258;
              var temp__3971__auto____17260 = node__17259.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____17260)) {
                var node_seq__17261 = temp__3971__auto____17260;
                return new cljs.core.NodeSeq(null, nodes, j__17257 + 2, node_seq__17261, null)
              }else {
                var G__17262 = j__17257 + 2;
                j__17257 = G__17262;
                continue
              }
            }else {
              var G__17263 = j__17257 + 2;
              j__17257 = G__17263;
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
  var this__17264 = this;
  var h__2192__auto____17265 = this__17264.__hash;
  if(!(h__2192__auto____17265 == null)) {
    return h__2192__auto____17265
  }else {
    var h__2192__auto____17266 = cljs.core.hash_coll.call(null, coll);
    this__17264.__hash = h__2192__auto____17266;
    return h__2192__auto____17266
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17267 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__17268 = this;
  var this__17269 = this;
  return cljs.core.pr_str.call(null, this__17269)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__17270 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17271 = this;
  return cljs.core.first.call(null, this__17271.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17272 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__17272.nodes, this__17272.i, cljs.core.next.call(null, this__17272.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17273 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17274 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__17274.nodes, this__17274.i, this__17274.s, this__17274.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17275 = this;
  return this__17275.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17276 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17276.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__17283 = nodes.length;
      var j__17284 = i;
      while(true) {
        if(j__17284 < len__17283) {
          var temp__3971__auto____17285 = nodes[j__17284];
          if(cljs.core.truth_(temp__3971__auto____17285)) {
            var nj__17286 = temp__3971__auto____17285;
            var temp__3971__auto____17287 = nj__17286.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____17287)) {
              var ns__17288 = temp__3971__auto____17287;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__17284 + 1, ns__17288, null)
            }else {
              var G__17289 = j__17284 + 1;
              j__17284 = G__17289;
              continue
            }
          }else {
            var G__17290 = j__17284 + 1;
            j__17284 = G__17290;
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
  var this__17293 = this;
  return new cljs.core.TransientHashMap({}, this__17293.root, this__17293.cnt, this__17293.has_nil_QMARK_, this__17293.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17294 = this;
  var h__2192__auto____17295 = this__17294.__hash;
  if(!(h__2192__auto____17295 == null)) {
    return h__2192__auto____17295
  }else {
    var h__2192__auto____17296 = cljs.core.hash_imap.call(null, coll);
    this__17294.__hash = h__2192__auto____17296;
    return h__2192__auto____17296
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17297 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17298 = this;
  if(k == null) {
    if(this__17298.has_nil_QMARK_) {
      return this__17298.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__17298.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__17298.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17299 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____17300 = this__17299.has_nil_QMARK_;
      if(and__3822__auto____17300) {
        return v === this__17299.nil_val
      }else {
        return and__3822__auto____17300
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__17299.meta, this__17299.has_nil_QMARK_ ? this__17299.cnt : this__17299.cnt + 1, this__17299.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___17301 = new cljs.core.Box(false);
    var new_root__17302 = (this__17299.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__17299.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___17301);
    if(new_root__17302 === this__17299.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__17299.meta, added_leaf_QMARK___17301.val ? this__17299.cnt + 1 : this__17299.cnt, new_root__17302, this__17299.has_nil_QMARK_, this__17299.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__17303 = this;
  if(k == null) {
    return this__17303.has_nil_QMARK_
  }else {
    if(this__17303.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__17303.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__17326 = null;
  var G__17326__2 = function(this_sym17304, k) {
    var this__17306 = this;
    var this_sym17304__17307 = this;
    var coll__17308 = this_sym17304__17307;
    return coll__17308.cljs$core$ILookup$_lookup$arity$2(coll__17308, k)
  };
  var G__17326__3 = function(this_sym17305, k, not_found) {
    var this__17306 = this;
    var this_sym17305__17309 = this;
    var coll__17310 = this_sym17305__17309;
    return coll__17310.cljs$core$ILookup$_lookup$arity$3(coll__17310, k, not_found)
  };
  G__17326 = function(this_sym17305, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17326__2.call(this, this_sym17305, k);
      case 3:
        return G__17326__3.call(this, this_sym17305, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17326
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym17291, args17292) {
  var this__17311 = this;
  return this_sym17291.call.apply(this_sym17291, [this_sym17291].concat(args17292.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__17312 = this;
  var init__17313 = this__17312.has_nil_QMARK_ ? f.call(null, init, null, this__17312.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__17313)) {
    return cljs.core.deref.call(null, init__17313)
  }else {
    if(!(this__17312.root == null)) {
      return this__17312.root.kv_reduce(f, init__17313)
    }else {
      if("\ufdd0'else") {
        return init__17313
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__17314 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__17315 = this;
  var this__17316 = this;
  return cljs.core.pr_str.call(null, this__17316)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17317 = this;
  if(this__17317.cnt > 0) {
    var s__17318 = !(this__17317.root == null) ? this__17317.root.inode_seq() : null;
    if(this__17317.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__17317.nil_val], true), s__17318)
    }else {
      return s__17318
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17319 = this;
  return this__17319.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17320 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17321 = this;
  return new cljs.core.PersistentHashMap(meta, this__17321.cnt, this__17321.root, this__17321.has_nil_QMARK_, this__17321.nil_val, this__17321.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17322 = this;
  return this__17322.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17323 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__17323.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__17324 = this;
  if(k == null) {
    if(this__17324.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__17324.meta, this__17324.cnt - 1, this__17324.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__17324.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__17325 = this__17324.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__17325 === this__17324.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__17324.meta, this__17324.cnt - 1, new_root__17325, this__17324.has_nil_QMARK_, this__17324.nil_val, null)
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
  var len__17327 = ks.length;
  var i__17328 = 0;
  var out__17329 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__17328 < len__17327) {
      var G__17330 = i__17328 + 1;
      var G__17331 = cljs.core.assoc_BANG_.call(null, out__17329, ks[i__17328], vs[i__17328]);
      i__17328 = G__17330;
      out__17329 = G__17331;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__17329)
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
  var this__17332 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__17333 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__17334 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__17335 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__17336 = this;
  if(k == null) {
    if(this__17336.has_nil_QMARK_) {
      return this__17336.nil_val
    }else {
      return null
    }
  }else {
    if(this__17336.root == null) {
      return null
    }else {
      return this__17336.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__17337 = this;
  if(k == null) {
    if(this__17337.has_nil_QMARK_) {
      return this__17337.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__17337.root == null) {
      return not_found
    }else {
      return this__17337.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17338 = this;
  if(this__17338.edit) {
    return this__17338.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__17339 = this;
  var tcoll__17340 = this;
  if(this__17339.edit) {
    if(function() {
      var G__17341__17342 = o;
      if(G__17341__17342) {
        if(function() {
          var or__3824__auto____17343 = G__17341__17342.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____17343) {
            return or__3824__auto____17343
          }else {
            return G__17341__17342.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__17341__17342.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__17341__17342)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__17341__17342)
      }
    }()) {
      return tcoll__17340.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__17344 = cljs.core.seq.call(null, o);
      var tcoll__17345 = tcoll__17340;
      while(true) {
        var temp__3971__auto____17346 = cljs.core.first.call(null, es__17344);
        if(cljs.core.truth_(temp__3971__auto____17346)) {
          var e__17347 = temp__3971__auto____17346;
          var G__17358 = cljs.core.next.call(null, es__17344);
          var G__17359 = tcoll__17345.assoc_BANG_(cljs.core.key.call(null, e__17347), cljs.core.val.call(null, e__17347));
          es__17344 = G__17358;
          tcoll__17345 = G__17359;
          continue
        }else {
          return tcoll__17345
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__17348 = this;
  var tcoll__17349 = this;
  if(this__17348.edit) {
    if(k == null) {
      if(this__17348.nil_val === v) {
      }else {
        this__17348.nil_val = v
      }
      if(this__17348.has_nil_QMARK_) {
      }else {
        this__17348.count = this__17348.count + 1;
        this__17348.has_nil_QMARK_ = true
      }
      return tcoll__17349
    }else {
      var added_leaf_QMARK___17350 = new cljs.core.Box(false);
      var node__17351 = (this__17348.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__17348.root).inode_assoc_BANG_(this__17348.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___17350);
      if(node__17351 === this__17348.root) {
      }else {
        this__17348.root = node__17351
      }
      if(added_leaf_QMARK___17350.val) {
        this__17348.count = this__17348.count + 1
      }else {
      }
      return tcoll__17349
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__17352 = this;
  var tcoll__17353 = this;
  if(this__17352.edit) {
    if(k == null) {
      if(this__17352.has_nil_QMARK_) {
        this__17352.has_nil_QMARK_ = false;
        this__17352.nil_val = null;
        this__17352.count = this__17352.count - 1;
        return tcoll__17353
      }else {
        return tcoll__17353
      }
    }else {
      if(this__17352.root == null) {
        return tcoll__17353
      }else {
        var removed_leaf_QMARK___17354 = new cljs.core.Box(false);
        var node__17355 = this__17352.root.inode_without_BANG_(this__17352.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___17354);
        if(node__17355 === this__17352.root) {
        }else {
          this__17352.root = node__17355
        }
        if(cljs.core.truth_(removed_leaf_QMARK___17354[0])) {
          this__17352.count = this__17352.count - 1
        }else {
        }
        return tcoll__17353
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__17356 = this;
  var tcoll__17357 = this;
  if(this__17356.edit) {
    this__17356.edit = null;
    return new cljs.core.PersistentHashMap(null, this__17356.count, this__17356.root, this__17356.has_nil_QMARK_, this__17356.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__17362 = node;
  var stack__17363 = stack;
  while(true) {
    if(!(t__17362 == null)) {
      var G__17364 = ascending_QMARK_ ? t__17362.left : t__17362.right;
      var G__17365 = cljs.core.conj.call(null, stack__17363, t__17362);
      t__17362 = G__17364;
      stack__17363 = G__17365;
      continue
    }else {
      return stack__17363
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
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17369 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__17370 = this;
  var this__17371 = this;
  return cljs.core.pr_str.call(null, this__17371)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__17372 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17373 = this;
  if(this__17373.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__17373.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__17374 = this;
  return cljs.core.peek.call(null, this__17374.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__17375 = this;
  var t__17376 = cljs.core.first.call(null, this__17375.stack);
  var next_stack__17377 = cljs.core.tree_map_seq_push.call(null, this__17375.ascending_QMARK_ ? t__17376.right : t__17376.left, cljs.core.next.call(null, this__17375.stack), this__17375.ascending_QMARK_);
  if(!(next_stack__17377 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__17377, this__17375.ascending_QMARK_, this__17375.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17378 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17379 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__17379.stack, this__17379.ascending_QMARK_, this__17379.cnt, this__17379.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17380 = this;
  return this__17380.meta
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
        var and__3822__auto____17382 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____17382) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____17382
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
        var and__3822__auto____17384 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____17384) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____17384
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
  var init__17388 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__17388)) {
    return cljs.core.deref.call(null, init__17388)
  }else {
    var init__17389 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__17388) : init__17388;
    if(cljs.core.reduced_QMARK_.call(null, init__17389)) {
      return cljs.core.deref.call(null, init__17389)
    }else {
      var init__17390 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__17389) : init__17389;
      if(cljs.core.reduced_QMARK_.call(null, init__17390)) {
        return cljs.core.deref.call(null, init__17390)
      }else {
        return init__17390
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
  var this__17393 = this;
  var h__2192__auto____17394 = this__17393.__hash;
  if(!(h__2192__auto____17394 == null)) {
    return h__2192__auto____17394
  }else {
    var h__2192__auto____17395 = cljs.core.hash_coll.call(null, coll);
    this__17393.__hash = h__2192__auto____17395;
    return h__2192__auto____17395
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__17396 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__17397 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__17398 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__17398.key, this__17398.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__17446 = null;
  var G__17446__2 = function(this_sym17399, k) {
    var this__17401 = this;
    var this_sym17399__17402 = this;
    var node__17403 = this_sym17399__17402;
    return node__17403.cljs$core$ILookup$_lookup$arity$2(node__17403, k)
  };
  var G__17446__3 = function(this_sym17400, k, not_found) {
    var this__17401 = this;
    var this_sym17400__17404 = this;
    var node__17405 = this_sym17400__17404;
    return node__17405.cljs$core$ILookup$_lookup$arity$3(node__17405, k, not_found)
  };
  G__17446 = function(this_sym17400, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17446__2.call(this, this_sym17400, k);
      case 3:
        return G__17446__3.call(this, this_sym17400, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17446
}();
cljs.core.BlackNode.prototype.apply = function(this_sym17391, args17392) {
  var this__17406 = this;
  return this_sym17391.call.apply(this_sym17391, [this_sym17391].concat(args17392.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__17407 = this;
  return cljs.core.PersistentVector.fromArray([this__17407.key, this__17407.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__17408 = this;
  return this__17408.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__17409 = this;
  return this__17409.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__17410 = this;
  var node__17411 = this;
  return ins.balance_right(node__17411)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__17412 = this;
  var node__17413 = this;
  return new cljs.core.RedNode(this__17412.key, this__17412.val, this__17412.left, this__17412.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__17414 = this;
  var node__17415 = this;
  return cljs.core.balance_right_del.call(null, this__17414.key, this__17414.val, this__17414.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__17416 = this;
  var node__17417 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__17418 = this;
  var node__17419 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__17419, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__17420 = this;
  var node__17421 = this;
  return cljs.core.balance_left_del.call(null, this__17420.key, this__17420.val, del, this__17420.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__17422 = this;
  var node__17423 = this;
  return ins.balance_left(node__17423)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__17424 = this;
  var node__17425 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__17425, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__17447 = null;
  var G__17447__0 = function() {
    var this__17426 = this;
    var this__17428 = this;
    return cljs.core.pr_str.call(null, this__17428)
  };
  G__17447 = function() {
    switch(arguments.length) {
      case 0:
        return G__17447__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17447
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__17429 = this;
  var node__17430 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__17430, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__17431 = this;
  var node__17432 = this;
  return node__17432
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__17433 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__17434 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__17435 = this;
  return cljs.core.list.call(null, this__17435.key, this__17435.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__17436 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__17437 = this;
  return this__17437.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__17438 = this;
  return cljs.core.PersistentVector.fromArray([this__17438.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__17439 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__17439.key, this__17439.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17440 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__17441 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__17441.key, this__17441.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__17442 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__17443 = this;
  if(n === 0) {
    return this__17443.key
  }else {
    if(n === 1) {
      return this__17443.val
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
  var this__17444 = this;
  if(n === 0) {
    return this__17444.key
  }else {
    if(n === 1) {
      return this__17444.val
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
  var this__17445 = this;
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
  var this__17450 = this;
  var h__2192__auto____17451 = this__17450.__hash;
  if(!(h__2192__auto____17451 == null)) {
    return h__2192__auto____17451
  }else {
    var h__2192__auto____17452 = cljs.core.hash_coll.call(null, coll);
    this__17450.__hash = h__2192__auto____17452;
    return h__2192__auto____17452
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__17453 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__17454 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__17455 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__17455.key, this__17455.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__17503 = null;
  var G__17503__2 = function(this_sym17456, k) {
    var this__17458 = this;
    var this_sym17456__17459 = this;
    var node__17460 = this_sym17456__17459;
    return node__17460.cljs$core$ILookup$_lookup$arity$2(node__17460, k)
  };
  var G__17503__3 = function(this_sym17457, k, not_found) {
    var this__17458 = this;
    var this_sym17457__17461 = this;
    var node__17462 = this_sym17457__17461;
    return node__17462.cljs$core$ILookup$_lookup$arity$3(node__17462, k, not_found)
  };
  G__17503 = function(this_sym17457, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17503__2.call(this, this_sym17457, k);
      case 3:
        return G__17503__3.call(this, this_sym17457, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17503
}();
cljs.core.RedNode.prototype.apply = function(this_sym17448, args17449) {
  var this__17463 = this;
  return this_sym17448.call.apply(this_sym17448, [this_sym17448].concat(args17449.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__17464 = this;
  return cljs.core.PersistentVector.fromArray([this__17464.key, this__17464.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__17465 = this;
  return this__17465.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__17466 = this;
  return this__17466.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__17467 = this;
  var node__17468 = this;
  return new cljs.core.RedNode(this__17467.key, this__17467.val, this__17467.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__17469 = this;
  var node__17470 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__17471 = this;
  var node__17472 = this;
  return new cljs.core.RedNode(this__17471.key, this__17471.val, this__17471.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__17473 = this;
  var node__17474 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__17475 = this;
  var node__17476 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__17476, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__17477 = this;
  var node__17478 = this;
  return new cljs.core.RedNode(this__17477.key, this__17477.val, del, this__17477.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__17479 = this;
  var node__17480 = this;
  return new cljs.core.RedNode(this__17479.key, this__17479.val, ins, this__17479.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__17481 = this;
  var node__17482 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__17481.left)) {
    return new cljs.core.RedNode(this__17481.key, this__17481.val, this__17481.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__17481.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__17481.right)) {
      return new cljs.core.RedNode(this__17481.right.key, this__17481.right.val, new cljs.core.BlackNode(this__17481.key, this__17481.val, this__17481.left, this__17481.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__17481.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__17482, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__17504 = null;
  var G__17504__0 = function() {
    var this__17483 = this;
    var this__17485 = this;
    return cljs.core.pr_str.call(null, this__17485)
  };
  G__17504 = function() {
    switch(arguments.length) {
      case 0:
        return G__17504__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17504
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__17486 = this;
  var node__17487 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__17486.right)) {
    return new cljs.core.RedNode(this__17486.key, this__17486.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__17486.left, null), this__17486.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__17486.left)) {
      return new cljs.core.RedNode(this__17486.left.key, this__17486.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__17486.left.left, null), new cljs.core.BlackNode(this__17486.key, this__17486.val, this__17486.left.right, this__17486.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__17487, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__17488 = this;
  var node__17489 = this;
  return new cljs.core.BlackNode(this__17488.key, this__17488.val, this__17488.left, this__17488.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__17490 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__17491 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__17492 = this;
  return cljs.core.list.call(null, this__17492.key, this__17492.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__17493 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__17494 = this;
  return this__17494.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__17495 = this;
  return cljs.core.PersistentVector.fromArray([this__17495.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__17496 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__17496.key, this__17496.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17497 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__17498 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__17498.key, this__17498.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__17499 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__17500 = this;
  if(n === 0) {
    return this__17500.key
  }else {
    if(n === 1) {
      return this__17500.val
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
  var this__17501 = this;
  if(n === 0) {
    return this__17501.key
  }else {
    if(n === 1) {
      return this__17501.val
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
  var this__17502 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__17508 = comp.call(null, k, tree.key);
    if(c__17508 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__17508 < 0) {
        var ins__17509 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__17509 == null)) {
          return tree.add_left(ins__17509)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__17510 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__17510 == null)) {
            return tree.add_right(ins__17510)
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
          var app__17513 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__17513)) {
            return new cljs.core.RedNode(app__17513.key, app__17513.val, new cljs.core.RedNode(left.key, left.val, left.left, app__17513.left, null), new cljs.core.RedNode(right.key, right.val, app__17513.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__17513, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__17514 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__17514)) {
              return new cljs.core.RedNode(app__17514.key, app__17514.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__17514.left, null), new cljs.core.BlackNode(right.key, right.val, app__17514.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__17514, right.right, null))
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
    var c__17520 = comp.call(null, k, tree.key);
    if(c__17520 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__17520 < 0) {
        var del__17521 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____17522 = !(del__17521 == null);
          if(or__3824__auto____17522) {
            return or__3824__auto____17522
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__17521, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__17521, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__17523 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____17524 = !(del__17523 == null);
            if(or__3824__auto____17524) {
              return or__3824__auto____17524
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__17523)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__17523, null)
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
  var tk__17527 = tree.key;
  var c__17528 = comp.call(null, k, tk__17527);
  if(c__17528 === 0) {
    return tree.replace(tk__17527, v, tree.left, tree.right)
  }else {
    if(c__17528 < 0) {
      return tree.replace(tk__17527, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__17527, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__17531 = this;
  var h__2192__auto____17532 = this__17531.__hash;
  if(!(h__2192__auto____17532 == null)) {
    return h__2192__auto____17532
  }else {
    var h__2192__auto____17533 = cljs.core.hash_imap.call(null, coll);
    this__17531.__hash = h__2192__auto____17533;
    return h__2192__auto____17533
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17534 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17535 = this;
  var n__17536 = coll.entry_at(k);
  if(!(n__17536 == null)) {
    return n__17536.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17537 = this;
  var found__17538 = [null];
  var t__17539 = cljs.core.tree_map_add.call(null, this__17537.comp, this__17537.tree, k, v, found__17538);
  if(t__17539 == null) {
    var found_node__17540 = cljs.core.nth.call(null, found__17538, 0);
    if(cljs.core._EQ_.call(null, v, found_node__17540.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__17537.comp, cljs.core.tree_map_replace.call(null, this__17537.comp, this__17537.tree, k, v), this__17537.cnt, this__17537.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__17537.comp, t__17539.blacken(), this__17537.cnt + 1, this__17537.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__17541 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__17575 = null;
  var G__17575__2 = function(this_sym17542, k) {
    var this__17544 = this;
    var this_sym17542__17545 = this;
    var coll__17546 = this_sym17542__17545;
    return coll__17546.cljs$core$ILookup$_lookup$arity$2(coll__17546, k)
  };
  var G__17575__3 = function(this_sym17543, k, not_found) {
    var this__17544 = this;
    var this_sym17543__17547 = this;
    var coll__17548 = this_sym17543__17547;
    return coll__17548.cljs$core$ILookup$_lookup$arity$3(coll__17548, k, not_found)
  };
  G__17575 = function(this_sym17543, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17575__2.call(this, this_sym17543, k);
      case 3:
        return G__17575__3.call(this, this_sym17543, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17575
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym17529, args17530) {
  var this__17549 = this;
  return this_sym17529.call.apply(this_sym17529, [this_sym17529].concat(args17530.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__17550 = this;
  if(!(this__17550.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__17550.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__17551 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__17552 = this;
  if(this__17552.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__17552.tree, false, this__17552.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__17553 = this;
  var this__17554 = this;
  return cljs.core.pr_str.call(null, this__17554)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__17555 = this;
  var coll__17556 = this;
  var t__17557 = this__17555.tree;
  while(true) {
    if(!(t__17557 == null)) {
      var c__17558 = this__17555.comp.call(null, k, t__17557.key);
      if(c__17558 === 0) {
        return t__17557
      }else {
        if(c__17558 < 0) {
          var G__17576 = t__17557.left;
          t__17557 = G__17576;
          continue
        }else {
          if("\ufdd0'else") {
            var G__17577 = t__17557.right;
            t__17557 = G__17577;
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
  var this__17559 = this;
  if(this__17559.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__17559.tree, ascending_QMARK_, this__17559.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__17560 = this;
  if(this__17560.cnt > 0) {
    var stack__17561 = null;
    var t__17562 = this__17560.tree;
    while(true) {
      if(!(t__17562 == null)) {
        var c__17563 = this__17560.comp.call(null, k, t__17562.key);
        if(c__17563 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__17561, t__17562), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__17563 < 0) {
              var G__17578 = cljs.core.conj.call(null, stack__17561, t__17562);
              var G__17579 = t__17562.left;
              stack__17561 = G__17578;
              t__17562 = G__17579;
              continue
            }else {
              var G__17580 = stack__17561;
              var G__17581 = t__17562.right;
              stack__17561 = G__17580;
              t__17562 = G__17581;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__17563 > 0) {
                var G__17582 = cljs.core.conj.call(null, stack__17561, t__17562);
                var G__17583 = t__17562.right;
                stack__17561 = G__17582;
                t__17562 = G__17583;
                continue
              }else {
                var G__17584 = stack__17561;
                var G__17585 = t__17562.left;
                stack__17561 = G__17584;
                t__17562 = G__17585;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__17561 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__17561, ascending_QMARK_, -1, null)
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
  var this__17564 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__17565 = this;
  return this__17565.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17566 = this;
  if(this__17566.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__17566.tree, true, this__17566.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17567 = this;
  return this__17567.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17568 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17569 = this;
  return new cljs.core.PersistentTreeMap(this__17569.comp, this__17569.tree, this__17569.cnt, meta, this__17569.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17570 = this;
  return this__17570.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17571 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__17571.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__17572 = this;
  var found__17573 = [null];
  var t__17574 = cljs.core.tree_map_remove.call(null, this__17572.comp, this__17572.tree, k, found__17573);
  if(t__17574 == null) {
    if(cljs.core.nth.call(null, found__17573, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__17572.comp, null, 0, this__17572.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__17572.comp, t__17574.blacken(), this__17572.cnt - 1, this__17572.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__17588 = cljs.core.seq.call(null, keyvals);
    var out__17589 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__17588) {
        var G__17590 = cljs.core.nnext.call(null, in__17588);
        var G__17591 = cljs.core.assoc_BANG_.call(null, out__17589, cljs.core.first.call(null, in__17588), cljs.core.second.call(null, in__17588));
        in__17588 = G__17590;
        out__17589 = G__17591;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__17589)
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
  hash_map.cljs$lang$applyTo = function(arglist__17592) {
    var keyvals = cljs.core.seq(arglist__17592);
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
  array_map.cljs$lang$applyTo = function(arglist__17593) {
    var keyvals = cljs.core.seq(arglist__17593);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__17597 = [];
    var obj__17598 = {};
    var kvs__17599 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__17599) {
        ks__17597.push(cljs.core.first.call(null, kvs__17599));
        obj__17598[cljs.core.first.call(null, kvs__17599)] = cljs.core.second.call(null, kvs__17599);
        var G__17600 = cljs.core.nnext.call(null, kvs__17599);
        kvs__17599 = G__17600;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__17597, obj__17598)
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
  obj_map.cljs$lang$applyTo = function(arglist__17601) {
    var keyvals = cljs.core.seq(arglist__17601);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__17604 = cljs.core.seq.call(null, keyvals);
    var out__17605 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__17604) {
        var G__17606 = cljs.core.nnext.call(null, in__17604);
        var G__17607 = cljs.core.assoc.call(null, out__17605, cljs.core.first.call(null, in__17604), cljs.core.second.call(null, in__17604));
        in__17604 = G__17606;
        out__17605 = G__17607;
        continue
      }else {
        return out__17605
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
  sorted_map.cljs$lang$applyTo = function(arglist__17608) {
    var keyvals = cljs.core.seq(arglist__17608);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__17611 = cljs.core.seq.call(null, keyvals);
    var out__17612 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__17611) {
        var G__17613 = cljs.core.nnext.call(null, in__17611);
        var G__17614 = cljs.core.assoc.call(null, out__17612, cljs.core.first.call(null, in__17611), cljs.core.second.call(null, in__17611));
        in__17611 = G__17613;
        out__17612 = G__17614;
        continue
      }else {
        return out__17612
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__17615) {
    var comparator = cljs.core.first(arglist__17615);
    var keyvals = cljs.core.rest(arglist__17615);
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
      return cljs.core.reduce.call(null, function(p1__17616_SHARP_, p2__17617_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____17619 = p1__17616_SHARP_;
          if(cljs.core.truth_(or__3824__auto____17619)) {
            return or__3824__auto____17619
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__17617_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__17620) {
    var maps = cljs.core.seq(arglist__17620);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__17628 = function(m, e) {
        var k__17626 = cljs.core.first.call(null, e);
        var v__17627 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__17626)) {
          return cljs.core.assoc.call(null, m, k__17626, f.call(null, cljs.core._lookup.call(null, m, k__17626, null), v__17627))
        }else {
          return cljs.core.assoc.call(null, m, k__17626, v__17627)
        }
      };
      var merge2__17630 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__17628, function() {
          var or__3824__auto____17629 = m1;
          if(cljs.core.truth_(or__3824__auto____17629)) {
            return or__3824__auto____17629
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__17630, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__17631) {
    var f = cljs.core.first(arglist__17631);
    var maps = cljs.core.rest(arglist__17631);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__17636 = cljs.core.ObjMap.EMPTY;
  var keys__17637 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__17637) {
      var key__17638 = cljs.core.first.call(null, keys__17637);
      var entry__17639 = cljs.core._lookup.call(null, map, key__17638, "\ufdd0'cljs.core/not-found");
      var G__17640 = cljs.core.not_EQ_.call(null, entry__17639, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__17636, key__17638, entry__17639) : ret__17636;
      var G__17641 = cljs.core.next.call(null, keys__17637);
      ret__17636 = G__17640;
      keys__17637 = G__17641;
      continue
    }else {
      return ret__17636
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
  var this__17645 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__17645.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17646 = this;
  var h__2192__auto____17647 = this__17646.__hash;
  if(!(h__2192__auto____17647 == null)) {
    return h__2192__auto____17647
  }else {
    var h__2192__auto____17648 = cljs.core.hash_iset.call(null, coll);
    this__17646.__hash = h__2192__auto____17648;
    return h__2192__auto____17648
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__17649 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__17650 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__17650.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__17671 = null;
  var G__17671__2 = function(this_sym17651, k) {
    var this__17653 = this;
    var this_sym17651__17654 = this;
    var coll__17655 = this_sym17651__17654;
    return coll__17655.cljs$core$ILookup$_lookup$arity$2(coll__17655, k)
  };
  var G__17671__3 = function(this_sym17652, k, not_found) {
    var this__17653 = this;
    var this_sym17652__17656 = this;
    var coll__17657 = this_sym17652__17656;
    return coll__17657.cljs$core$ILookup$_lookup$arity$3(coll__17657, k, not_found)
  };
  G__17671 = function(this_sym17652, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17671__2.call(this, this_sym17652, k);
      case 3:
        return G__17671__3.call(this, this_sym17652, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17671
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym17643, args17644) {
  var this__17658 = this;
  return this_sym17643.call.apply(this_sym17643, [this_sym17643].concat(args17644.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17659 = this;
  return new cljs.core.PersistentHashSet(this__17659.meta, cljs.core.assoc.call(null, this__17659.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__17660 = this;
  var this__17661 = this;
  return cljs.core.pr_str.call(null, this__17661)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17662 = this;
  return cljs.core.keys.call(null, this__17662.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__17663 = this;
  return new cljs.core.PersistentHashSet(this__17663.meta, cljs.core.dissoc.call(null, this__17663.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17664 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17665 = this;
  var and__3822__auto____17666 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____17666) {
    var and__3822__auto____17667 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____17667) {
      return cljs.core.every_QMARK_.call(null, function(p1__17642_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__17642_SHARP_)
      }, other)
    }else {
      return and__3822__auto____17667
    }
  }else {
    return and__3822__auto____17666
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17668 = this;
  return new cljs.core.PersistentHashSet(meta, this__17668.hash_map, this__17668.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17669 = this;
  return this__17669.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17670 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__17670.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__17672 = cljs.core.count.call(null, items);
  var i__17673 = 0;
  var out__17674 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__17673 < len__17672) {
      var G__17675 = i__17673 + 1;
      var G__17676 = cljs.core.conj_BANG_.call(null, out__17674, items[i__17673]);
      i__17673 = G__17675;
      out__17674 = G__17676;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__17674)
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
  var G__17694 = null;
  var G__17694__2 = function(this_sym17680, k) {
    var this__17682 = this;
    var this_sym17680__17683 = this;
    var tcoll__17684 = this_sym17680__17683;
    if(cljs.core._lookup.call(null, this__17682.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__17694__3 = function(this_sym17681, k, not_found) {
    var this__17682 = this;
    var this_sym17681__17685 = this;
    var tcoll__17686 = this_sym17681__17685;
    if(cljs.core._lookup.call(null, this__17682.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__17694 = function(this_sym17681, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17694__2.call(this, this_sym17681, k);
      case 3:
        return G__17694__3.call(this, this_sym17681, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17694
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym17678, args17679) {
  var this__17687 = this;
  return this_sym17678.call.apply(this_sym17678, [this_sym17678].concat(args17679.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__17688 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__17689 = this;
  if(cljs.core._lookup.call(null, this__17689.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__17690 = this;
  return cljs.core.count.call(null, this__17690.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__17691 = this;
  this__17691.transient_map = cljs.core.dissoc_BANG_.call(null, this__17691.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__17692 = this;
  this__17692.transient_map = cljs.core.assoc_BANG_.call(null, this__17692.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__17693 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__17693.transient_map), null)
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
  var this__17697 = this;
  var h__2192__auto____17698 = this__17697.__hash;
  if(!(h__2192__auto____17698 == null)) {
    return h__2192__auto____17698
  }else {
    var h__2192__auto____17699 = cljs.core.hash_iset.call(null, coll);
    this__17697.__hash = h__2192__auto____17699;
    return h__2192__auto____17699
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__17700 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__17701 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__17701.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__17727 = null;
  var G__17727__2 = function(this_sym17702, k) {
    var this__17704 = this;
    var this_sym17702__17705 = this;
    var coll__17706 = this_sym17702__17705;
    return coll__17706.cljs$core$ILookup$_lookup$arity$2(coll__17706, k)
  };
  var G__17727__3 = function(this_sym17703, k, not_found) {
    var this__17704 = this;
    var this_sym17703__17707 = this;
    var coll__17708 = this_sym17703__17707;
    return coll__17708.cljs$core$ILookup$_lookup$arity$3(coll__17708, k, not_found)
  };
  G__17727 = function(this_sym17703, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17727__2.call(this, this_sym17703, k);
      case 3:
        return G__17727__3.call(this, this_sym17703, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17727
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym17695, args17696) {
  var this__17709 = this;
  return this_sym17695.call.apply(this_sym17695, [this_sym17695].concat(args17696.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17710 = this;
  return new cljs.core.PersistentTreeSet(this__17710.meta, cljs.core.assoc.call(null, this__17710.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__17711 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__17711.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__17712 = this;
  var this__17713 = this;
  return cljs.core.pr_str.call(null, this__17713)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__17714 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__17714.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__17715 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__17715.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__17716 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__17717 = this;
  return cljs.core._comparator.call(null, this__17717.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17718 = this;
  return cljs.core.keys.call(null, this__17718.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__17719 = this;
  return new cljs.core.PersistentTreeSet(this__17719.meta, cljs.core.dissoc.call(null, this__17719.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17720 = this;
  return cljs.core.count.call(null, this__17720.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17721 = this;
  var and__3822__auto____17722 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____17722) {
    var and__3822__auto____17723 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____17723) {
      return cljs.core.every_QMARK_.call(null, function(p1__17677_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__17677_SHARP_)
      }, other)
    }else {
      return and__3822__auto____17723
    }
  }else {
    return and__3822__auto____17722
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17724 = this;
  return new cljs.core.PersistentTreeSet(meta, this__17724.tree_map, this__17724.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17725 = this;
  return this__17725.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17726 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__17726.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__17732__delegate = function(keys) {
      var in__17730 = cljs.core.seq.call(null, keys);
      var out__17731 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__17730)) {
          var G__17733 = cljs.core.next.call(null, in__17730);
          var G__17734 = cljs.core.conj_BANG_.call(null, out__17731, cljs.core.first.call(null, in__17730));
          in__17730 = G__17733;
          out__17731 = G__17734;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__17731)
        }
        break
      }
    };
    var G__17732 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__17732__delegate.call(this, keys)
    };
    G__17732.cljs$lang$maxFixedArity = 0;
    G__17732.cljs$lang$applyTo = function(arglist__17735) {
      var keys = cljs.core.seq(arglist__17735);
      return G__17732__delegate(keys)
    };
    G__17732.cljs$lang$arity$variadic = G__17732__delegate;
    return G__17732
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
  sorted_set.cljs$lang$applyTo = function(arglist__17736) {
    var keys = cljs.core.seq(arglist__17736);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__17738) {
    var comparator = cljs.core.first(arglist__17738);
    var keys = cljs.core.rest(arglist__17738);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__17744 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____17745 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____17745)) {
        var e__17746 = temp__3971__auto____17745;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__17746))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__17744, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__17737_SHARP_) {
      var temp__3971__auto____17747 = cljs.core.find.call(null, smap, p1__17737_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____17747)) {
        var e__17748 = temp__3971__auto____17747;
        return cljs.core.second.call(null, e__17748)
      }else {
        return p1__17737_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__17778 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__17771, seen) {
        while(true) {
          var vec__17772__17773 = p__17771;
          var f__17774 = cljs.core.nth.call(null, vec__17772__17773, 0, null);
          var xs__17775 = vec__17772__17773;
          var temp__3974__auto____17776 = cljs.core.seq.call(null, xs__17775);
          if(temp__3974__auto____17776) {
            var s__17777 = temp__3974__auto____17776;
            if(cljs.core.contains_QMARK_.call(null, seen, f__17774)) {
              var G__17779 = cljs.core.rest.call(null, s__17777);
              var G__17780 = seen;
              p__17771 = G__17779;
              seen = G__17780;
              continue
            }else {
              return cljs.core.cons.call(null, f__17774, step.call(null, cljs.core.rest.call(null, s__17777), cljs.core.conj.call(null, seen, f__17774)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__17778.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__17783 = cljs.core.PersistentVector.EMPTY;
  var s__17784 = s;
  while(true) {
    if(cljs.core.next.call(null, s__17784)) {
      var G__17785 = cljs.core.conj.call(null, ret__17783, cljs.core.first.call(null, s__17784));
      var G__17786 = cljs.core.next.call(null, s__17784);
      ret__17783 = G__17785;
      s__17784 = G__17786;
      continue
    }else {
      return cljs.core.seq.call(null, ret__17783)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____17789 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____17789) {
        return or__3824__auto____17789
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__17790 = x.lastIndexOf("/");
      if(i__17790 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__17790 + 1)
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
    var or__3824__auto____17793 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____17793) {
      return or__3824__auto____17793
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__17794 = x.lastIndexOf("/");
    if(i__17794 > -1) {
      return cljs.core.subs.call(null, x, 2, i__17794)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__17801 = cljs.core.ObjMap.EMPTY;
  var ks__17802 = cljs.core.seq.call(null, keys);
  var vs__17803 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____17804 = ks__17802;
      if(and__3822__auto____17804) {
        return vs__17803
      }else {
        return and__3822__auto____17804
      }
    }()) {
      var G__17805 = cljs.core.assoc.call(null, map__17801, cljs.core.first.call(null, ks__17802), cljs.core.first.call(null, vs__17803));
      var G__17806 = cljs.core.next.call(null, ks__17802);
      var G__17807 = cljs.core.next.call(null, vs__17803);
      map__17801 = G__17805;
      ks__17802 = G__17806;
      vs__17803 = G__17807;
      continue
    }else {
      return map__17801
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
    var G__17810__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__17795_SHARP_, p2__17796_SHARP_) {
        return max_key.call(null, k, p1__17795_SHARP_, p2__17796_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__17810 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17810__delegate.call(this, k, x, y, more)
    };
    G__17810.cljs$lang$maxFixedArity = 3;
    G__17810.cljs$lang$applyTo = function(arglist__17811) {
      var k = cljs.core.first(arglist__17811);
      var x = cljs.core.first(cljs.core.next(arglist__17811));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17811)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17811)));
      return G__17810__delegate(k, x, y, more)
    };
    G__17810.cljs$lang$arity$variadic = G__17810__delegate;
    return G__17810
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
    var G__17812__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__17808_SHARP_, p2__17809_SHARP_) {
        return min_key.call(null, k, p1__17808_SHARP_, p2__17809_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__17812 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17812__delegate.call(this, k, x, y, more)
    };
    G__17812.cljs$lang$maxFixedArity = 3;
    G__17812.cljs$lang$applyTo = function(arglist__17813) {
      var k = cljs.core.first(arglist__17813);
      var x = cljs.core.first(cljs.core.next(arglist__17813));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17813)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17813)));
      return G__17812__delegate(k, x, y, more)
    };
    G__17812.cljs$lang$arity$variadic = G__17812__delegate;
    return G__17812
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
      var temp__3974__auto____17816 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17816) {
        var s__17817 = temp__3974__auto____17816;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__17817), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__17817)))
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
    var temp__3974__auto____17820 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17820) {
      var s__17821 = temp__3974__auto____17820;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__17821)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__17821), take_while.call(null, pred, cljs.core.rest.call(null, s__17821)))
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
    var comp__17823 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__17823.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__17835 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____17836 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____17836)) {
        var vec__17837__17838 = temp__3974__auto____17836;
        var e__17839 = cljs.core.nth.call(null, vec__17837__17838, 0, null);
        var s__17840 = vec__17837__17838;
        if(cljs.core.truth_(include__17835.call(null, e__17839))) {
          return s__17840
        }else {
          return cljs.core.next.call(null, s__17840)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__17835, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____17841 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____17841)) {
      var vec__17842__17843 = temp__3974__auto____17841;
      var e__17844 = cljs.core.nth.call(null, vec__17842__17843, 0, null);
      var s__17845 = vec__17842__17843;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__17844)) ? s__17845 : cljs.core.next.call(null, s__17845))
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
    var include__17857 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____17858 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____17858)) {
        var vec__17859__17860 = temp__3974__auto____17858;
        var e__17861 = cljs.core.nth.call(null, vec__17859__17860, 0, null);
        var s__17862 = vec__17859__17860;
        if(cljs.core.truth_(include__17857.call(null, e__17861))) {
          return s__17862
        }else {
          return cljs.core.next.call(null, s__17862)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__17857, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____17863 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____17863)) {
      var vec__17864__17865 = temp__3974__auto____17863;
      var e__17866 = cljs.core.nth.call(null, vec__17864__17865, 0, null);
      var s__17867 = vec__17864__17865;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__17866)) ? s__17867 : cljs.core.next.call(null, s__17867))
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
  var this__17868 = this;
  var h__2192__auto____17869 = this__17868.__hash;
  if(!(h__2192__auto____17869 == null)) {
    return h__2192__auto____17869
  }else {
    var h__2192__auto____17870 = cljs.core.hash_coll.call(null, rng);
    this__17868.__hash = h__2192__auto____17870;
    return h__2192__auto____17870
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__17871 = this;
  if(this__17871.step > 0) {
    if(this__17871.start + this__17871.step < this__17871.end) {
      return new cljs.core.Range(this__17871.meta, this__17871.start + this__17871.step, this__17871.end, this__17871.step, null)
    }else {
      return null
    }
  }else {
    if(this__17871.start + this__17871.step > this__17871.end) {
      return new cljs.core.Range(this__17871.meta, this__17871.start + this__17871.step, this__17871.end, this__17871.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__17872 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__17873 = this;
  var this__17874 = this;
  return cljs.core.pr_str.call(null, this__17874)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__17875 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__17876 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__17877 = this;
  if(this__17877.step > 0) {
    if(this__17877.start < this__17877.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__17877.start > this__17877.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__17878 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__17878.end - this__17878.start) / this__17878.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__17879 = this;
  return this__17879.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__17880 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__17880.meta, this__17880.start + this__17880.step, this__17880.end, this__17880.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__17881 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__17882 = this;
  return new cljs.core.Range(meta, this__17882.start, this__17882.end, this__17882.step, this__17882.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__17883 = this;
  return this__17883.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__17884 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__17884.start + n * this__17884.step
  }else {
    if(function() {
      var and__3822__auto____17885 = this__17884.start > this__17884.end;
      if(and__3822__auto____17885) {
        return this__17884.step === 0
      }else {
        return and__3822__auto____17885
      }
    }()) {
      return this__17884.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__17886 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__17886.start + n * this__17886.step
  }else {
    if(function() {
      var and__3822__auto____17887 = this__17886.start > this__17886.end;
      if(and__3822__auto____17887) {
        return this__17886.step === 0
      }else {
        return and__3822__auto____17887
      }
    }()) {
      return this__17886.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__17888 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17888.meta)
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
    var temp__3974__auto____17891 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17891) {
      var s__17892 = temp__3974__auto____17891;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__17892), take_nth.call(null, n, cljs.core.drop.call(null, n, s__17892)))
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
    var temp__3974__auto____17899 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17899) {
      var s__17900 = temp__3974__auto____17899;
      var fst__17901 = cljs.core.first.call(null, s__17900);
      var fv__17902 = f.call(null, fst__17901);
      var run__17903 = cljs.core.cons.call(null, fst__17901, cljs.core.take_while.call(null, function(p1__17893_SHARP_) {
        return cljs.core._EQ_.call(null, fv__17902, f.call(null, p1__17893_SHARP_))
      }, cljs.core.next.call(null, s__17900)));
      return cljs.core.cons.call(null, run__17903, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__17903), s__17900))))
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
      var temp__3971__auto____17918 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____17918) {
        var s__17919 = temp__3971__auto____17918;
        return reductions.call(null, f, cljs.core.first.call(null, s__17919), cljs.core.rest.call(null, s__17919))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____17920 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17920) {
        var s__17921 = temp__3974__auto____17920;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__17921)), cljs.core.rest.call(null, s__17921))
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
      var G__17924 = null;
      var G__17924__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__17924__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__17924__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__17924__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__17924__4 = function() {
        var G__17925__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__17925 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17925__delegate.call(this, x, y, z, args)
        };
        G__17925.cljs$lang$maxFixedArity = 3;
        G__17925.cljs$lang$applyTo = function(arglist__17926) {
          var x = cljs.core.first(arglist__17926);
          var y = cljs.core.first(cljs.core.next(arglist__17926));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17926)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17926)));
          return G__17925__delegate(x, y, z, args)
        };
        G__17925.cljs$lang$arity$variadic = G__17925__delegate;
        return G__17925
      }();
      G__17924 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17924__0.call(this);
          case 1:
            return G__17924__1.call(this, x);
          case 2:
            return G__17924__2.call(this, x, y);
          case 3:
            return G__17924__3.call(this, x, y, z);
          default:
            return G__17924__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17924.cljs$lang$maxFixedArity = 3;
      G__17924.cljs$lang$applyTo = G__17924__4.cljs$lang$applyTo;
      return G__17924
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__17927 = null;
      var G__17927__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__17927__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__17927__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__17927__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__17927__4 = function() {
        var G__17928__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__17928 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17928__delegate.call(this, x, y, z, args)
        };
        G__17928.cljs$lang$maxFixedArity = 3;
        G__17928.cljs$lang$applyTo = function(arglist__17929) {
          var x = cljs.core.first(arglist__17929);
          var y = cljs.core.first(cljs.core.next(arglist__17929));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17929)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17929)));
          return G__17928__delegate(x, y, z, args)
        };
        G__17928.cljs$lang$arity$variadic = G__17928__delegate;
        return G__17928
      }();
      G__17927 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17927__0.call(this);
          case 1:
            return G__17927__1.call(this, x);
          case 2:
            return G__17927__2.call(this, x, y);
          case 3:
            return G__17927__3.call(this, x, y, z);
          default:
            return G__17927__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17927.cljs$lang$maxFixedArity = 3;
      G__17927.cljs$lang$applyTo = G__17927__4.cljs$lang$applyTo;
      return G__17927
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__17930 = null;
      var G__17930__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__17930__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__17930__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__17930__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__17930__4 = function() {
        var G__17931__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__17931 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17931__delegate.call(this, x, y, z, args)
        };
        G__17931.cljs$lang$maxFixedArity = 3;
        G__17931.cljs$lang$applyTo = function(arglist__17932) {
          var x = cljs.core.first(arglist__17932);
          var y = cljs.core.first(cljs.core.next(arglist__17932));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17932)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17932)));
          return G__17931__delegate(x, y, z, args)
        };
        G__17931.cljs$lang$arity$variadic = G__17931__delegate;
        return G__17931
      }();
      G__17930 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17930__0.call(this);
          case 1:
            return G__17930__1.call(this, x);
          case 2:
            return G__17930__2.call(this, x, y);
          case 3:
            return G__17930__3.call(this, x, y, z);
          default:
            return G__17930__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17930.cljs$lang$maxFixedArity = 3;
      G__17930.cljs$lang$applyTo = G__17930__4.cljs$lang$applyTo;
      return G__17930
    }()
  };
  var juxt__4 = function() {
    var G__17933__delegate = function(f, g, h, fs) {
      var fs__17923 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__17934 = null;
        var G__17934__0 = function() {
          return cljs.core.reduce.call(null, function(p1__17904_SHARP_, p2__17905_SHARP_) {
            return cljs.core.conj.call(null, p1__17904_SHARP_, p2__17905_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__17923)
        };
        var G__17934__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__17906_SHARP_, p2__17907_SHARP_) {
            return cljs.core.conj.call(null, p1__17906_SHARP_, p2__17907_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__17923)
        };
        var G__17934__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__17908_SHARP_, p2__17909_SHARP_) {
            return cljs.core.conj.call(null, p1__17908_SHARP_, p2__17909_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__17923)
        };
        var G__17934__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__17910_SHARP_, p2__17911_SHARP_) {
            return cljs.core.conj.call(null, p1__17910_SHARP_, p2__17911_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__17923)
        };
        var G__17934__4 = function() {
          var G__17935__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__17912_SHARP_, p2__17913_SHARP_) {
              return cljs.core.conj.call(null, p1__17912_SHARP_, cljs.core.apply.call(null, p2__17913_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__17923)
          };
          var G__17935 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__17935__delegate.call(this, x, y, z, args)
          };
          G__17935.cljs$lang$maxFixedArity = 3;
          G__17935.cljs$lang$applyTo = function(arglist__17936) {
            var x = cljs.core.first(arglist__17936);
            var y = cljs.core.first(cljs.core.next(arglist__17936));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17936)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17936)));
            return G__17935__delegate(x, y, z, args)
          };
          G__17935.cljs$lang$arity$variadic = G__17935__delegate;
          return G__17935
        }();
        G__17934 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__17934__0.call(this);
            case 1:
              return G__17934__1.call(this, x);
            case 2:
              return G__17934__2.call(this, x, y);
            case 3:
              return G__17934__3.call(this, x, y, z);
            default:
              return G__17934__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__17934.cljs$lang$maxFixedArity = 3;
        G__17934.cljs$lang$applyTo = G__17934__4.cljs$lang$applyTo;
        return G__17934
      }()
    };
    var G__17933 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17933__delegate.call(this, f, g, h, fs)
    };
    G__17933.cljs$lang$maxFixedArity = 3;
    G__17933.cljs$lang$applyTo = function(arglist__17937) {
      var f = cljs.core.first(arglist__17937);
      var g = cljs.core.first(cljs.core.next(arglist__17937));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17937)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17937)));
      return G__17933__delegate(f, g, h, fs)
    };
    G__17933.cljs$lang$arity$variadic = G__17933__delegate;
    return G__17933
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
        var G__17940 = cljs.core.next.call(null, coll);
        coll = G__17940;
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
        var and__3822__auto____17939 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____17939) {
          return n > 0
        }else {
          return and__3822__auto____17939
        }
      }())) {
        var G__17941 = n - 1;
        var G__17942 = cljs.core.next.call(null, coll);
        n = G__17941;
        coll = G__17942;
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
  var matches__17944 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__17944), s)) {
    if(cljs.core.count.call(null, matches__17944) === 1) {
      return cljs.core.first.call(null, matches__17944)
    }else {
      return cljs.core.vec.call(null, matches__17944)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__17946 = re.exec(s);
  if(matches__17946 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__17946) === 1) {
      return cljs.core.first.call(null, matches__17946)
    }else {
      return cljs.core.vec.call(null, matches__17946)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__17951 = cljs.core.re_find.call(null, re, s);
  var match_idx__17952 = s.search(re);
  var match_str__17953 = cljs.core.coll_QMARK_.call(null, match_data__17951) ? cljs.core.first.call(null, match_data__17951) : match_data__17951;
  var post_match__17954 = cljs.core.subs.call(null, s, match_idx__17952 + cljs.core.count.call(null, match_str__17953));
  if(cljs.core.truth_(match_data__17951)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__17951, re_seq.call(null, re, post_match__17954))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__17961__17962 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___17963 = cljs.core.nth.call(null, vec__17961__17962, 0, null);
  var flags__17964 = cljs.core.nth.call(null, vec__17961__17962, 1, null);
  var pattern__17965 = cljs.core.nth.call(null, vec__17961__17962, 2, null);
  return new RegExp(pattern__17965, flags__17964)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__17955_SHARP_) {
    return print_one.call(null, p1__17955_SHARP_, opts)
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
          var and__3822__auto____17975 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____17975)) {
            var and__3822__auto____17979 = function() {
              var G__17976__17977 = obj;
              if(G__17976__17977) {
                if(function() {
                  var or__3824__auto____17978 = G__17976__17977.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____17978) {
                    return or__3824__auto____17978
                  }else {
                    return G__17976__17977.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__17976__17977.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__17976__17977)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__17976__17977)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____17979)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____17979
            }
          }else {
            return and__3822__auto____17975
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____17980 = !(obj == null);
          if(and__3822__auto____17980) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____17980
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__17981__17982 = obj;
          if(G__17981__17982) {
            if(function() {
              var or__3824__auto____17983 = G__17981__17982.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____17983) {
                return or__3824__auto____17983
              }else {
                return G__17981__17982.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__17981__17982.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__17981__17982)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__17981__17982)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__18003 = new goog.string.StringBuffer;
  var G__18004__18005 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__18004__18005) {
    var string__18006 = cljs.core.first.call(null, G__18004__18005);
    var G__18004__18007 = G__18004__18005;
    while(true) {
      sb__18003.append(string__18006);
      var temp__3974__auto____18008 = cljs.core.next.call(null, G__18004__18007);
      if(temp__3974__auto____18008) {
        var G__18004__18009 = temp__3974__auto____18008;
        var G__18022 = cljs.core.first.call(null, G__18004__18009);
        var G__18023 = G__18004__18009;
        string__18006 = G__18022;
        G__18004__18007 = G__18023;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__18010__18011 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__18010__18011) {
    var obj__18012 = cljs.core.first.call(null, G__18010__18011);
    var G__18010__18013 = G__18010__18011;
    while(true) {
      sb__18003.append(" ");
      var G__18014__18015 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__18012, opts));
      if(G__18014__18015) {
        var string__18016 = cljs.core.first.call(null, G__18014__18015);
        var G__18014__18017 = G__18014__18015;
        while(true) {
          sb__18003.append(string__18016);
          var temp__3974__auto____18018 = cljs.core.next.call(null, G__18014__18017);
          if(temp__3974__auto____18018) {
            var G__18014__18019 = temp__3974__auto____18018;
            var G__18024 = cljs.core.first.call(null, G__18014__18019);
            var G__18025 = G__18014__18019;
            string__18016 = G__18024;
            G__18014__18017 = G__18025;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____18020 = cljs.core.next.call(null, G__18010__18013);
      if(temp__3974__auto____18020) {
        var G__18010__18021 = temp__3974__auto____18020;
        var G__18026 = cljs.core.first.call(null, G__18010__18021);
        var G__18027 = G__18010__18021;
        obj__18012 = G__18026;
        G__18010__18013 = G__18027;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__18003
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__18029 = cljs.core.pr_sb.call(null, objs, opts);
  sb__18029.append("\n");
  return[cljs.core.str(sb__18029)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__18048__18049 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__18048__18049) {
    var string__18050 = cljs.core.first.call(null, G__18048__18049);
    var G__18048__18051 = G__18048__18049;
    while(true) {
      cljs.core.string_print.call(null, string__18050);
      var temp__3974__auto____18052 = cljs.core.next.call(null, G__18048__18051);
      if(temp__3974__auto____18052) {
        var G__18048__18053 = temp__3974__auto____18052;
        var G__18066 = cljs.core.first.call(null, G__18048__18053);
        var G__18067 = G__18048__18053;
        string__18050 = G__18066;
        G__18048__18051 = G__18067;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__18054__18055 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__18054__18055) {
    var obj__18056 = cljs.core.first.call(null, G__18054__18055);
    var G__18054__18057 = G__18054__18055;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__18058__18059 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__18056, opts));
      if(G__18058__18059) {
        var string__18060 = cljs.core.first.call(null, G__18058__18059);
        var G__18058__18061 = G__18058__18059;
        while(true) {
          cljs.core.string_print.call(null, string__18060);
          var temp__3974__auto____18062 = cljs.core.next.call(null, G__18058__18061);
          if(temp__3974__auto____18062) {
            var G__18058__18063 = temp__3974__auto____18062;
            var G__18068 = cljs.core.first.call(null, G__18058__18063);
            var G__18069 = G__18058__18063;
            string__18060 = G__18068;
            G__18058__18061 = G__18069;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____18064 = cljs.core.next.call(null, G__18054__18057);
      if(temp__3974__auto____18064) {
        var G__18054__18065 = temp__3974__auto____18064;
        var G__18070 = cljs.core.first.call(null, G__18054__18065);
        var G__18071 = G__18054__18065;
        obj__18056 = G__18070;
        G__18054__18057 = G__18071;
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
  pr_str.cljs$lang$applyTo = function(arglist__18072) {
    var objs = cljs.core.seq(arglist__18072);
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
  prn_str.cljs$lang$applyTo = function(arglist__18073) {
    var objs = cljs.core.seq(arglist__18073);
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
  pr.cljs$lang$applyTo = function(arglist__18074) {
    var objs = cljs.core.seq(arglist__18074);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__18075) {
    var objs = cljs.core.seq(arglist__18075);
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
  print_str.cljs$lang$applyTo = function(arglist__18076) {
    var objs = cljs.core.seq(arglist__18076);
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
  println.cljs$lang$applyTo = function(arglist__18077) {
    var objs = cljs.core.seq(arglist__18077);
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
  println_str.cljs$lang$applyTo = function(arglist__18078) {
    var objs = cljs.core.seq(arglist__18078);
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
  prn.cljs$lang$applyTo = function(arglist__18079) {
    var objs = cljs.core.seq(arglist__18079);
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
  printf.cljs$lang$applyTo = function(arglist__18080) {
    var fmt = cljs.core.first(arglist__18080);
    var args = cljs.core.rest(arglist__18080);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__18081 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18081, "{", ", ", "}", opts, coll)
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
  var pr_pair__18082 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18082, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__18083 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18083, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____18084 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____18084)) {
        var nspc__18085 = temp__3974__auto____18084;
        return[cljs.core.str(nspc__18085), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____18086 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____18086)) {
          var nspc__18087 = temp__3974__auto____18086;
          return[cljs.core.str(nspc__18087), cljs.core.str("/")].join("")
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
  var pr_pair__18088 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18088, "{", ", ", "}", opts, coll)
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
  var normalize__18090 = function(n, len) {
    var ns__18089 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__18089) < len) {
        var G__18092 = [cljs.core.str("0"), cljs.core.str(ns__18089)].join("");
        ns__18089 = G__18092;
        continue
      }else {
        return ns__18089
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__18090.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__18090.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__18090.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__18090.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__18090.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__18090.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__18091 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18091, "{", ", ", "}", opts, coll)
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
  var this__18093 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__18094 = this;
  var G__18095__18096 = cljs.core.seq.call(null, this__18094.watches);
  if(G__18095__18096) {
    var G__18098__18100 = cljs.core.first.call(null, G__18095__18096);
    var vec__18099__18101 = G__18098__18100;
    var key__18102 = cljs.core.nth.call(null, vec__18099__18101, 0, null);
    var f__18103 = cljs.core.nth.call(null, vec__18099__18101, 1, null);
    var G__18095__18104 = G__18095__18096;
    var G__18098__18105 = G__18098__18100;
    var G__18095__18106 = G__18095__18104;
    while(true) {
      var vec__18107__18108 = G__18098__18105;
      var key__18109 = cljs.core.nth.call(null, vec__18107__18108, 0, null);
      var f__18110 = cljs.core.nth.call(null, vec__18107__18108, 1, null);
      var G__18095__18111 = G__18095__18106;
      f__18110.call(null, key__18109, this$, oldval, newval);
      var temp__3974__auto____18112 = cljs.core.next.call(null, G__18095__18111);
      if(temp__3974__auto____18112) {
        var G__18095__18113 = temp__3974__auto____18112;
        var G__18120 = cljs.core.first.call(null, G__18095__18113);
        var G__18121 = G__18095__18113;
        G__18098__18105 = G__18120;
        G__18095__18106 = G__18121;
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
  var this__18114 = this;
  return this$.watches = cljs.core.assoc.call(null, this__18114.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__18115 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__18115.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__18116 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__18116.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__18117 = this;
  return this__18117.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__18118 = this;
  return this__18118.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__18119 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__18133__delegate = function(x, p__18122) {
      var map__18128__18129 = p__18122;
      var map__18128__18130 = cljs.core.seq_QMARK_.call(null, map__18128__18129) ? cljs.core.apply.call(null, cljs.core.hash_map, map__18128__18129) : map__18128__18129;
      var validator__18131 = cljs.core._lookup.call(null, map__18128__18130, "\ufdd0'validator", null);
      var meta__18132 = cljs.core._lookup.call(null, map__18128__18130, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__18132, validator__18131, null)
    };
    var G__18133 = function(x, var_args) {
      var p__18122 = null;
      if(goog.isDef(var_args)) {
        p__18122 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__18133__delegate.call(this, x, p__18122)
    };
    G__18133.cljs$lang$maxFixedArity = 1;
    G__18133.cljs$lang$applyTo = function(arglist__18134) {
      var x = cljs.core.first(arglist__18134);
      var p__18122 = cljs.core.rest(arglist__18134);
      return G__18133__delegate(x, p__18122)
    };
    G__18133.cljs$lang$arity$variadic = G__18133__delegate;
    return G__18133
  }();
  atom = function(x, var_args) {
    var p__18122 = var_args;
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
  var temp__3974__auto____18138 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____18138)) {
    var validate__18139 = temp__3974__auto____18138;
    if(cljs.core.truth_(validate__18139.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__18140 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__18140, new_value);
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
    var G__18141__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__18141 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__18141__delegate.call(this, a, f, x, y, z, more)
    };
    G__18141.cljs$lang$maxFixedArity = 5;
    G__18141.cljs$lang$applyTo = function(arglist__18142) {
      var a = cljs.core.first(arglist__18142);
      var f = cljs.core.first(cljs.core.next(arglist__18142));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18142)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__18142))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__18142)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__18142)))));
      return G__18141__delegate(a, f, x, y, z, more)
    };
    G__18141.cljs$lang$arity$variadic = G__18141__delegate;
    return G__18141
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__18143) {
    var iref = cljs.core.first(arglist__18143);
    var f = cljs.core.first(cljs.core.next(arglist__18143));
    var args = cljs.core.rest(cljs.core.next(arglist__18143));
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
  var this__18144 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__18144.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__18145 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__18145.state, function(p__18146) {
    var map__18147__18148 = p__18146;
    var map__18147__18149 = cljs.core.seq_QMARK_.call(null, map__18147__18148) ? cljs.core.apply.call(null, cljs.core.hash_map, map__18147__18148) : map__18147__18148;
    var curr_state__18150 = map__18147__18149;
    var done__18151 = cljs.core._lookup.call(null, map__18147__18149, "\ufdd0'done", null);
    if(cljs.core.truth_(done__18151)) {
      return curr_state__18150
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__18145.f.call(null)})
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
    var map__18172__18173 = options;
    var map__18172__18174 = cljs.core.seq_QMARK_.call(null, map__18172__18173) ? cljs.core.apply.call(null, cljs.core.hash_map, map__18172__18173) : map__18172__18173;
    var keywordize_keys__18175 = cljs.core._lookup.call(null, map__18172__18174, "\ufdd0'keywordize-keys", null);
    var keyfn__18176 = cljs.core.truth_(keywordize_keys__18175) ? cljs.core.keyword : cljs.core.str;
    var f__18191 = function thisfn(x) {
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
                var iter__2462__auto____18190 = function iter__18184(s__18185) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__18185__18188 = s__18185;
                    while(true) {
                      if(cljs.core.seq.call(null, s__18185__18188)) {
                        var k__18189 = cljs.core.first.call(null, s__18185__18188);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__18176.call(null, k__18189), thisfn.call(null, x[k__18189])], true), iter__18184.call(null, cljs.core.rest.call(null, s__18185__18188)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____18190.call(null, cljs.core.js_keys.call(null, x))
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
    return f__18191.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__18192) {
    var x = cljs.core.first(arglist__18192);
    var options = cljs.core.rest(arglist__18192);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__18197 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__18201__delegate = function(args) {
      var temp__3971__auto____18198 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__18197), args, null);
      if(cljs.core.truth_(temp__3971__auto____18198)) {
        var v__18199 = temp__3971__auto____18198;
        return v__18199
      }else {
        var ret__18200 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__18197, cljs.core.assoc, args, ret__18200);
        return ret__18200
      }
    };
    var G__18201 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__18201__delegate.call(this, args)
    };
    G__18201.cljs$lang$maxFixedArity = 0;
    G__18201.cljs$lang$applyTo = function(arglist__18202) {
      var args = cljs.core.seq(arglist__18202);
      return G__18201__delegate(args)
    };
    G__18201.cljs$lang$arity$variadic = G__18201__delegate;
    return G__18201
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__18204 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__18204)) {
        var G__18205 = ret__18204;
        f = G__18205;
        continue
      }else {
        return ret__18204
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__18206__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__18206 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__18206__delegate.call(this, f, args)
    };
    G__18206.cljs$lang$maxFixedArity = 1;
    G__18206.cljs$lang$applyTo = function(arglist__18207) {
      var f = cljs.core.first(arglist__18207);
      var args = cljs.core.rest(arglist__18207);
      return G__18206__delegate(f, args)
    };
    G__18206.cljs$lang$arity$variadic = G__18206__delegate;
    return G__18206
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
    var k__18209 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__18209, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__18209, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____18218 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____18218) {
      return or__3824__auto____18218
    }else {
      var or__3824__auto____18219 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____18219) {
        return or__3824__auto____18219
      }else {
        var and__3822__auto____18220 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____18220) {
          var and__3822__auto____18221 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____18221) {
            var and__3822__auto____18222 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____18222) {
              var ret__18223 = true;
              var i__18224 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____18225 = cljs.core.not.call(null, ret__18223);
                  if(or__3824__auto____18225) {
                    return or__3824__auto____18225
                  }else {
                    return i__18224 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__18223
                }else {
                  var G__18226 = isa_QMARK_.call(null, h, child.call(null, i__18224), parent.call(null, i__18224));
                  var G__18227 = i__18224 + 1;
                  ret__18223 = G__18226;
                  i__18224 = G__18227;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____18222
            }
          }else {
            return and__3822__auto____18221
          }
        }else {
          return and__3822__auto____18220
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
    var tp__18236 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__18237 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__18238 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__18239 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____18240 = cljs.core.contains_QMARK_.call(null, tp__18236.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__18238.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__18238.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__18236, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__18239.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__18237, parent, ta__18238), "\ufdd0'descendants":tf__18239.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__18238, tag, td__18237)})
    }();
    if(cljs.core.truth_(or__3824__auto____18240)) {
      return or__3824__auto____18240
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
    var parentMap__18245 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__18246 = cljs.core.truth_(parentMap__18245.call(null, tag)) ? cljs.core.disj.call(null, parentMap__18245.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__18247 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__18246)) ? cljs.core.assoc.call(null, parentMap__18245, tag, childsParents__18246) : cljs.core.dissoc.call(null, parentMap__18245, tag);
    var deriv_seq__18248 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__18228_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__18228_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__18228_SHARP_), cljs.core.second.call(null, p1__18228_SHARP_)))
    }, cljs.core.seq.call(null, newParents__18247)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__18245.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__18229_SHARP_, p2__18230_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__18229_SHARP_, p2__18230_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__18248))
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
  var xprefs__18256 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____18258 = cljs.core.truth_(function() {
    var and__3822__auto____18257 = xprefs__18256;
    if(cljs.core.truth_(and__3822__auto____18257)) {
      return xprefs__18256.call(null, y)
    }else {
      return and__3822__auto____18257
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____18258)) {
    return or__3824__auto____18258
  }else {
    var or__3824__auto____18260 = function() {
      var ps__18259 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__18259) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__18259), prefer_table))) {
          }else {
          }
          var G__18263 = cljs.core.rest.call(null, ps__18259);
          ps__18259 = G__18263;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____18260)) {
      return or__3824__auto____18260
    }else {
      var or__3824__auto____18262 = function() {
        var ps__18261 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__18261) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__18261), y, prefer_table))) {
            }else {
            }
            var G__18264 = cljs.core.rest.call(null, ps__18261);
            ps__18261 = G__18264;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____18262)) {
        return or__3824__auto____18262
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____18266 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____18266)) {
    return or__3824__auto____18266
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__18284 = cljs.core.reduce.call(null, function(be, p__18276) {
    var vec__18277__18278 = p__18276;
    var k__18279 = cljs.core.nth.call(null, vec__18277__18278, 0, null);
    var ___18280 = cljs.core.nth.call(null, vec__18277__18278, 1, null);
    var e__18281 = vec__18277__18278;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__18279)) {
      var be2__18283 = cljs.core.truth_(function() {
        var or__3824__auto____18282 = be == null;
        if(or__3824__auto____18282) {
          return or__3824__auto____18282
        }else {
          return cljs.core.dominates.call(null, k__18279, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__18281 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__18283), k__18279, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__18279), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__18283)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__18283
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__18284)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__18284));
      return cljs.core.second.call(null, best_entry__18284)
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
    var and__3822__auto____18289 = mf;
    if(and__3822__auto____18289) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____18289
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____18290 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18291 = cljs.core._reset[goog.typeOf(x__2363__auto____18290)];
      if(or__3824__auto____18291) {
        return or__3824__auto____18291
      }else {
        var or__3824__auto____18292 = cljs.core._reset["_"];
        if(or__3824__auto____18292) {
          return or__3824__auto____18292
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____18297 = mf;
    if(and__3822__auto____18297) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____18297
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____18298 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18299 = cljs.core._add_method[goog.typeOf(x__2363__auto____18298)];
      if(or__3824__auto____18299) {
        return or__3824__auto____18299
      }else {
        var or__3824__auto____18300 = cljs.core._add_method["_"];
        if(or__3824__auto____18300) {
          return or__3824__auto____18300
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____18305 = mf;
    if(and__3822__auto____18305) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____18305
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____18306 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18307 = cljs.core._remove_method[goog.typeOf(x__2363__auto____18306)];
      if(or__3824__auto____18307) {
        return or__3824__auto____18307
      }else {
        var or__3824__auto____18308 = cljs.core._remove_method["_"];
        if(or__3824__auto____18308) {
          return or__3824__auto____18308
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____18313 = mf;
    if(and__3822__auto____18313) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____18313
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____18314 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18315 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____18314)];
      if(or__3824__auto____18315) {
        return or__3824__auto____18315
      }else {
        var or__3824__auto____18316 = cljs.core._prefer_method["_"];
        if(or__3824__auto____18316) {
          return or__3824__auto____18316
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____18321 = mf;
    if(and__3822__auto____18321) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____18321
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____18322 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18323 = cljs.core._get_method[goog.typeOf(x__2363__auto____18322)];
      if(or__3824__auto____18323) {
        return or__3824__auto____18323
      }else {
        var or__3824__auto____18324 = cljs.core._get_method["_"];
        if(or__3824__auto____18324) {
          return or__3824__auto____18324
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____18329 = mf;
    if(and__3822__auto____18329) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____18329
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____18330 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18331 = cljs.core._methods[goog.typeOf(x__2363__auto____18330)];
      if(or__3824__auto____18331) {
        return or__3824__auto____18331
      }else {
        var or__3824__auto____18332 = cljs.core._methods["_"];
        if(or__3824__auto____18332) {
          return or__3824__auto____18332
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____18337 = mf;
    if(and__3822__auto____18337) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____18337
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____18338 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18339 = cljs.core._prefers[goog.typeOf(x__2363__auto____18338)];
      if(or__3824__auto____18339) {
        return or__3824__auto____18339
      }else {
        var or__3824__auto____18340 = cljs.core._prefers["_"];
        if(or__3824__auto____18340) {
          return or__3824__auto____18340
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____18345 = mf;
    if(and__3822__auto____18345) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____18345
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____18346 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18347 = cljs.core._dispatch[goog.typeOf(x__2363__auto____18346)];
      if(or__3824__auto____18347) {
        return or__3824__auto____18347
      }else {
        var or__3824__auto____18348 = cljs.core._dispatch["_"];
        if(or__3824__auto____18348) {
          return or__3824__auto____18348
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__18351 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__18352 = cljs.core._get_method.call(null, mf, dispatch_val__18351);
  if(cljs.core.truth_(target_fn__18352)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__18351)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__18352, args)
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
  var this__18353 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__18354 = this;
  cljs.core.swap_BANG_.call(null, this__18354.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__18354.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__18354.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__18354.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__18355 = this;
  cljs.core.swap_BANG_.call(null, this__18355.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__18355.method_cache, this__18355.method_table, this__18355.cached_hierarchy, this__18355.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__18356 = this;
  cljs.core.swap_BANG_.call(null, this__18356.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__18356.method_cache, this__18356.method_table, this__18356.cached_hierarchy, this__18356.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__18357 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__18357.cached_hierarchy), cljs.core.deref.call(null, this__18357.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__18357.method_cache, this__18357.method_table, this__18357.cached_hierarchy, this__18357.hierarchy)
  }
  var temp__3971__auto____18358 = cljs.core.deref.call(null, this__18357.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____18358)) {
    var target_fn__18359 = temp__3971__auto____18358;
    return target_fn__18359
  }else {
    var temp__3971__auto____18360 = cljs.core.find_and_cache_best_method.call(null, this__18357.name, dispatch_val, this__18357.hierarchy, this__18357.method_table, this__18357.prefer_table, this__18357.method_cache, this__18357.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____18360)) {
      var target_fn__18361 = temp__3971__auto____18360;
      return target_fn__18361
    }else {
      return cljs.core.deref.call(null, this__18357.method_table).call(null, this__18357.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__18362 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__18362.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__18362.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__18362.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__18362.method_cache, this__18362.method_table, this__18362.cached_hierarchy, this__18362.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__18363 = this;
  return cljs.core.deref.call(null, this__18363.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__18364 = this;
  return cljs.core.deref.call(null, this__18364.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__18365 = this;
  return cljs.core.do_dispatch.call(null, mf, this__18365.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__18367__delegate = function(_, args) {
    var self__18366 = this;
    return cljs.core._dispatch.call(null, self__18366, args)
  };
  var G__18367 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__18367__delegate.call(this, _, args)
  };
  G__18367.cljs$lang$maxFixedArity = 1;
  G__18367.cljs$lang$applyTo = function(arglist__18368) {
    var _ = cljs.core.first(arglist__18368);
    var args = cljs.core.rest(arglist__18368);
    return G__18367__delegate(_, args)
  };
  G__18367.cljs$lang$arity$variadic = G__18367__delegate;
  return G__18367
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__18369 = this;
  return cljs.core._dispatch.call(null, self__18369, args)
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
  var this__18370 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_18372, _) {
  var this__18371 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__18371.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__18373 = this;
  var and__3822__auto____18374 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____18374) {
    return this__18373.uuid === other.uuid
  }else {
    return and__3822__auto____18374
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__18375 = this;
  var this__18376 = this;
  return cljs.core.pr_str.call(null, this__18376)
};
cljs.core.UUID;
goog.provide("subpar.core");
goog.require("cljs.core");
subpar.core.get_index = function get_index(cm) {
  return cm.indexFromPos(cm.getCursor())
};
goog.exportSymbol("subpar.core.get_index", subpar.core.get_index);
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
  var or__3824__auto____18379 = cljs.core._EQ_.call(null, x, "\t");
  if(or__3824__auto____18379) {
    return or__3824__auto____18379
  }else {
    var or__3824__auto____18380 = cljs.core._EQ_.call(null, x, " ");
    if(or__3824__auto____18380) {
      return or__3824__auto____18380
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
  var and__3822__auto____18384 = function() {
    var and__3822__auto____18383 = 0 <= i;
    if(and__3822__auto____18383) {
      return i <= cljs.core.count.call(null, (new cljs.core.Keyword("\ufdd0'chars")).call(null, p))
    }else {
      return and__3822__auto____18383
    }
  }();
  if(cljs.core.truth_(and__3822__auto____18384)) {
    return cljs.core._EQ_.call(null, mode, subpar.core.get_mode.call(null, p, i))
  }else {
    return and__3822__auto____18384
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
  var and__3822__auto____18388 = i;
  if(cljs.core.truth_(and__3822__auto____18388)) {
    var and__3822__auto____18389 = j;
    if(cljs.core.truth_(and__3822__auto____18389)) {
      return cljs.core.count.call(null, cljs.core.filter.call(null, function(p1__18385_SHARP_) {
        return cljs.core._EQ_.call(null, "\n", p1__18385_SHARP_)
      }, cljs.core.drop.call(null, i, cljs.core.drop_last.call(null, cljs.core.count.call(null, s) - j - 1, cljs.core.take.call(null, cljs.core.count.call(null, s), s))))) + 1
    }else {
      return and__3822__auto____18389
    }
  }else {
    return and__3822__auto____18388
  }
};
subpar.core.escaped_QMARK_ = function escaped_QMARK_(s, i) {
  return cljs.core.odd_QMARK_.call(null, function() {
    var c__18393 = 0;
    var j__18394 = i - 1;
    while(true) {
      var a__18395 = cljs.core.nth.call(null, s, j__18394, null);
      if(j__18394 < 0) {
        return c__18393
      }else {
        if(a__18395 == null) {
          return c__18393
        }else {
          if(cljs.core.not_EQ_.call(null, "\\", a__18395)) {
            return c__18393
          }else {
            if(true) {
              var G__18396 = c__18393 + 1;
              var G__18397 = j__18394 - 1;
              c__18393 = G__18396;
              j__18394 = G__18397;
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
subpar.core.backward_up = function backward_up(s, i) {
  var vec__18402__18403 = subpar.core.get_wrapper.call(null, subpar.core.parse.call(null, s), i);
  var o__18404 = cljs.core.nth.call(null, vec__18402__18403, 0, null);
  var c__18405 = cljs.core.nth.call(null, vec__18402__18403, 1, null);
  if(cljs.core._EQ_.call(null, -1, o__18404)) {
    return i
  }else {
    return o__18404
  }
};
goog.exportSymbol("subpar.core.backward_up", subpar.core.backward_up);
subpar.core.forward_delete = function forward_delete(s, i) {
  var p__18410 = subpar.core.parse.call(null, s);
  var h__18411 = i - 1;
  var j__18412 = i + 1;
  var c__18413 = cljs.core.nth.call(null, s, i, null);
  if(i >= cljs.core.count.call(null, s)) {
    return 0
  }else {
    if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, i))) {
      return 2
    }else {
      if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, j__18412))) {
        return 3
      }else {
        if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([h__18411, i], true), subpar.core.get_wrapper.call(null, p__18410, i))) {
          return 2
        }else {
          if(cljs.core.truth_(subpar.core.closes_list_QMARK_.call(null, p__18410, i))) {
            return 0
          }else {
            if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([i, j__18412], true), subpar.core.get_wrapper.call(null, p__18410, j__18412))) {
              return 3
            }else {
              if(cljs.core.truth_(subpar.core.opens_list_QMARK_.call(null, p__18410, i))) {
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
goog.exportSymbol("subpar.core.forward_delete", subpar.core.forward_delete);
subpar.core.backward_delete = function backward_delete(s, i) {
  var p__18417 = subpar.core.parse.call(null, s);
  var g__18418 = i - 2;
  var h__18419 = i - 1;
  if(i <= 0) {
    return 0
  }else {
    if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, h__18419))) {
      return 3
    }else {
      if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, i))) {
        return 2
      }else {
        if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([g__18418, h__18419], true), subpar.core.get_wrapper.call(null, p__18417, h__18419))) {
          return 3
        }else {
          if(cljs.core.truth_(subpar.core.closes_list_QMARK_.call(null, p__18417, h__18419))) {
            return 4
          }else {
            if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([h__18419, i], true), subpar.core.get_wrapper.call(null, p__18417, i))) {
              return 2
            }else {
              if(cljs.core.truth_(subpar.core.opens_list_QMARK_.call(null, p__18417, h__18419))) {
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
goog.exportSymbol("subpar.core.backward_delete", subpar.core.backward_delete);
subpar.core.doublequote = function doublequote(s, i) {
  var p__18421 = subpar.core.parse.call(null, s);
  if(i < 0) {
    return 0
  }else {
    if(i >= cljs.core.count.call(null, s)) {
      return 0
    }else {
      if(cljs.core.truth_(subpar.core.in_comment_QMARK_.call(null, p__18421, i))) {
        return 3
      }else {
        if(cljs.core.truth_(subpar.core.n_str_QMARK_.call(null, p__18421, i))) {
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
goog.exportSymbol("subpar.core.doublequote", subpar.core.doublequote);
subpar.core.close_expression = function close_expression(s, i) {
  var p__18433 = subpar.core.parse.call(null, s);
  var vec__18432__18434 = subpar.core.get_wrapper.call(null, p__18433, i);
  var o__18435 = cljs.core.nth.call(null, vec__18432__18434, 0, null);
  var c__18436 = cljs.core.nth.call(null, vec__18432__18434, 1, null);
  if(cljs.core._EQ_.call(null, -1, o__18435)) {
    return[]
  }else {
    var start__18438 = function() {
      var or__3824__auto____18437 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, cljs.core.identity, p__18433));
      if(cljs.core.truth_(or__3824__auto____18437)) {
        return or__3824__auto____18437
      }else {
        return o__18435
      }
    }() + 1;
    var delete__18439 = cljs.core.not_EQ_.call(null, start__18438, c__18436);
    var dest__18440 = delete__18439 ? start__18438 + 1 : c__18436 + 1;
    return[delete__18439, start__18438, c__18436, dest__18440]
  }
};
goog.exportSymbol("subpar.core.close_expression", subpar.core.close_expression);
subpar.core.get_start_of_next_list = function get_start_of_next_list(s, i) {
  var p__18444 = subpar.core.parse.call(null, s);
  var r__18446 = cljs.core.first.call(null, subpar.core.get_siblings.call(null, i, cljs.core.keys, function(p1__18422_SHARP_) {
    var and__3822__auto____18445 = p1__18422_SHARP_ >= i;
    if(and__3822__auto____18445) {
      return cljs.core.get_in.call(null, p__18444, cljs.core.PersistentVector.fromArray(["\ufdd0'families", p1__18422_SHARP_], true))
    }else {
      return and__3822__auto____18445
    }
  }, p__18444));
  if(r__18446 == null) {
    return false
  }else {
    return r__18446
  }
};
subpar.core.forward_down = function forward_down(s, i) {
  var r__18449 = subpar.core.get_start_of_next_list.call(null, s, i);
  if(cljs.core.truth_(r__18449)) {
    return r__18449 + 1
  }else {
    return i
  }
};
goog.exportSymbol("subpar.core.forward_down", subpar.core.forward_down);
subpar.core.backward = function backward(s, i) {
  var p__18455 = subpar.core.parse.call(null, s);
  var b__18456 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.keys, function(p1__18447_SHARP_) {
    return p1__18447_SHARP_ < i
  }, p__18455));
  var o__18457 = subpar.core.get_opening_delimiter_index_with_parse.call(null, p__18455, i);
  var or__3824__auto____18458 = b__18456;
  if(cljs.core.truth_(or__3824__auto____18458)) {
    return or__3824__auto____18458
  }else {
    if(o__18457 < 0) {
      return 0
    }else {
      return o__18457
    }
  }
};
goog.exportSymbol("subpar.core.backward", subpar.core.backward);
subpar.core.backward_down = function backward_down(s, i) {
  var p__18463 = subpar.core.parse.call(null, s);
  var b__18465 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, function(p1__18450_SHARP_) {
    var and__3822__auto____18464 = p1__18450_SHARP_ < i;
    if(and__3822__auto____18464) {
      return subpar.core.closes_list_QMARK_.call(null, p__18463, p1__18450_SHARP_)
    }else {
      return and__3822__auto____18464
    }
  }, p__18463));
  var or__3824__auto____18466 = b__18465;
  if(cljs.core.truth_(or__3824__auto____18466)) {
    return or__3824__auto____18466
  }else {
    return i
  }
};
goog.exportSymbol("subpar.core.backward_down", subpar.core.backward_down);
subpar.core.forward_up = function forward_up(s, i) {
  var p__18475 = subpar.core.parse.call(null, s);
  var vec__18474__18476 = subpar.core.get_wrapper.call(null, p__18475, i);
  var o__18477 = cljs.core.nth.call(null, vec__18474__18476, 0, null);
  var c__18478 = cljs.core.nth.call(null, vec__18474__18476, 1, null);
  var in_list__18479 = cljs.core.not_EQ_.call(null, -1, o__18477);
  if(in_list__18479) {
    return c__18478 + 1
  }else {
    return i
  }
};
goog.exportSymbol("subpar.core.forward_up", subpar.core.forward_up);
subpar.core.forward = function forward(s, i) {
  var p__18485 = subpar.core.parse.call(null, s);
  var b__18486 = cljs.core.first.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, function(p1__18467_SHARP_) {
    return p1__18467_SHARP_ >= i
  }, p__18485));
  var c__18487 = subpar.core.get_closing_delimiter_index_with_parse.call(null, p__18485, i);
  var l__18488 = cljs.core.count.call(null, s);
  if(cljs.core.truth_(b__18486)) {
    return b__18486 + 1
  }else {
    if(cljs.core.truth_(c__18487)) {
      return c__18487 + 1 < l__18488 ? c__18487 + 1 : l__18488
    }else {
      if(true) {
        return l__18488
      }else {
        return null
      }
    }
  }
};
goog.exportSymbol("subpar.core.forward", subpar.core.forward);
subpar.core.forward_slurp = function forward_slurp(s, i) {
  var p__18503 = subpar.core.parse.call(null, s);
  var vec__18502__18504 = subpar.core.get_wrapper.call(null, p__18503, i);
  var o__18505 = cljs.core.nth.call(null, vec__18502__18504, 0, null);
  var c__18506 = cljs.core.nth.call(null, vec__18502__18504, 1, null);
  var in_list__18507 = cljs.core.not_EQ_.call(null, -1, o__18505);
  var a__18509 = function() {
    var and__3822__auto____18508 = in_list__18507;
    if(and__3822__auto____18508) {
      return cljs.core.nth.call(null, s, c__18506, false)
    }else {
      return and__3822__auto____18508
    }
  }();
  var d__18511 = function() {
    var and__3822__auto____18510 = in_list__18507;
    if(and__3822__auto____18510) {
      return cljs.core.first.call(null, subpar.core.get_siblings.call(null, o__18505, cljs.core.vals, function(p1__18480_SHARP_) {
        return p1__18480_SHARP_ > c__18506
      }, p__18503))
    }else {
      return and__3822__auto____18510
    }
  }();
  if(cljs.core.truth_(function() {
    var and__3822__auto____18512 = a__18509;
    if(cljs.core.truth_(and__3822__auto____18512)) {
      var and__3822__auto____18513 = c__18506;
      if(cljs.core.truth_(and__3822__auto____18513)) {
        return d__18511
      }else {
        return and__3822__auto____18513
      }
    }else {
      return and__3822__auto____18512
    }
  }())) {
    return[a__18509, c__18506, d__18511 + 1, subpar.core.count_lines.call(null, s, o__18505, d__18511 + 1)]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.forward_slurp", subpar.core.forward_slurp);
subpar.core.backward_slurp = function backward_slurp(s, i) {
  var p__18526 = subpar.core.parse.call(null, s);
  var vec__18525__18527 = subpar.core.get_wrapper.call(null, p__18526, i);
  var o__18528 = cljs.core.nth.call(null, vec__18525__18527, 0, null);
  var c__18529 = cljs.core.nth.call(null, vec__18525__18527, 1, null);
  var in_list__18530 = cljs.core.not_EQ_.call(null, -1, o__18528);
  var d__18532 = function() {
    var and__3822__auto____18531 = in_list__18530;
    if(and__3822__auto____18531) {
      return cljs.core.last.call(null, subpar.core.get_siblings.call(null, o__18528, cljs.core.keys, function(p1__18489_SHARP_) {
        return p1__18489_SHARP_ < o__18528
      }, p__18526))
    }else {
      return and__3822__auto____18531
    }
  }();
  var a__18534 = function() {
    var and__3822__auto____18533 = in_list__18530;
    if(and__3822__auto____18533) {
      return cljs.core.nth.call(null, s, o__18528, false)
    }else {
      return and__3822__auto____18533
    }
  }();
  if(cljs.core.truth_(function() {
    var and__3822__auto____18535 = a__18534;
    if(cljs.core.truth_(and__3822__auto____18535)) {
      return d__18532
    }else {
      return and__3822__auto____18535
    }
  }())) {
    return[a__18534, o__18528, d__18532, subpar.core.count_lines.call(null, s, d__18532, c__18529)]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.backward_slurp", subpar.core.backward_slurp);
subpar.core.forward_barf = function forward_barf(s, i) {
  var p__18551 = subpar.core.parse.call(null, s);
  var vec__18550__18552 = subpar.core.get_wrapper.call(null, p__18551, i);
  var o__18553 = cljs.core.nth.call(null, vec__18550__18552, 0, null);
  var c__18554 = cljs.core.nth.call(null, vec__18550__18552, 1, null);
  var in_list__18555 = cljs.core.not_EQ_.call(null, -1, o__18553);
  var endings__18557 = function() {
    var and__3822__auto____18556 = in_list__18555;
    if(and__3822__auto____18556) {
      return subpar.core.get_siblings.call(null, i, cljs.core.vals, cljs.core.constantly.call(null, true), p__18551)
    }else {
      return and__3822__auto____18556
    }
  }();
  var a__18560 = function() {
    var and__3822__auto____18558 = c__18554;
    if(cljs.core.truth_(and__3822__auto____18558)) {
      var and__3822__auto____18559 = in_list__18555;
      if(and__3822__auto____18559) {
        return cljs.core.nth.call(null, s, c__18554, null)
      }else {
        return and__3822__auto____18559
      }
    }else {
      return and__3822__auto____18558
    }
  }();
  var r__18562 = function() {
    var or__3824__auto____18561 = subpar.core.count_lines.call(null, s, o__18553, c__18554);
    if(cljs.core.truth_(or__3824__auto____18561)) {
      return or__3824__auto____18561
    }else {
      return 1
    }
  }();
  var num__18563 = cljs.core.truth_(endings__18557) ? cljs.core.count.call(null, endings__18557) : 0;
  if(num__18563 > 1) {
    return[a__18560, c__18554, cljs.core.nth.call(null, endings__18557, num__18563 - 2) + 1, false, r__18562, o__18553]
  }else {
    if(cljs.core._EQ_.call(null, num__18563, 1)) {
      return[a__18560, c__18554, o__18553 + 1, true, r__18562, o__18553]
    }else {
      if(true) {
        return[]
      }else {
        return null
      }
    }
  }
};
goog.exportSymbol("subpar.core.forward_barf", subpar.core.forward_barf);
subpar.core.backward_barf = function backward_barf(s, i) {
  var p__18579 = subpar.core.parse.call(null, s);
  var vec__18578__18580 = subpar.core.get_wrapper.call(null, p__18579, i);
  var o__18581 = cljs.core.nth.call(null, vec__18578__18580, 0, null);
  var c__18582 = cljs.core.nth.call(null, vec__18578__18580, 1, null);
  var in_list__18583 = cljs.core.not_EQ_.call(null, -1, o__18581);
  var starts__18585 = function() {
    var and__3822__auto____18584 = in_list__18583;
    if(and__3822__auto____18584) {
      return subpar.core.get_siblings.call(null, i, cljs.core.keys, cljs.core.constantly.call(null, true), p__18579)
    }else {
      return and__3822__auto____18584
    }
  }();
  var a__18588 = function() {
    var and__3822__auto____18586 = o__18581;
    if(cljs.core.truth_(and__3822__auto____18586)) {
      var and__3822__auto____18587 = in_list__18583;
      if(and__3822__auto____18587) {
        return cljs.core.nth.call(null, s, o__18581, null)
      }else {
        return and__3822__auto____18587
      }
    }else {
      return and__3822__auto____18586
    }
  }();
  var r__18590 = function() {
    var or__3824__auto____18589 = subpar.core.count_lines.call(null, s, o__18581, c__18582);
    if(cljs.core.truth_(or__3824__auto____18589)) {
      return or__3824__auto____18589
    }else {
      return 1
    }
  }();
  var num__18591 = cljs.core.truth_(starts__18585) ? cljs.core.count.call(null, starts__18585) : 0;
  if(num__18591 > 1) {
    return[a__18588, o__18581, cljs.core.second.call(null, starts__18585), false, r__18590]
  }else {
    if(cljs.core._EQ_.call(null, num__18591, 1)) {
      return[a__18588, o__18581, c__18582, true, r__18590]
    }else {
      if(true) {
        return[]
      }else {
        return null
      }
    }
  }
};
goog.exportSymbol("subpar.core.backward_barf", subpar.core.backward_barf);
subpar.core.splice = function splice(s, i) {
  var p__18604 = subpar.core.parse.call(null, s);
  var vec__18603__18605 = subpar.core.get_wrapper.call(null, p__18604, i);
  var o__18606 = cljs.core.nth.call(null, vec__18603__18605, 0, null);
  var c__18607 = cljs.core.nth.call(null, vec__18603__18605, 1, null);
  var in_list__18608 = cljs.core.not_EQ_.call(null, -1, o__18606);
  if(in_list__18608) {
    var vec__18609__18610 = subpar.core.get_wrapper.call(null, p__18604, o__18606);
    var n__18611 = cljs.core.nth.call(null, vec__18609__18610, 0, null);
    var d__18612 = cljs.core.nth.call(null, vec__18609__18610, 1, null);
    var r__18613 = subpar.core.count_lines.call(null, s, n__18611, d__18612);
    return[o__18606, c__18607, 0 > n__18611 ? 0 : n__18611, r__18613]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.splice", subpar.core.splice);
subpar.core.splice_killing_backward = function splice_killing_backward(s, i) {
  var p__18626 = subpar.core.parse.call(null, s);
  var vec__18625__18627 = subpar.core.get_wrapper.call(null, p__18626, i);
  var o__18628 = cljs.core.nth.call(null, vec__18625__18627, 0, null);
  var c__18629 = cljs.core.nth.call(null, vec__18625__18627, 1, null);
  var in_list__18630 = cljs.core.not_EQ_.call(null, -1, o__18628);
  if(in_list__18630) {
    var vec__18631__18632 = subpar.core.get_wrapper.call(null, p__18626, o__18628);
    var n__18633 = cljs.core.nth.call(null, vec__18631__18632, 0, null);
    var d__18634 = cljs.core.nth.call(null, vec__18631__18632, 1, null);
    var r__18635 = subpar.core.count_lines.call(null, s, n__18633, d__18634);
    return[o__18628, o__18628 > i ? o__18628 : i, c__18629, 0 > n__18633 ? 0 : n__18633, r__18635]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.splice_killing_backward", subpar.core.splice_killing_backward);
subpar.core.splice_killing_forward = function splice_killing_forward(s, i) {
  var p__18648 = subpar.core.parse.call(null, s);
  var vec__18647__18649 = subpar.core.get_wrapper.call(null, p__18648, i);
  var o__18650 = cljs.core.nth.call(null, vec__18647__18649, 0, null);
  var c__18651 = cljs.core.nth.call(null, vec__18647__18649, 1, null);
  var in_list__18652 = cljs.core.not_EQ_.call(null, -1, o__18650);
  if(in_list__18652) {
    var vec__18653__18654 = subpar.core.get_wrapper.call(null, p__18648, o__18650);
    var n__18655 = cljs.core.nth.call(null, vec__18653__18654, 0, null);
    var d__18656 = cljs.core.nth.call(null, vec__18653__18654, 1, null);
    var r__18657 = subpar.core.count_lines.call(null, s, n__18655, d__18656);
    return[o__18650, i, c__18651 + 1, 0 > n__18655 ? 0 : n__18655, r__18657]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.splice_killing_forward", subpar.core.splice_killing_forward);
subpar.core.parse = function parse(ss) {
  var s__18696 = [cljs.core.str(ss), cljs.core.str(" ")].join("");
  var i__18697 = 0;
  var mode__18698 = subpar.core.code;
  var openings__18699 = cljs.core.list.call(null, -1);
  var start__18700 = -1;
  var t__18701 = cljs.core.PersistentVector.EMPTY;
  var families__18702 = cljs.core.PersistentArrayMap.fromArrays([-1], [cljs.core.ObjMap.fromObject(["\ufdd0'children"], {"\ufdd0'children":cljs.core.ObjMap.EMPTY})]);
  var escaping__18703 = false;
  var in_word__18704 = false;
  while(true) {
    var a__18705 = cljs.core.nth.call(null, s__18696, i__18697, null);
    var j__18706 = i__18697 + 1;
    var o__18707 = cljs.core.peek.call(null, openings__18699);
    if(cljs.core.truth_(function() {
      var and__3822__auto____18708 = a__18705 == null;
      if(and__3822__auto____18708) {
        return in_word__18704
      }else {
        return and__3822__auto____18708
      }
    }())) {
      return cljs.core.ObjMap.fromObject(["\ufdd0'chars", "\ufdd0'families"], {"\ufdd0'chars":t__18701, "\ufdd0'families":cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([-1, "\ufdd0'closer"], true), i__18697 - 1), cljs.core.PersistentVector.fromArray([-1, "\ufdd0'children", start__18700], true), i__18697 - 1)})
    }else {
      if(a__18705 == null) {
        return cljs.core.ObjMap.fromObject(["\ufdd0'chars", "\ufdd0'families"], {"\ufdd0'chars":t__18701, "\ufdd0'families":cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([-1, "\ufdd0'closer"], true), i__18697 - 1)})
      }else {
        if(function() {
          var and__3822__auto____18709 = cljs.core.not_EQ_.call(null, subpar.core.cmmnt, mode__18698);
          if(and__3822__auto____18709) {
            var and__3822__auto____18710 = cljs.core._EQ_.call(null, "\\", a__18705);
            if(and__3822__auto____18710) {
              var and__3822__auto____18711 = cljs.core.not.call(null, escaping__18703);
              if(and__3822__auto____18711) {
                return cljs.core.not.call(null, in_word__18704)
              }else {
                return and__3822__auto____18711
              }
            }else {
              return and__3822__auto____18710
            }
          }else {
            return and__3822__auto____18709
          }
        }()) {
          var G__18734 = j__18706;
          var G__18735 = mode__18698;
          var G__18736 = openings__18699;
          var G__18737 = i__18697;
          var G__18738 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
          var G__18739 = cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'children", i__18697], true), j__18706);
          var G__18740 = true;
          var G__18741 = true;
          i__18697 = G__18734;
          mode__18698 = G__18735;
          openings__18699 = G__18736;
          start__18700 = G__18737;
          t__18701 = G__18738;
          families__18702 = G__18739;
          escaping__18703 = G__18740;
          in_word__18704 = G__18741;
          continue
        }else {
          if(function() {
            var and__3822__auto____18712 = cljs.core.not_EQ_.call(null, subpar.core.cmmnt, mode__18698);
            if(and__3822__auto____18712) {
              var and__3822__auto____18713 = cljs.core._EQ_.call(null, "\\", a__18705);
              if(and__3822__auto____18713) {
                return cljs.core.not.call(null, escaping__18703)
              }else {
                return and__3822__auto____18713
              }
            }else {
              return and__3822__auto____18712
            }
          }()) {
            var G__18742 = j__18706;
            var G__18743 = mode__18698;
            var G__18744 = openings__18699;
            var G__18745 = i__18697;
            var G__18746 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
            var G__18747 = families__18702;
            var G__18748 = true;
            var G__18749 = true;
            i__18697 = G__18742;
            mode__18698 = G__18743;
            openings__18699 = G__18744;
            start__18700 = G__18745;
            t__18701 = G__18746;
            families__18702 = G__18747;
            escaping__18703 = G__18748;
            in_word__18704 = G__18749;
            continue
          }else {
            if(function() {
              var and__3822__auto____18714 = cljs.core._EQ_.call(null, subpar.core.code, mode__18698);
              if(and__3822__auto____18714) {
                var and__3822__auto____18715 = cljs.core._EQ_.call(null, ";", a__18705);
                if(and__3822__auto____18715) {
                  return cljs.core.not.call(null, escaping__18703)
                }else {
                  return and__3822__auto____18715
                }
              }else {
                return and__3822__auto____18714
              }
            }()) {
              var G__18750 = j__18706;
              var G__18751 = subpar.core.cmmnt;
              var G__18752 = openings__18699;
              var G__18753 = start__18700;
              var G__18754 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
              var G__18755 = families__18702;
              var G__18756 = false;
              var G__18757 = false;
              i__18697 = G__18750;
              mode__18698 = G__18751;
              openings__18699 = G__18752;
              start__18700 = G__18753;
              t__18701 = G__18754;
              families__18702 = G__18755;
              escaping__18703 = G__18756;
              in_word__18704 = G__18757;
              continue
            }else {
              if(function() {
                var and__3822__auto____18716 = cljs.core._EQ_.call(null, subpar.core.cmmnt, mode__18698);
                if(and__3822__auto____18716) {
                  return cljs.core._EQ_.call(null, "\n", a__18705)
                }else {
                  return and__3822__auto____18716
                }
              }()) {
                var G__18758 = j__18706;
                var G__18759 = subpar.core.code;
                var G__18760 = openings__18699;
                var G__18761 = start__18700;
                var G__18762 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                var G__18763 = families__18702;
                var G__18764 = false;
                var G__18765 = false;
                i__18697 = G__18758;
                mode__18698 = G__18759;
                openings__18699 = G__18760;
                start__18700 = G__18761;
                t__18701 = G__18762;
                families__18702 = G__18763;
                escaping__18703 = G__18764;
                in_word__18704 = G__18765;
                continue
              }else {
                if(cljs.core._EQ_.call(null, subpar.core.cmmnt, mode__18698)) {
                  var G__18766 = j__18706;
                  var G__18767 = subpar.core.cmmnt;
                  var G__18768 = openings__18699;
                  var G__18769 = start__18700;
                  var G__18770 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                  var G__18771 = families__18702;
                  var G__18772 = false;
                  var G__18773 = false;
                  i__18697 = G__18766;
                  mode__18698 = G__18767;
                  openings__18699 = G__18768;
                  start__18700 = G__18769;
                  t__18701 = G__18770;
                  families__18702 = G__18771;
                  escaping__18703 = G__18772;
                  in_word__18704 = G__18773;
                  continue
                }else {
                  if(function() {
                    var and__3822__auto____18717 = cljs.core._EQ_.call(null, subpar.core.code, mode__18698);
                    if(and__3822__auto____18717) {
                      var and__3822__auto____18718 = cljs.core._EQ_.call(null, '"', a__18705);
                      if(and__3822__auto____18718) {
                        return cljs.core.not.call(null, escaping__18703)
                      }else {
                        return and__3822__auto____18718
                      }
                    }else {
                      return and__3822__auto____18717
                    }
                  }()) {
                    var G__18774 = j__18706;
                    var G__18775 = subpar.core.string;
                    var G__18776 = cljs.core.conj.call(null, openings__18699, i__18697);
                    var G__18777 = -1;
                    var G__18778 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                    var G__18779 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([i__18697, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY), cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'children", i__18697], true), j__18706);
                    var G__18780 = false;
                    var G__18781 = false;
                    i__18697 = G__18774;
                    mode__18698 = G__18775;
                    openings__18699 = G__18776;
                    start__18700 = G__18777;
                    t__18701 = G__18778;
                    families__18702 = G__18779;
                    escaping__18703 = G__18780;
                    in_word__18704 = G__18781;
                    continue
                  }else {
                    if(cljs.core.truth_(function() {
                      var and__3822__auto____18719 = cljs.core._EQ_.call(null, subpar.core.string, mode__18698);
                      if(and__3822__auto____18719) {
                        var and__3822__auto____18720 = cljs.core._EQ_.call(null, '"', a__18705);
                        if(and__3822__auto____18720) {
                          var and__3822__auto____18721 = cljs.core.not.call(null, escaping__18703);
                          if(and__3822__auto____18721) {
                            return in_word__18704
                          }else {
                            return and__3822__auto____18721
                          }
                        }else {
                          return and__3822__auto____18720
                        }
                      }else {
                        return and__3822__auto____18719
                      }
                    }())) {
                      var G__18782 = j__18706;
                      var G__18783 = subpar.core.code;
                      var G__18784 = cljs.core.pop.call(null, openings__18699);
                      var G__18785 = -1;
                      var G__18786 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                      var G__18787 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'closer"], true), i__18697), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__18699), "\ufdd0'children", o__18707], true), i__18697), cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'children", start__18700], true), i__18697 - 1);
                      var G__18788 = false;
                      var G__18789 = false;
                      i__18697 = G__18782;
                      mode__18698 = G__18783;
                      openings__18699 = G__18784;
                      start__18700 = G__18785;
                      t__18701 = G__18786;
                      families__18702 = G__18787;
                      escaping__18703 = G__18788;
                      in_word__18704 = G__18789;
                      continue
                    }else {
                      if(function() {
                        var and__3822__auto____18722 = cljs.core._EQ_.call(null, subpar.core.string, mode__18698);
                        if(and__3822__auto____18722) {
                          var and__3822__auto____18723 = cljs.core._EQ_.call(null, '"', a__18705);
                          if(and__3822__auto____18723) {
                            return cljs.core.not.call(null, escaping__18703)
                          }else {
                            return and__3822__auto____18723
                          }
                        }else {
                          return and__3822__auto____18722
                        }
                      }()) {
                        var G__18790 = j__18706;
                        var G__18791 = subpar.core.code;
                        var G__18792 = cljs.core.pop.call(null, openings__18699);
                        var G__18793 = -1;
                        var G__18794 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                        var G__18795 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'closer"], true), i__18697), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__18699), "\ufdd0'children", o__18707], true), i__18697);
                        var G__18796 = false;
                        var G__18797 = false;
                        i__18697 = G__18790;
                        mode__18698 = G__18791;
                        openings__18699 = G__18792;
                        start__18700 = G__18793;
                        t__18701 = G__18794;
                        families__18702 = G__18795;
                        escaping__18703 = G__18796;
                        in_word__18704 = G__18797;
                        continue
                      }else {
                        if(function() {
                          var and__3822__auto____18724 = cljs.core._EQ_.call(null, subpar.core.string, mode__18698);
                          if(and__3822__auto____18724) {
                            var and__3822__auto____18725 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__18705));
                            if(and__3822__auto____18725) {
                              return cljs.core.not.call(null, in_word__18704)
                            }else {
                              return and__3822__auto____18725
                            }
                          }else {
                            return and__3822__auto____18724
                          }
                        }()) {
                          var G__18798 = j__18706;
                          var G__18799 = subpar.core.string;
                          var G__18800 = openings__18699;
                          var G__18801 = i__18697;
                          var G__18802 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                          var G__18803 = cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'children", i__18697], true), i__18697);
                          var G__18804 = false;
                          var G__18805 = true;
                          i__18697 = G__18798;
                          mode__18698 = G__18799;
                          openings__18699 = G__18800;
                          start__18700 = G__18801;
                          t__18701 = G__18802;
                          families__18702 = G__18803;
                          escaping__18703 = G__18804;
                          in_word__18704 = G__18805;
                          continue
                        }else {
                          if(cljs.core.truth_(function() {
                            var and__3822__auto____18726 = cljs.core._EQ_.call(null, subpar.core.string, mode__18698);
                            if(and__3822__auto____18726) {
                              var and__3822__auto____18727 = subpar.core.whitespace_QMARK_.call(null, a__18705);
                              if(cljs.core.truth_(and__3822__auto____18727)) {
                                return in_word__18704
                              }else {
                                return and__3822__auto____18727
                              }
                            }else {
                              return and__3822__auto____18726
                            }
                          }())) {
                            var G__18806 = j__18706;
                            var G__18807 = subpar.core.string;
                            var G__18808 = openings__18699;
                            var G__18809 = -1;
                            var G__18810 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                            var G__18811 = cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'children", start__18700], true), i__18697 - 1);
                            var G__18812 = false;
                            var G__18813 = false;
                            i__18697 = G__18806;
                            mode__18698 = G__18807;
                            openings__18699 = G__18808;
                            start__18700 = G__18809;
                            t__18701 = G__18810;
                            families__18702 = G__18811;
                            escaping__18703 = G__18812;
                            in_word__18704 = G__18813;
                            continue
                          }else {
                            if(cljs.core._EQ_.call(null, subpar.core.string, mode__18698)) {
                              var G__18814 = j__18706;
                              var G__18815 = subpar.core.string;
                              var G__18816 = openings__18699;
                              var G__18817 = start__18700;
                              var G__18818 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                              var G__18819 = families__18702;
                              var G__18820 = false;
                              var G__18821 = in_word__18704;
                              i__18697 = G__18814;
                              mode__18698 = G__18815;
                              openings__18699 = G__18816;
                              start__18700 = G__18817;
                              t__18701 = G__18818;
                              families__18702 = G__18819;
                              escaping__18703 = G__18820;
                              in_word__18704 = G__18821;
                              continue
                            }else {
                              if(cljs.core.truth_(function() {
                                var and__3822__auto____18728 = subpar.core.opener_QMARK_.call(null, a__18705);
                                if(cljs.core.truth_(and__3822__auto____18728)) {
                                  return in_word__18704
                                }else {
                                  return and__3822__auto____18728
                                }
                              }())) {
                                var G__18822 = j__18706;
                                var G__18823 = subpar.core.code;
                                var G__18824 = cljs.core.conj.call(null, openings__18699, i__18697);
                                var G__18825 = -1;
                                var G__18826 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                                var G__18827 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'children", start__18700], true), i__18697 - 1), cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'children", i__18697], true), i__18697), cljs.core.PersistentVector.fromArray([i__18697, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY);
                                var G__18828 = false;
                                var G__18829 = false;
                                i__18697 = G__18822;
                                mode__18698 = G__18823;
                                openings__18699 = G__18824;
                                start__18700 = G__18825;
                                t__18701 = G__18826;
                                families__18702 = G__18827;
                                escaping__18703 = G__18828;
                                in_word__18704 = G__18829;
                                continue
                              }else {
                                if(cljs.core.truth_(subpar.core.opener_QMARK_.call(null, a__18705))) {
                                  var G__18830 = j__18706;
                                  var G__18831 = subpar.core.code;
                                  var G__18832 = cljs.core.conj.call(null, openings__18699, i__18697);
                                  var G__18833 = -1;
                                  var G__18834 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                                  var G__18835 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'children", i__18697], true), i__18697), cljs.core.PersistentVector.fromArray([i__18697, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY);
                                  var G__18836 = false;
                                  var G__18837 = false;
                                  i__18697 = G__18830;
                                  mode__18698 = G__18831;
                                  openings__18699 = G__18832;
                                  start__18700 = G__18833;
                                  t__18701 = G__18834;
                                  families__18702 = G__18835;
                                  escaping__18703 = G__18836;
                                  in_word__18704 = G__18837;
                                  continue
                                }else {
                                  if(cljs.core.truth_(function() {
                                    var and__3822__auto____18729 = subpar.core.closer_QMARK_.call(null, a__18705);
                                    if(cljs.core.truth_(and__3822__auto____18729)) {
                                      return in_word__18704
                                    }else {
                                      return and__3822__auto____18729
                                    }
                                  }())) {
                                    var G__18838 = j__18706;
                                    var G__18839 = subpar.core.code;
                                    var G__18840 = cljs.core.pop.call(null, openings__18699);
                                    var G__18841 = -1;
                                    var G__18842 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                                    var G__18843 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'children", start__18700], true), i__18697 - 1), cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'closer"], true), i__18697), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__18699), "\ufdd0'children", o__18707], true), i__18697);
                                    var G__18844 = false;
                                    var G__18845 = false;
                                    i__18697 = G__18838;
                                    mode__18698 = G__18839;
                                    openings__18699 = G__18840;
                                    start__18700 = G__18841;
                                    t__18701 = G__18842;
                                    families__18702 = G__18843;
                                    escaping__18703 = G__18844;
                                    in_word__18704 = G__18845;
                                    continue
                                  }else {
                                    if(cljs.core.truth_(subpar.core.closer_QMARK_.call(null, a__18705))) {
                                      var G__18846 = j__18706;
                                      var G__18847 = subpar.core.code;
                                      var G__18848 = cljs.core.pop.call(null, openings__18699);
                                      var G__18849 = -1;
                                      var G__18850 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                                      var G__18851 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'closer"], true), i__18697), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__18699), "\ufdd0'children", o__18707], true), i__18697);
                                      var G__18852 = false;
                                      var G__18853 = false;
                                      i__18697 = G__18846;
                                      mode__18698 = G__18847;
                                      openings__18699 = G__18848;
                                      start__18700 = G__18849;
                                      t__18701 = G__18850;
                                      families__18702 = G__18851;
                                      escaping__18703 = G__18852;
                                      in_word__18704 = G__18853;
                                      continue
                                    }else {
                                      if(function() {
                                        var and__3822__auto____18730 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__18705));
                                        if(and__3822__auto____18730) {
                                          return cljs.core.not.call(null, in_word__18704)
                                        }else {
                                          return and__3822__auto____18730
                                        }
                                      }()) {
                                        var G__18854 = j__18706;
                                        var G__18855 = subpar.core.code;
                                        var G__18856 = openings__18699;
                                        var G__18857 = i__18697;
                                        var G__18858 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                                        var G__18859 = cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'children", i__18697], true), i__18697);
                                        var G__18860 = false;
                                        var G__18861 = true;
                                        i__18697 = G__18854;
                                        mode__18698 = G__18855;
                                        openings__18699 = G__18856;
                                        start__18700 = G__18857;
                                        t__18701 = G__18858;
                                        families__18702 = G__18859;
                                        escaping__18703 = G__18860;
                                        in_word__18704 = G__18861;
                                        continue
                                      }else {
                                        if(cljs.core.truth_(function() {
                                          var and__3822__auto____18731 = subpar.core.whitespace_QMARK_.call(null, a__18705);
                                          if(cljs.core.truth_(and__3822__auto____18731)) {
                                            return in_word__18704
                                          }else {
                                            return and__3822__auto____18731
                                          }
                                        }())) {
                                          var G__18862 = j__18706;
                                          var G__18863 = subpar.core.code;
                                          var G__18864 = openings__18699;
                                          var G__18865 = -1;
                                          var G__18866 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                                          var G__18867 = cljs.core.assoc_in.call(null, families__18702, cljs.core.PersistentVector.fromArray([o__18707, "\ufdd0'children", start__18700], true), i__18697 - 1);
                                          var G__18868 = false;
                                          var G__18869 = false;
                                          i__18697 = G__18862;
                                          mode__18698 = G__18863;
                                          openings__18699 = G__18864;
                                          start__18700 = G__18865;
                                          t__18701 = G__18866;
                                          families__18702 = G__18867;
                                          escaping__18703 = G__18868;
                                          in_word__18704 = G__18869;
                                          continue
                                        }else {
                                          if(cljs.core.truth_(function() {
                                            var and__3822__auto____18732 = subpar.core.whitespace_QMARK_.call(null, a__18705);
                                            if(cljs.core.truth_(and__3822__auto____18732)) {
                                              return cljs.core.not.call(null, in_word__18704)
                                            }else {
                                              return and__3822__auto____18732
                                            }
                                          }())) {
                                            var G__18870 = j__18706;
                                            var G__18871 = subpar.core.code;
                                            var G__18872 = openings__18699;
                                            var G__18873 = -1;
                                            var G__18874 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                                            var G__18875 = families__18702;
                                            var G__18876 = false;
                                            var G__18877 = false;
                                            i__18697 = G__18870;
                                            mode__18698 = G__18871;
                                            openings__18699 = G__18872;
                                            start__18700 = G__18873;
                                            t__18701 = G__18874;
                                            families__18702 = G__18875;
                                            escaping__18703 = G__18876;
                                            in_word__18704 = G__18877;
                                            continue
                                          }else {
                                            if(cljs.core.truth_(function() {
                                              var and__3822__auto____18733 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__18705));
                                              if(and__3822__auto____18733) {
                                                return in_word__18704
                                              }else {
                                                return and__3822__auto____18733
                                              }
                                            }())) {
                                              var G__18878 = j__18706;
                                              var G__18879 = subpar.core.code;
                                              var G__18880 = openings__18699;
                                              var G__18881 = start__18700;
                                              var G__18882 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray([mode__18698, o__18707], true));
                                              var G__18883 = families__18702;
                                              var G__18884 = false;
                                              var G__18885 = true;
                                              i__18697 = G__18878;
                                              mode__18698 = G__18879;
                                              openings__18699 = G__18880;
                                              start__18700 = G__18881;
                                              t__18701 = G__18882;
                                              families__18702 = G__18883;
                                              escaping__18703 = G__18884;
                                              in_word__18704 = G__18885;
                                              continue
                                            }else {
                                              if("\ufdd0'default") {
                                                var G__18886 = j__18706;
                                                var G__18887 = subpar.core.code;
                                                var G__18888 = openings__18699;
                                                var G__18889 = start__18700;
                                                var G__18890 = cljs.core.conj.call(null, t__18701, cljs.core.PersistentVector.fromArray(["?", o__18707], true));
                                                var G__18891 = families__18702;
                                                var G__18892 = escaping__18703;
                                                var G__18893 = in_word__18704;
                                                i__18697 = G__18886;
                                                mode__18698 = G__18887;
                                                openings__18699 = G__18888;
                                                start__18700 = G__18889;
                                                t__18701 = G__18890;
                                                families__18702 = G__18891;
                                                escaping__18703 = G__18892;
                                                in_word__18704 = G__18893;
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
