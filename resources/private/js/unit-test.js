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
  var x__15181 = x == null ? null : x;
  if(p[goog.typeOf(x__15181)]) {
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
    var G__15182__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__15182 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15182__delegate.call(this, array, i, idxs)
    };
    G__15182.cljs$lang$maxFixedArity = 2;
    G__15182.cljs$lang$applyTo = function(arglist__15183) {
      var array = cljs.core.first(arglist__15183);
      var i = cljs.core.first(cljs.core.next(arglist__15183));
      var idxs = cljs.core.rest(cljs.core.next(arglist__15183));
      return G__15182__delegate(array, i, idxs)
    };
    G__15182.cljs$lang$arity$variadic = G__15182__delegate;
    return G__15182
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
      var and__3822__auto____15268 = this$;
      if(and__3822__auto____15268) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____15268
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____15269 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15270 = cljs.core._invoke[goog.typeOf(x__2363__auto____15269)];
        if(or__3824__auto____15270) {
          return or__3824__auto____15270
        }else {
          var or__3824__auto____15271 = cljs.core._invoke["_"];
          if(or__3824__auto____15271) {
            return or__3824__auto____15271
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____15272 = this$;
      if(and__3822__auto____15272) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____15272
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____15273 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15274 = cljs.core._invoke[goog.typeOf(x__2363__auto____15273)];
        if(or__3824__auto____15274) {
          return or__3824__auto____15274
        }else {
          var or__3824__auto____15275 = cljs.core._invoke["_"];
          if(or__3824__auto____15275) {
            return or__3824__auto____15275
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____15276 = this$;
      if(and__3822__auto____15276) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____15276
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____15277 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15278 = cljs.core._invoke[goog.typeOf(x__2363__auto____15277)];
        if(or__3824__auto____15278) {
          return or__3824__auto____15278
        }else {
          var or__3824__auto____15279 = cljs.core._invoke["_"];
          if(or__3824__auto____15279) {
            return or__3824__auto____15279
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____15280 = this$;
      if(and__3822__auto____15280) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____15280
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____15281 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15282 = cljs.core._invoke[goog.typeOf(x__2363__auto____15281)];
        if(or__3824__auto____15282) {
          return or__3824__auto____15282
        }else {
          var or__3824__auto____15283 = cljs.core._invoke["_"];
          if(or__3824__auto____15283) {
            return or__3824__auto____15283
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____15284 = this$;
      if(and__3822__auto____15284) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____15284
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____15285 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15286 = cljs.core._invoke[goog.typeOf(x__2363__auto____15285)];
        if(or__3824__auto____15286) {
          return or__3824__auto____15286
        }else {
          var or__3824__auto____15287 = cljs.core._invoke["_"];
          if(or__3824__auto____15287) {
            return or__3824__auto____15287
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____15288 = this$;
      if(and__3822__auto____15288) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____15288
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____15289 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15290 = cljs.core._invoke[goog.typeOf(x__2363__auto____15289)];
        if(or__3824__auto____15290) {
          return or__3824__auto____15290
        }else {
          var or__3824__auto____15291 = cljs.core._invoke["_"];
          if(or__3824__auto____15291) {
            return or__3824__auto____15291
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____15292 = this$;
      if(and__3822__auto____15292) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____15292
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____15293 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15294 = cljs.core._invoke[goog.typeOf(x__2363__auto____15293)];
        if(or__3824__auto____15294) {
          return or__3824__auto____15294
        }else {
          var or__3824__auto____15295 = cljs.core._invoke["_"];
          if(or__3824__auto____15295) {
            return or__3824__auto____15295
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____15296 = this$;
      if(and__3822__auto____15296) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____15296
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____15297 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15298 = cljs.core._invoke[goog.typeOf(x__2363__auto____15297)];
        if(or__3824__auto____15298) {
          return or__3824__auto____15298
        }else {
          var or__3824__auto____15299 = cljs.core._invoke["_"];
          if(or__3824__auto____15299) {
            return or__3824__auto____15299
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____15300 = this$;
      if(and__3822__auto____15300) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____15300
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____15301 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15302 = cljs.core._invoke[goog.typeOf(x__2363__auto____15301)];
        if(or__3824__auto____15302) {
          return or__3824__auto____15302
        }else {
          var or__3824__auto____15303 = cljs.core._invoke["_"];
          if(or__3824__auto____15303) {
            return or__3824__auto____15303
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____15304 = this$;
      if(and__3822__auto____15304) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____15304
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____15305 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15306 = cljs.core._invoke[goog.typeOf(x__2363__auto____15305)];
        if(or__3824__auto____15306) {
          return or__3824__auto____15306
        }else {
          var or__3824__auto____15307 = cljs.core._invoke["_"];
          if(or__3824__auto____15307) {
            return or__3824__auto____15307
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____15308 = this$;
      if(and__3822__auto____15308) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____15308
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____15309 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15310 = cljs.core._invoke[goog.typeOf(x__2363__auto____15309)];
        if(or__3824__auto____15310) {
          return or__3824__auto____15310
        }else {
          var or__3824__auto____15311 = cljs.core._invoke["_"];
          if(or__3824__auto____15311) {
            return or__3824__auto____15311
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____15312 = this$;
      if(and__3822__auto____15312) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____15312
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____15313 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15314 = cljs.core._invoke[goog.typeOf(x__2363__auto____15313)];
        if(or__3824__auto____15314) {
          return or__3824__auto____15314
        }else {
          var or__3824__auto____15315 = cljs.core._invoke["_"];
          if(or__3824__auto____15315) {
            return or__3824__auto____15315
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____15316 = this$;
      if(and__3822__auto____15316) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____15316
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____15317 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15318 = cljs.core._invoke[goog.typeOf(x__2363__auto____15317)];
        if(or__3824__auto____15318) {
          return or__3824__auto____15318
        }else {
          var or__3824__auto____15319 = cljs.core._invoke["_"];
          if(or__3824__auto____15319) {
            return or__3824__auto____15319
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____15320 = this$;
      if(and__3822__auto____15320) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____15320
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____15321 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15322 = cljs.core._invoke[goog.typeOf(x__2363__auto____15321)];
        if(or__3824__auto____15322) {
          return or__3824__auto____15322
        }else {
          var or__3824__auto____15323 = cljs.core._invoke["_"];
          if(or__3824__auto____15323) {
            return or__3824__auto____15323
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____15324 = this$;
      if(and__3822__auto____15324) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____15324
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____15325 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15326 = cljs.core._invoke[goog.typeOf(x__2363__auto____15325)];
        if(or__3824__auto____15326) {
          return or__3824__auto____15326
        }else {
          var or__3824__auto____15327 = cljs.core._invoke["_"];
          if(or__3824__auto____15327) {
            return or__3824__auto____15327
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____15328 = this$;
      if(and__3822__auto____15328) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____15328
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____15329 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15330 = cljs.core._invoke[goog.typeOf(x__2363__auto____15329)];
        if(or__3824__auto____15330) {
          return or__3824__auto____15330
        }else {
          var or__3824__auto____15331 = cljs.core._invoke["_"];
          if(or__3824__auto____15331) {
            return or__3824__auto____15331
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____15332 = this$;
      if(and__3822__auto____15332) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____15332
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____15333 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15334 = cljs.core._invoke[goog.typeOf(x__2363__auto____15333)];
        if(or__3824__auto____15334) {
          return or__3824__auto____15334
        }else {
          var or__3824__auto____15335 = cljs.core._invoke["_"];
          if(or__3824__auto____15335) {
            return or__3824__auto____15335
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____15336 = this$;
      if(and__3822__auto____15336) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____15336
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____15337 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15338 = cljs.core._invoke[goog.typeOf(x__2363__auto____15337)];
        if(or__3824__auto____15338) {
          return or__3824__auto____15338
        }else {
          var or__3824__auto____15339 = cljs.core._invoke["_"];
          if(or__3824__auto____15339) {
            return or__3824__auto____15339
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____15340 = this$;
      if(and__3822__auto____15340) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____15340
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____15341 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15342 = cljs.core._invoke[goog.typeOf(x__2363__auto____15341)];
        if(or__3824__auto____15342) {
          return or__3824__auto____15342
        }else {
          var or__3824__auto____15343 = cljs.core._invoke["_"];
          if(or__3824__auto____15343) {
            return or__3824__auto____15343
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____15344 = this$;
      if(and__3822__auto____15344) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____15344
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____15345 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15346 = cljs.core._invoke[goog.typeOf(x__2363__auto____15345)];
        if(or__3824__auto____15346) {
          return or__3824__auto____15346
        }else {
          var or__3824__auto____15347 = cljs.core._invoke["_"];
          if(or__3824__auto____15347) {
            return or__3824__auto____15347
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____15348 = this$;
      if(and__3822__auto____15348) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____15348
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____15349 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15350 = cljs.core._invoke[goog.typeOf(x__2363__auto____15349)];
        if(or__3824__auto____15350) {
          return or__3824__auto____15350
        }else {
          var or__3824__auto____15351 = cljs.core._invoke["_"];
          if(or__3824__auto____15351) {
            return or__3824__auto____15351
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
    var and__3822__auto____15356 = coll;
    if(and__3822__auto____15356) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____15356
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____15357 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15358 = cljs.core._count[goog.typeOf(x__2363__auto____15357)];
      if(or__3824__auto____15358) {
        return or__3824__auto____15358
      }else {
        var or__3824__auto____15359 = cljs.core._count["_"];
        if(or__3824__auto____15359) {
          return or__3824__auto____15359
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
    var and__3822__auto____15364 = coll;
    if(and__3822__auto____15364) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____15364
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____15365 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15366 = cljs.core._empty[goog.typeOf(x__2363__auto____15365)];
      if(or__3824__auto____15366) {
        return or__3824__auto____15366
      }else {
        var or__3824__auto____15367 = cljs.core._empty["_"];
        if(or__3824__auto____15367) {
          return or__3824__auto____15367
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
    var and__3822__auto____15372 = coll;
    if(and__3822__auto____15372) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____15372
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____15373 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15374 = cljs.core._conj[goog.typeOf(x__2363__auto____15373)];
      if(or__3824__auto____15374) {
        return or__3824__auto____15374
      }else {
        var or__3824__auto____15375 = cljs.core._conj["_"];
        if(or__3824__auto____15375) {
          return or__3824__auto____15375
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
      var and__3822__auto____15384 = coll;
      if(and__3822__auto____15384) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____15384
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____15385 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____15386 = cljs.core._nth[goog.typeOf(x__2363__auto____15385)];
        if(or__3824__auto____15386) {
          return or__3824__auto____15386
        }else {
          var or__3824__auto____15387 = cljs.core._nth["_"];
          if(or__3824__auto____15387) {
            return or__3824__auto____15387
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____15388 = coll;
      if(and__3822__auto____15388) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____15388
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____15389 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____15390 = cljs.core._nth[goog.typeOf(x__2363__auto____15389)];
        if(or__3824__auto____15390) {
          return or__3824__auto____15390
        }else {
          var or__3824__auto____15391 = cljs.core._nth["_"];
          if(or__3824__auto____15391) {
            return or__3824__auto____15391
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
    var and__3822__auto____15396 = coll;
    if(and__3822__auto____15396) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____15396
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____15397 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15398 = cljs.core._first[goog.typeOf(x__2363__auto____15397)];
      if(or__3824__auto____15398) {
        return or__3824__auto____15398
      }else {
        var or__3824__auto____15399 = cljs.core._first["_"];
        if(or__3824__auto____15399) {
          return or__3824__auto____15399
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____15404 = coll;
    if(and__3822__auto____15404) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____15404
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____15405 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15406 = cljs.core._rest[goog.typeOf(x__2363__auto____15405)];
      if(or__3824__auto____15406) {
        return or__3824__auto____15406
      }else {
        var or__3824__auto____15407 = cljs.core._rest["_"];
        if(or__3824__auto____15407) {
          return or__3824__auto____15407
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
    var and__3822__auto____15412 = coll;
    if(and__3822__auto____15412) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____15412
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____15413 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15414 = cljs.core._next[goog.typeOf(x__2363__auto____15413)];
      if(or__3824__auto____15414) {
        return or__3824__auto____15414
      }else {
        var or__3824__auto____15415 = cljs.core._next["_"];
        if(or__3824__auto____15415) {
          return or__3824__auto____15415
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
      var and__3822__auto____15424 = o;
      if(and__3822__auto____15424) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____15424
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____15425 = o == null ? null : o;
      return function() {
        var or__3824__auto____15426 = cljs.core._lookup[goog.typeOf(x__2363__auto____15425)];
        if(or__3824__auto____15426) {
          return or__3824__auto____15426
        }else {
          var or__3824__auto____15427 = cljs.core._lookup["_"];
          if(or__3824__auto____15427) {
            return or__3824__auto____15427
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____15428 = o;
      if(and__3822__auto____15428) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____15428
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____15429 = o == null ? null : o;
      return function() {
        var or__3824__auto____15430 = cljs.core._lookup[goog.typeOf(x__2363__auto____15429)];
        if(or__3824__auto____15430) {
          return or__3824__auto____15430
        }else {
          var or__3824__auto____15431 = cljs.core._lookup["_"];
          if(or__3824__auto____15431) {
            return or__3824__auto____15431
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
    var and__3822__auto____15436 = coll;
    if(and__3822__auto____15436) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____15436
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____15437 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15438 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____15437)];
      if(or__3824__auto____15438) {
        return or__3824__auto____15438
      }else {
        var or__3824__auto____15439 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____15439) {
          return or__3824__auto____15439
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____15444 = coll;
    if(and__3822__auto____15444) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____15444
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____15445 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15446 = cljs.core._assoc[goog.typeOf(x__2363__auto____15445)];
      if(or__3824__auto____15446) {
        return or__3824__auto____15446
      }else {
        var or__3824__auto____15447 = cljs.core._assoc["_"];
        if(or__3824__auto____15447) {
          return or__3824__auto____15447
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
    var and__3822__auto____15452 = coll;
    if(and__3822__auto____15452) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____15452
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____15453 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15454 = cljs.core._dissoc[goog.typeOf(x__2363__auto____15453)];
      if(or__3824__auto____15454) {
        return or__3824__auto____15454
      }else {
        var or__3824__auto____15455 = cljs.core._dissoc["_"];
        if(or__3824__auto____15455) {
          return or__3824__auto____15455
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
    var and__3822__auto____15460 = coll;
    if(and__3822__auto____15460) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____15460
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____15461 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15462 = cljs.core._key[goog.typeOf(x__2363__auto____15461)];
      if(or__3824__auto____15462) {
        return or__3824__auto____15462
      }else {
        var or__3824__auto____15463 = cljs.core._key["_"];
        if(or__3824__auto____15463) {
          return or__3824__auto____15463
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____15468 = coll;
    if(and__3822__auto____15468) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____15468
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____15469 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15470 = cljs.core._val[goog.typeOf(x__2363__auto____15469)];
      if(or__3824__auto____15470) {
        return or__3824__auto____15470
      }else {
        var or__3824__auto____15471 = cljs.core._val["_"];
        if(or__3824__auto____15471) {
          return or__3824__auto____15471
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
    var and__3822__auto____15476 = coll;
    if(and__3822__auto____15476) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____15476
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____15477 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15478 = cljs.core._disjoin[goog.typeOf(x__2363__auto____15477)];
      if(or__3824__auto____15478) {
        return or__3824__auto____15478
      }else {
        var or__3824__auto____15479 = cljs.core._disjoin["_"];
        if(or__3824__auto____15479) {
          return or__3824__auto____15479
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
    var and__3822__auto____15484 = coll;
    if(and__3822__auto____15484) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____15484
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____15485 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15486 = cljs.core._peek[goog.typeOf(x__2363__auto____15485)];
      if(or__3824__auto____15486) {
        return or__3824__auto____15486
      }else {
        var or__3824__auto____15487 = cljs.core._peek["_"];
        if(or__3824__auto____15487) {
          return or__3824__auto____15487
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____15492 = coll;
    if(and__3822__auto____15492) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____15492
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____15493 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15494 = cljs.core._pop[goog.typeOf(x__2363__auto____15493)];
      if(or__3824__auto____15494) {
        return or__3824__auto____15494
      }else {
        var or__3824__auto____15495 = cljs.core._pop["_"];
        if(or__3824__auto____15495) {
          return or__3824__auto____15495
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
    var and__3822__auto____15500 = coll;
    if(and__3822__auto____15500) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____15500
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____15501 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15502 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____15501)];
      if(or__3824__auto____15502) {
        return or__3824__auto____15502
      }else {
        var or__3824__auto____15503 = cljs.core._assoc_n["_"];
        if(or__3824__auto____15503) {
          return or__3824__auto____15503
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
    var and__3822__auto____15508 = o;
    if(and__3822__auto____15508) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____15508
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____15509 = o == null ? null : o;
    return function() {
      var or__3824__auto____15510 = cljs.core._deref[goog.typeOf(x__2363__auto____15509)];
      if(or__3824__auto____15510) {
        return or__3824__auto____15510
      }else {
        var or__3824__auto____15511 = cljs.core._deref["_"];
        if(or__3824__auto____15511) {
          return or__3824__auto____15511
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
    var and__3822__auto____15516 = o;
    if(and__3822__auto____15516) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____15516
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____15517 = o == null ? null : o;
    return function() {
      var or__3824__auto____15518 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____15517)];
      if(or__3824__auto____15518) {
        return or__3824__auto____15518
      }else {
        var or__3824__auto____15519 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____15519) {
          return or__3824__auto____15519
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
    var and__3822__auto____15524 = o;
    if(and__3822__auto____15524) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____15524
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____15525 = o == null ? null : o;
    return function() {
      var or__3824__auto____15526 = cljs.core._meta[goog.typeOf(x__2363__auto____15525)];
      if(or__3824__auto____15526) {
        return or__3824__auto____15526
      }else {
        var or__3824__auto____15527 = cljs.core._meta["_"];
        if(or__3824__auto____15527) {
          return or__3824__auto____15527
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
    var and__3822__auto____15532 = o;
    if(and__3822__auto____15532) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____15532
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____15533 = o == null ? null : o;
    return function() {
      var or__3824__auto____15534 = cljs.core._with_meta[goog.typeOf(x__2363__auto____15533)];
      if(or__3824__auto____15534) {
        return or__3824__auto____15534
      }else {
        var or__3824__auto____15535 = cljs.core._with_meta["_"];
        if(or__3824__auto____15535) {
          return or__3824__auto____15535
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
      var and__3822__auto____15544 = coll;
      if(and__3822__auto____15544) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____15544
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____15545 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____15546 = cljs.core._reduce[goog.typeOf(x__2363__auto____15545)];
        if(or__3824__auto____15546) {
          return or__3824__auto____15546
        }else {
          var or__3824__auto____15547 = cljs.core._reduce["_"];
          if(or__3824__auto____15547) {
            return or__3824__auto____15547
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____15548 = coll;
      if(and__3822__auto____15548) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____15548
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____15549 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____15550 = cljs.core._reduce[goog.typeOf(x__2363__auto____15549)];
        if(or__3824__auto____15550) {
          return or__3824__auto____15550
        }else {
          var or__3824__auto____15551 = cljs.core._reduce["_"];
          if(or__3824__auto____15551) {
            return or__3824__auto____15551
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
    var and__3822__auto____15556 = coll;
    if(and__3822__auto____15556) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____15556
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____15557 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15558 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____15557)];
      if(or__3824__auto____15558) {
        return or__3824__auto____15558
      }else {
        var or__3824__auto____15559 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____15559) {
          return or__3824__auto____15559
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
    var and__3822__auto____15564 = o;
    if(and__3822__auto____15564) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____15564
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____15565 = o == null ? null : o;
    return function() {
      var or__3824__auto____15566 = cljs.core._equiv[goog.typeOf(x__2363__auto____15565)];
      if(or__3824__auto____15566) {
        return or__3824__auto____15566
      }else {
        var or__3824__auto____15567 = cljs.core._equiv["_"];
        if(or__3824__auto____15567) {
          return or__3824__auto____15567
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
    var and__3822__auto____15572 = o;
    if(and__3822__auto____15572) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____15572
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____15573 = o == null ? null : o;
    return function() {
      var or__3824__auto____15574 = cljs.core._hash[goog.typeOf(x__2363__auto____15573)];
      if(or__3824__auto____15574) {
        return or__3824__auto____15574
      }else {
        var or__3824__auto____15575 = cljs.core._hash["_"];
        if(or__3824__auto____15575) {
          return or__3824__auto____15575
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
    var and__3822__auto____15580 = o;
    if(and__3822__auto____15580) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____15580
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____15581 = o == null ? null : o;
    return function() {
      var or__3824__auto____15582 = cljs.core._seq[goog.typeOf(x__2363__auto____15581)];
      if(or__3824__auto____15582) {
        return or__3824__auto____15582
      }else {
        var or__3824__auto____15583 = cljs.core._seq["_"];
        if(or__3824__auto____15583) {
          return or__3824__auto____15583
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
    var and__3822__auto____15588 = coll;
    if(and__3822__auto____15588) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____15588
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____15589 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15590 = cljs.core._rseq[goog.typeOf(x__2363__auto____15589)];
      if(or__3824__auto____15590) {
        return or__3824__auto____15590
      }else {
        var or__3824__auto____15591 = cljs.core._rseq["_"];
        if(or__3824__auto____15591) {
          return or__3824__auto____15591
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
    var and__3822__auto____15596 = coll;
    if(and__3822__auto____15596) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____15596
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____15597 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15598 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____15597)];
      if(or__3824__auto____15598) {
        return or__3824__auto____15598
      }else {
        var or__3824__auto____15599 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____15599) {
          return or__3824__auto____15599
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____15604 = coll;
    if(and__3822__auto____15604) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____15604
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____15605 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15606 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____15605)];
      if(or__3824__auto____15606) {
        return or__3824__auto____15606
      }else {
        var or__3824__auto____15607 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____15607) {
          return or__3824__auto____15607
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____15612 = coll;
    if(and__3822__auto____15612) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____15612
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____15613 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15614 = cljs.core._entry_key[goog.typeOf(x__2363__auto____15613)];
      if(or__3824__auto____15614) {
        return or__3824__auto____15614
      }else {
        var or__3824__auto____15615 = cljs.core._entry_key["_"];
        if(or__3824__auto____15615) {
          return or__3824__auto____15615
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____15620 = coll;
    if(and__3822__auto____15620) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____15620
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____15621 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15622 = cljs.core._comparator[goog.typeOf(x__2363__auto____15621)];
      if(or__3824__auto____15622) {
        return or__3824__auto____15622
      }else {
        var or__3824__auto____15623 = cljs.core._comparator["_"];
        if(or__3824__auto____15623) {
          return or__3824__auto____15623
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
    var and__3822__auto____15628 = o;
    if(and__3822__auto____15628) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____15628
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____15629 = o == null ? null : o;
    return function() {
      var or__3824__auto____15630 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____15629)];
      if(or__3824__auto____15630) {
        return or__3824__auto____15630
      }else {
        var or__3824__auto____15631 = cljs.core._pr_seq["_"];
        if(or__3824__auto____15631) {
          return or__3824__auto____15631
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
    var and__3822__auto____15636 = d;
    if(and__3822__auto____15636) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____15636
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____15637 = d == null ? null : d;
    return function() {
      var or__3824__auto____15638 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____15637)];
      if(or__3824__auto____15638) {
        return or__3824__auto____15638
      }else {
        var or__3824__auto____15639 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____15639) {
          return or__3824__auto____15639
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
    var and__3822__auto____15644 = this$;
    if(and__3822__auto____15644) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____15644
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____15645 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____15646 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____15645)];
      if(or__3824__auto____15646) {
        return or__3824__auto____15646
      }else {
        var or__3824__auto____15647 = cljs.core._notify_watches["_"];
        if(or__3824__auto____15647) {
          return or__3824__auto____15647
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____15652 = this$;
    if(and__3822__auto____15652) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____15652
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____15653 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____15654 = cljs.core._add_watch[goog.typeOf(x__2363__auto____15653)];
      if(or__3824__auto____15654) {
        return or__3824__auto____15654
      }else {
        var or__3824__auto____15655 = cljs.core._add_watch["_"];
        if(or__3824__auto____15655) {
          return or__3824__auto____15655
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____15660 = this$;
    if(and__3822__auto____15660) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____15660
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____15661 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____15662 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____15661)];
      if(or__3824__auto____15662) {
        return or__3824__auto____15662
      }else {
        var or__3824__auto____15663 = cljs.core._remove_watch["_"];
        if(or__3824__auto____15663) {
          return or__3824__auto____15663
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
    var and__3822__auto____15668 = coll;
    if(and__3822__auto____15668) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____15668
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____15669 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15670 = cljs.core._as_transient[goog.typeOf(x__2363__auto____15669)];
      if(or__3824__auto____15670) {
        return or__3824__auto____15670
      }else {
        var or__3824__auto____15671 = cljs.core._as_transient["_"];
        if(or__3824__auto____15671) {
          return or__3824__auto____15671
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
    var and__3822__auto____15676 = tcoll;
    if(and__3822__auto____15676) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____15676
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____15677 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15678 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____15677)];
      if(or__3824__auto____15678) {
        return or__3824__auto____15678
      }else {
        var or__3824__auto____15679 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____15679) {
          return or__3824__auto____15679
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____15684 = tcoll;
    if(and__3822__auto____15684) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____15684
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____15685 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15686 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____15685)];
      if(or__3824__auto____15686) {
        return or__3824__auto____15686
      }else {
        var or__3824__auto____15687 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____15687) {
          return or__3824__auto____15687
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
    var and__3822__auto____15692 = tcoll;
    if(and__3822__auto____15692) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____15692
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____15693 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15694 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____15693)];
      if(or__3824__auto____15694) {
        return or__3824__auto____15694
      }else {
        var or__3824__auto____15695 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____15695) {
          return or__3824__auto____15695
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
    var and__3822__auto____15700 = tcoll;
    if(and__3822__auto____15700) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____15700
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____15701 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15702 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____15701)];
      if(or__3824__auto____15702) {
        return or__3824__auto____15702
      }else {
        var or__3824__auto____15703 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____15703) {
          return or__3824__auto____15703
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
    var and__3822__auto____15708 = tcoll;
    if(and__3822__auto____15708) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____15708
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____15709 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15710 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____15709)];
      if(or__3824__auto____15710) {
        return or__3824__auto____15710
      }else {
        var or__3824__auto____15711 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____15711) {
          return or__3824__auto____15711
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____15716 = tcoll;
    if(and__3822__auto____15716) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____15716
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____15717 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15718 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____15717)];
      if(or__3824__auto____15718) {
        return or__3824__auto____15718
      }else {
        var or__3824__auto____15719 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____15719) {
          return or__3824__auto____15719
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
    var and__3822__auto____15724 = tcoll;
    if(and__3822__auto____15724) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____15724
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____15725 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15726 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____15725)];
      if(or__3824__auto____15726) {
        return or__3824__auto____15726
      }else {
        var or__3824__auto____15727 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____15727) {
          return or__3824__auto____15727
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
    var and__3822__auto____15732 = x;
    if(and__3822__auto____15732) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____15732
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____15733 = x == null ? null : x;
    return function() {
      var or__3824__auto____15734 = cljs.core._compare[goog.typeOf(x__2363__auto____15733)];
      if(or__3824__auto____15734) {
        return or__3824__auto____15734
      }else {
        var or__3824__auto____15735 = cljs.core._compare["_"];
        if(or__3824__auto____15735) {
          return or__3824__auto____15735
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
    var and__3822__auto____15740 = coll;
    if(and__3822__auto____15740) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____15740
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____15741 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15742 = cljs.core._drop_first[goog.typeOf(x__2363__auto____15741)];
      if(or__3824__auto____15742) {
        return or__3824__auto____15742
      }else {
        var or__3824__auto____15743 = cljs.core._drop_first["_"];
        if(or__3824__auto____15743) {
          return or__3824__auto____15743
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
    var and__3822__auto____15748 = coll;
    if(and__3822__auto____15748) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____15748
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____15749 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15750 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____15749)];
      if(or__3824__auto____15750) {
        return or__3824__auto____15750
      }else {
        var or__3824__auto____15751 = cljs.core._chunked_first["_"];
        if(or__3824__auto____15751) {
          return or__3824__auto____15751
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____15756 = coll;
    if(and__3822__auto____15756) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____15756
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____15757 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15758 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____15757)];
      if(or__3824__auto____15758) {
        return or__3824__auto____15758
      }else {
        var or__3824__auto____15759 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____15759) {
          return or__3824__auto____15759
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
    var and__3822__auto____15764 = coll;
    if(and__3822__auto____15764) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____15764
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____15765 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15766 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____15765)];
      if(or__3824__auto____15766) {
        return or__3824__auto____15766
      }else {
        var or__3824__auto____15767 = cljs.core._chunked_next["_"];
        if(or__3824__auto____15767) {
          return or__3824__auto____15767
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
    var or__3824__auto____15769 = x === y;
    if(or__3824__auto____15769) {
      return or__3824__auto____15769
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__15770__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__15771 = y;
            var G__15772 = cljs.core.first.call(null, more);
            var G__15773 = cljs.core.next.call(null, more);
            x = G__15771;
            y = G__15772;
            more = G__15773;
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
    var G__15770 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15770__delegate.call(this, x, y, more)
    };
    G__15770.cljs$lang$maxFixedArity = 2;
    G__15770.cljs$lang$applyTo = function(arglist__15774) {
      var x = cljs.core.first(arglist__15774);
      var y = cljs.core.first(cljs.core.next(arglist__15774));
      var more = cljs.core.rest(cljs.core.next(arglist__15774));
      return G__15770__delegate(x, y, more)
    };
    G__15770.cljs$lang$arity$variadic = G__15770__delegate;
    return G__15770
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
  var G__15775 = null;
  var G__15775__2 = function(o, k) {
    return null
  };
  var G__15775__3 = function(o, k, not_found) {
    return not_found
  };
  G__15775 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15775__2.call(this, o, k);
      case 3:
        return G__15775__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15775
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
  var G__15776 = null;
  var G__15776__2 = function(_, f) {
    return f.call(null)
  };
  var G__15776__3 = function(_, f, start) {
    return start
  };
  G__15776 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__15776__2.call(this, _, f);
      case 3:
        return G__15776__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15776
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
  var G__15777 = null;
  var G__15777__2 = function(_, n) {
    return null
  };
  var G__15777__3 = function(_, n, not_found) {
    return not_found
  };
  G__15777 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15777__2.call(this, _, n);
      case 3:
        return G__15777__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15777
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
  var and__3822__auto____15778 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____15778) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____15778
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
    var cnt__15791 = cljs.core._count.call(null, cicoll);
    if(cnt__15791 === 0) {
      return f.call(null)
    }else {
      var val__15792 = cljs.core._nth.call(null, cicoll, 0);
      var n__15793 = 1;
      while(true) {
        if(n__15793 < cnt__15791) {
          var nval__15794 = f.call(null, val__15792, cljs.core._nth.call(null, cicoll, n__15793));
          if(cljs.core.reduced_QMARK_.call(null, nval__15794)) {
            return cljs.core.deref.call(null, nval__15794)
          }else {
            var G__15803 = nval__15794;
            var G__15804 = n__15793 + 1;
            val__15792 = G__15803;
            n__15793 = G__15804;
            continue
          }
        }else {
          return val__15792
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__15795 = cljs.core._count.call(null, cicoll);
    var val__15796 = val;
    var n__15797 = 0;
    while(true) {
      if(n__15797 < cnt__15795) {
        var nval__15798 = f.call(null, val__15796, cljs.core._nth.call(null, cicoll, n__15797));
        if(cljs.core.reduced_QMARK_.call(null, nval__15798)) {
          return cljs.core.deref.call(null, nval__15798)
        }else {
          var G__15805 = nval__15798;
          var G__15806 = n__15797 + 1;
          val__15796 = G__15805;
          n__15797 = G__15806;
          continue
        }
      }else {
        return val__15796
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__15799 = cljs.core._count.call(null, cicoll);
    var val__15800 = val;
    var n__15801 = idx;
    while(true) {
      if(n__15801 < cnt__15799) {
        var nval__15802 = f.call(null, val__15800, cljs.core._nth.call(null, cicoll, n__15801));
        if(cljs.core.reduced_QMARK_.call(null, nval__15802)) {
          return cljs.core.deref.call(null, nval__15802)
        }else {
          var G__15807 = nval__15802;
          var G__15808 = n__15801 + 1;
          val__15800 = G__15807;
          n__15801 = G__15808;
          continue
        }
      }else {
        return val__15800
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
    var cnt__15821 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__15822 = arr[0];
      var n__15823 = 1;
      while(true) {
        if(n__15823 < cnt__15821) {
          var nval__15824 = f.call(null, val__15822, arr[n__15823]);
          if(cljs.core.reduced_QMARK_.call(null, nval__15824)) {
            return cljs.core.deref.call(null, nval__15824)
          }else {
            var G__15833 = nval__15824;
            var G__15834 = n__15823 + 1;
            val__15822 = G__15833;
            n__15823 = G__15834;
            continue
          }
        }else {
          return val__15822
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__15825 = arr.length;
    var val__15826 = val;
    var n__15827 = 0;
    while(true) {
      if(n__15827 < cnt__15825) {
        var nval__15828 = f.call(null, val__15826, arr[n__15827]);
        if(cljs.core.reduced_QMARK_.call(null, nval__15828)) {
          return cljs.core.deref.call(null, nval__15828)
        }else {
          var G__15835 = nval__15828;
          var G__15836 = n__15827 + 1;
          val__15826 = G__15835;
          n__15827 = G__15836;
          continue
        }
      }else {
        return val__15826
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__15829 = arr.length;
    var val__15830 = val;
    var n__15831 = idx;
    while(true) {
      if(n__15831 < cnt__15829) {
        var nval__15832 = f.call(null, val__15830, arr[n__15831]);
        if(cljs.core.reduced_QMARK_.call(null, nval__15832)) {
          return cljs.core.deref.call(null, nval__15832)
        }else {
          var G__15837 = nval__15832;
          var G__15838 = n__15831 + 1;
          val__15830 = G__15837;
          n__15831 = G__15838;
          continue
        }
      }else {
        return val__15830
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
  var this__15839 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__15840 = this;
  if(this__15840.i + 1 < this__15840.a.length) {
    return new cljs.core.IndexedSeq(this__15840.a, this__15840.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15841 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__15842 = this;
  var c__15843 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__15843 > 0) {
    return new cljs.core.RSeq(coll, c__15843 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__15844 = this;
  var this__15845 = this;
  return cljs.core.pr_str.call(null, this__15845)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__15846 = this;
  if(cljs.core.counted_QMARK_.call(null, this__15846.a)) {
    return cljs.core.ci_reduce.call(null, this__15846.a, f, this__15846.a[this__15846.i], this__15846.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__15846.a[this__15846.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__15847 = this;
  if(cljs.core.counted_QMARK_.call(null, this__15847.a)) {
    return cljs.core.ci_reduce.call(null, this__15847.a, f, start, this__15847.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__15848 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__15849 = this;
  return this__15849.a.length - this__15849.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__15850 = this;
  return this__15850.a[this__15850.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__15851 = this;
  if(this__15851.i + 1 < this__15851.a.length) {
    return new cljs.core.IndexedSeq(this__15851.a, this__15851.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15852 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15853 = this;
  var i__15854 = n + this__15853.i;
  if(i__15854 < this__15853.a.length) {
    return this__15853.a[i__15854]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15855 = this;
  var i__15856 = n + this__15855.i;
  if(i__15856 < this__15855.a.length) {
    return this__15855.a[i__15856]
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
  var G__15857 = null;
  var G__15857__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__15857__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__15857 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__15857__2.call(this, array, f);
      case 3:
        return G__15857__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15857
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__15858 = null;
  var G__15858__2 = function(array, k) {
    return array[k]
  };
  var G__15858__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__15858 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15858__2.call(this, array, k);
      case 3:
        return G__15858__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15858
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__15859 = null;
  var G__15859__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__15859__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__15859 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15859__2.call(this, array, n);
      case 3:
        return G__15859__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15859
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
  var this__15860 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15861 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__15862 = this;
  var this__15863 = this;
  return cljs.core.pr_str.call(null, this__15863)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15864 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15865 = this;
  return this__15865.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15866 = this;
  return cljs.core._nth.call(null, this__15866.ci, this__15866.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15867 = this;
  if(this__15867.i > 0) {
    return new cljs.core.RSeq(this__15867.ci, this__15867.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15868 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__15869 = this;
  return new cljs.core.RSeq(this__15869.ci, this__15869.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15870 = this;
  return this__15870.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__15874__15875 = coll;
      if(G__15874__15875) {
        if(function() {
          var or__3824__auto____15876 = G__15874__15875.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____15876) {
            return or__3824__auto____15876
          }else {
            return G__15874__15875.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__15874__15875.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__15874__15875)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__15874__15875)
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
      var G__15881__15882 = coll;
      if(G__15881__15882) {
        if(function() {
          var or__3824__auto____15883 = G__15881__15882.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____15883) {
            return or__3824__auto____15883
          }else {
            return G__15881__15882.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__15881__15882.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15881__15882)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15881__15882)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__15884 = cljs.core.seq.call(null, coll);
      if(s__15884 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__15884)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__15889__15890 = coll;
      if(G__15889__15890) {
        if(function() {
          var or__3824__auto____15891 = G__15889__15890.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____15891) {
            return or__3824__auto____15891
          }else {
            return G__15889__15890.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__15889__15890.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15889__15890)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15889__15890)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__15892 = cljs.core.seq.call(null, coll);
      if(!(s__15892 == null)) {
        return cljs.core._rest.call(null, s__15892)
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
      var G__15896__15897 = coll;
      if(G__15896__15897) {
        if(function() {
          var or__3824__auto____15898 = G__15896__15897.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____15898) {
            return or__3824__auto____15898
          }else {
            return G__15896__15897.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__15896__15897.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__15896__15897)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__15896__15897)
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
    var sn__15900 = cljs.core.next.call(null, s);
    if(!(sn__15900 == null)) {
      var G__15901 = sn__15900;
      s = G__15901;
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
    var G__15902__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__15903 = conj.call(null, coll, x);
          var G__15904 = cljs.core.first.call(null, xs);
          var G__15905 = cljs.core.next.call(null, xs);
          coll = G__15903;
          x = G__15904;
          xs = G__15905;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__15902 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15902__delegate.call(this, coll, x, xs)
    };
    G__15902.cljs$lang$maxFixedArity = 2;
    G__15902.cljs$lang$applyTo = function(arglist__15906) {
      var coll = cljs.core.first(arglist__15906);
      var x = cljs.core.first(cljs.core.next(arglist__15906));
      var xs = cljs.core.rest(cljs.core.next(arglist__15906));
      return G__15902__delegate(coll, x, xs)
    };
    G__15902.cljs$lang$arity$variadic = G__15902__delegate;
    return G__15902
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
  var s__15909 = cljs.core.seq.call(null, coll);
  var acc__15910 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__15909)) {
      return acc__15910 + cljs.core._count.call(null, s__15909)
    }else {
      var G__15911 = cljs.core.next.call(null, s__15909);
      var G__15912 = acc__15910 + 1;
      s__15909 = G__15911;
      acc__15910 = G__15912;
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
        var G__15919__15920 = coll;
        if(G__15919__15920) {
          if(function() {
            var or__3824__auto____15921 = G__15919__15920.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____15921) {
              return or__3824__auto____15921
            }else {
              return G__15919__15920.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__15919__15920.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15919__15920)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15919__15920)
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
        var G__15922__15923 = coll;
        if(G__15922__15923) {
          if(function() {
            var or__3824__auto____15924 = G__15922__15923.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____15924) {
              return or__3824__auto____15924
            }else {
              return G__15922__15923.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__15922__15923.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15922__15923)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15922__15923)
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
    var G__15927__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__15926 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__15928 = ret__15926;
          var G__15929 = cljs.core.first.call(null, kvs);
          var G__15930 = cljs.core.second.call(null, kvs);
          var G__15931 = cljs.core.nnext.call(null, kvs);
          coll = G__15928;
          k = G__15929;
          v = G__15930;
          kvs = G__15931;
          continue
        }else {
          return ret__15926
        }
        break
      }
    };
    var G__15927 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15927__delegate.call(this, coll, k, v, kvs)
    };
    G__15927.cljs$lang$maxFixedArity = 3;
    G__15927.cljs$lang$applyTo = function(arglist__15932) {
      var coll = cljs.core.first(arglist__15932);
      var k = cljs.core.first(cljs.core.next(arglist__15932));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15932)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15932)));
      return G__15927__delegate(coll, k, v, kvs)
    };
    G__15927.cljs$lang$arity$variadic = G__15927__delegate;
    return G__15927
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
    var G__15935__delegate = function(coll, k, ks) {
      while(true) {
        var ret__15934 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__15936 = ret__15934;
          var G__15937 = cljs.core.first.call(null, ks);
          var G__15938 = cljs.core.next.call(null, ks);
          coll = G__15936;
          k = G__15937;
          ks = G__15938;
          continue
        }else {
          return ret__15934
        }
        break
      }
    };
    var G__15935 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15935__delegate.call(this, coll, k, ks)
    };
    G__15935.cljs$lang$maxFixedArity = 2;
    G__15935.cljs$lang$applyTo = function(arglist__15939) {
      var coll = cljs.core.first(arglist__15939);
      var k = cljs.core.first(cljs.core.next(arglist__15939));
      var ks = cljs.core.rest(cljs.core.next(arglist__15939));
      return G__15935__delegate(coll, k, ks)
    };
    G__15935.cljs$lang$arity$variadic = G__15935__delegate;
    return G__15935
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
    var G__15943__15944 = o;
    if(G__15943__15944) {
      if(function() {
        var or__3824__auto____15945 = G__15943__15944.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____15945) {
          return or__3824__auto____15945
        }else {
          return G__15943__15944.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__15943__15944.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__15943__15944)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__15943__15944)
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
    var G__15948__delegate = function(coll, k, ks) {
      while(true) {
        var ret__15947 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__15949 = ret__15947;
          var G__15950 = cljs.core.first.call(null, ks);
          var G__15951 = cljs.core.next.call(null, ks);
          coll = G__15949;
          k = G__15950;
          ks = G__15951;
          continue
        }else {
          return ret__15947
        }
        break
      }
    };
    var G__15948 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15948__delegate.call(this, coll, k, ks)
    };
    G__15948.cljs$lang$maxFixedArity = 2;
    G__15948.cljs$lang$applyTo = function(arglist__15952) {
      var coll = cljs.core.first(arglist__15952);
      var k = cljs.core.first(cljs.core.next(arglist__15952));
      var ks = cljs.core.rest(cljs.core.next(arglist__15952));
      return G__15948__delegate(coll, k, ks)
    };
    G__15948.cljs$lang$arity$variadic = G__15948__delegate;
    return G__15948
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
  var h__15954 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__15954;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__15954
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__15956 = cljs.core.string_hash_cache[k];
  if(!(h__15956 == null)) {
    return h__15956
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
      var and__3822__auto____15958 = goog.isString(o);
      if(and__3822__auto____15958) {
        return check_cache
      }else {
        return and__3822__auto____15958
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
    var G__15962__15963 = x;
    if(G__15962__15963) {
      if(function() {
        var or__3824__auto____15964 = G__15962__15963.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____15964) {
          return or__3824__auto____15964
        }else {
          return G__15962__15963.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__15962__15963.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__15962__15963)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__15962__15963)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__15968__15969 = x;
    if(G__15968__15969) {
      if(function() {
        var or__3824__auto____15970 = G__15968__15969.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____15970) {
          return or__3824__auto____15970
        }else {
          return G__15968__15969.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__15968__15969.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__15968__15969)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__15968__15969)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__15974__15975 = x;
  if(G__15974__15975) {
    if(function() {
      var or__3824__auto____15976 = G__15974__15975.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____15976) {
        return or__3824__auto____15976
      }else {
        return G__15974__15975.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__15974__15975.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__15974__15975)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__15974__15975)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__15980__15981 = x;
  if(G__15980__15981) {
    if(function() {
      var or__3824__auto____15982 = G__15980__15981.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____15982) {
        return or__3824__auto____15982
      }else {
        return G__15980__15981.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__15980__15981.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__15980__15981)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__15980__15981)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__15986__15987 = x;
  if(G__15986__15987) {
    if(function() {
      var or__3824__auto____15988 = G__15986__15987.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____15988) {
        return or__3824__auto____15988
      }else {
        return G__15986__15987.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__15986__15987.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__15986__15987)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__15986__15987)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__15992__15993 = x;
  if(G__15992__15993) {
    if(function() {
      var or__3824__auto____15994 = G__15992__15993.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____15994) {
        return or__3824__auto____15994
      }else {
        return G__15992__15993.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__15992__15993.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15992__15993)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15992__15993)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__15998__15999 = x;
  if(G__15998__15999) {
    if(function() {
      var or__3824__auto____16000 = G__15998__15999.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____16000) {
        return or__3824__auto____16000
      }else {
        return G__15998__15999.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__15998__15999.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15998__15999)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15998__15999)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__16004__16005 = x;
    if(G__16004__16005) {
      if(function() {
        var or__3824__auto____16006 = G__16004__16005.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____16006) {
          return or__3824__auto____16006
        }else {
          return G__16004__16005.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__16004__16005.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__16004__16005)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__16004__16005)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__16010__16011 = x;
  if(G__16010__16011) {
    if(function() {
      var or__3824__auto____16012 = G__16010__16011.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____16012) {
        return or__3824__auto____16012
      }else {
        return G__16010__16011.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__16010__16011.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__16010__16011)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__16010__16011)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__16016__16017 = x;
  if(G__16016__16017) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____16018 = null;
      if(cljs.core.truth_(or__3824__auto____16018)) {
        return or__3824__auto____16018
      }else {
        return G__16016__16017.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__16016__16017.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__16016__16017)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__16016__16017)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__16019__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__16019 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__16019__delegate.call(this, keyvals)
    };
    G__16019.cljs$lang$maxFixedArity = 0;
    G__16019.cljs$lang$applyTo = function(arglist__16020) {
      var keyvals = cljs.core.seq(arglist__16020);
      return G__16019__delegate(keyvals)
    };
    G__16019.cljs$lang$arity$variadic = G__16019__delegate;
    return G__16019
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
  var keys__16022 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__16022.push(key)
  });
  return keys__16022
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__16026 = i;
  var j__16027 = j;
  var len__16028 = len;
  while(true) {
    if(len__16028 === 0) {
      return to
    }else {
      to[j__16027] = from[i__16026];
      var G__16029 = i__16026 + 1;
      var G__16030 = j__16027 + 1;
      var G__16031 = len__16028 - 1;
      i__16026 = G__16029;
      j__16027 = G__16030;
      len__16028 = G__16031;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__16035 = i + (len - 1);
  var j__16036 = j + (len - 1);
  var len__16037 = len;
  while(true) {
    if(len__16037 === 0) {
      return to
    }else {
      to[j__16036] = from[i__16035];
      var G__16038 = i__16035 - 1;
      var G__16039 = j__16036 - 1;
      var G__16040 = len__16037 - 1;
      i__16035 = G__16038;
      j__16036 = G__16039;
      len__16037 = G__16040;
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
    var G__16044__16045 = s;
    if(G__16044__16045) {
      if(function() {
        var or__3824__auto____16046 = G__16044__16045.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____16046) {
          return or__3824__auto____16046
        }else {
          return G__16044__16045.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__16044__16045.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__16044__16045)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__16044__16045)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__16050__16051 = s;
  if(G__16050__16051) {
    if(function() {
      var or__3824__auto____16052 = G__16050__16051.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____16052) {
        return or__3824__auto____16052
      }else {
        return G__16050__16051.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__16050__16051.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__16050__16051)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__16050__16051)
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
  var and__3822__auto____16055 = goog.isString(x);
  if(and__3822__auto____16055) {
    return!function() {
      var or__3824__auto____16056 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____16056) {
        return or__3824__auto____16056
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____16055
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____16058 = goog.isString(x);
  if(and__3822__auto____16058) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____16058
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____16060 = goog.isString(x);
  if(and__3822__auto____16060) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____16060
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____16065 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____16065) {
    return or__3824__auto____16065
  }else {
    var G__16066__16067 = f;
    if(G__16066__16067) {
      if(function() {
        var or__3824__auto____16068 = G__16066__16067.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____16068) {
          return or__3824__auto____16068
        }else {
          return G__16066__16067.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__16066__16067.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__16066__16067)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__16066__16067)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____16070 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____16070) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____16070
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
    var and__3822__auto____16073 = coll;
    if(cljs.core.truth_(and__3822__auto____16073)) {
      var and__3822__auto____16074 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____16074) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____16074
      }
    }else {
      return and__3822__auto____16073
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
    var G__16083__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__16079 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__16080 = more;
        while(true) {
          var x__16081 = cljs.core.first.call(null, xs__16080);
          var etc__16082 = cljs.core.next.call(null, xs__16080);
          if(cljs.core.truth_(xs__16080)) {
            if(cljs.core.contains_QMARK_.call(null, s__16079, x__16081)) {
              return false
            }else {
              var G__16084 = cljs.core.conj.call(null, s__16079, x__16081);
              var G__16085 = etc__16082;
              s__16079 = G__16084;
              xs__16080 = G__16085;
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
    var G__16083 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16083__delegate.call(this, x, y, more)
    };
    G__16083.cljs$lang$maxFixedArity = 2;
    G__16083.cljs$lang$applyTo = function(arglist__16086) {
      var x = cljs.core.first(arglist__16086);
      var y = cljs.core.first(cljs.core.next(arglist__16086));
      var more = cljs.core.rest(cljs.core.next(arglist__16086));
      return G__16083__delegate(x, y, more)
    };
    G__16083.cljs$lang$arity$variadic = G__16083__delegate;
    return G__16083
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
            var G__16090__16091 = x;
            if(G__16090__16091) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____16092 = null;
                if(cljs.core.truth_(or__3824__auto____16092)) {
                  return or__3824__auto____16092
                }else {
                  return G__16090__16091.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__16090__16091.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__16090__16091)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__16090__16091)
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
    var xl__16097 = cljs.core.count.call(null, xs);
    var yl__16098 = cljs.core.count.call(null, ys);
    if(xl__16097 < yl__16098) {
      return-1
    }else {
      if(xl__16097 > yl__16098) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__16097, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__16099 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____16100 = d__16099 === 0;
        if(and__3822__auto____16100) {
          return n + 1 < len
        }else {
          return and__3822__auto____16100
        }
      }()) {
        var G__16101 = xs;
        var G__16102 = ys;
        var G__16103 = len;
        var G__16104 = n + 1;
        xs = G__16101;
        ys = G__16102;
        len = G__16103;
        n = G__16104;
        continue
      }else {
        return d__16099
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
      var r__16106 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__16106)) {
        return r__16106
      }else {
        if(cljs.core.truth_(r__16106)) {
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
      var a__16108 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__16108, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__16108)
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
    var temp__3971__auto____16114 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____16114) {
      var s__16115 = temp__3971__auto____16114;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__16115), cljs.core.next.call(null, s__16115))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__16116 = val;
    var coll__16117 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__16117) {
        var nval__16118 = f.call(null, val__16116, cljs.core.first.call(null, coll__16117));
        if(cljs.core.reduced_QMARK_.call(null, nval__16118)) {
          return cljs.core.deref.call(null, nval__16118)
        }else {
          var G__16119 = nval__16118;
          var G__16120 = cljs.core.next.call(null, coll__16117);
          val__16116 = G__16119;
          coll__16117 = G__16120;
          continue
        }
      }else {
        return val__16116
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
  var a__16122 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__16122);
  return cljs.core.vec.call(null, a__16122)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__16129__16130 = coll;
      if(G__16129__16130) {
        if(function() {
          var or__3824__auto____16131 = G__16129__16130.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____16131) {
            return or__3824__auto____16131
          }else {
            return G__16129__16130.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__16129__16130.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16129__16130)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16129__16130)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__16132__16133 = coll;
      if(G__16132__16133) {
        if(function() {
          var or__3824__auto____16134 = G__16132__16133.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____16134) {
            return or__3824__auto____16134
          }else {
            return G__16132__16133.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__16132__16133.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16132__16133)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16132__16133)
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
  var this__16135 = this;
  return this__16135.val
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
    var G__16136__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__16136 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16136__delegate.call(this, x, y, more)
    };
    G__16136.cljs$lang$maxFixedArity = 2;
    G__16136.cljs$lang$applyTo = function(arglist__16137) {
      var x = cljs.core.first(arglist__16137);
      var y = cljs.core.first(cljs.core.next(arglist__16137));
      var more = cljs.core.rest(cljs.core.next(arglist__16137));
      return G__16136__delegate(x, y, more)
    };
    G__16136.cljs$lang$arity$variadic = G__16136__delegate;
    return G__16136
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
    var G__16138__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__16138 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16138__delegate.call(this, x, y, more)
    };
    G__16138.cljs$lang$maxFixedArity = 2;
    G__16138.cljs$lang$applyTo = function(arglist__16139) {
      var x = cljs.core.first(arglist__16139);
      var y = cljs.core.first(cljs.core.next(arglist__16139));
      var more = cljs.core.rest(cljs.core.next(arglist__16139));
      return G__16138__delegate(x, y, more)
    };
    G__16138.cljs$lang$arity$variadic = G__16138__delegate;
    return G__16138
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
    var G__16140__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__16140 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16140__delegate.call(this, x, y, more)
    };
    G__16140.cljs$lang$maxFixedArity = 2;
    G__16140.cljs$lang$applyTo = function(arglist__16141) {
      var x = cljs.core.first(arglist__16141);
      var y = cljs.core.first(cljs.core.next(arglist__16141));
      var more = cljs.core.rest(cljs.core.next(arglist__16141));
      return G__16140__delegate(x, y, more)
    };
    G__16140.cljs$lang$arity$variadic = G__16140__delegate;
    return G__16140
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
    var G__16142__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__16142 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16142__delegate.call(this, x, y, more)
    };
    G__16142.cljs$lang$maxFixedArity = 2;
    G__16142.cljs$lang$applyTo = function(arglist__16143) {
      var x = cljs.core.first(arglist__16143);
      var y = cljs.core.first(cljs.core.next(arglist__16143));
      var more = cljs.core.rest(cljs.core.next(arglist__16143));
      return G__16142__delegate(x, y, more)
    };
    G__16142.cljs$lang$arity$variadic = G__16142__delegate;
    return G__16142
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
    var G__16144__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__16145 = y;
            var G__16146 = cljs.core.first.call(null, more);
            var G__16147 = cljs.core.next.call(null, more);
            x = G__16145;
            y = G__16146;
            more = G__16147;
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
    var G__16144 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16144__delegate.call(this, x, y, more)
    };
    G__16144.cljs$lang$maxFixedArity = 2;
    G__16144.cljs$lang$applyTo = function(arglist__16148) {
      var x = cljs.core.first(arglist__16148);
      var y = cljs.core.first(cljs.core.next(arglist__16148));
      var more = cljs.core.rest(cljs.core.next(arglist__16148));
      return G__16144__delegate(x, y, more)
    };
    G__16144.cljs$lang$arity$variadic = G__16144__delegate;
    return G__16144
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
    var G__16149__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__16150 = y;
            var G__16151 = cljs.core.first.call(null, more);
            var G__16152 = cljs.core.next.call(null, more);
            x = G__16150;
            y = G__16151;
            more = G__16152;
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
    var G__16149 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16149__delegate.call(this, x, y, more)
    };
    G__16149.cljs$lang$maxFixedArity = 2;
    G__16149.cljs$lang$applyTo = function(arglist__16153) {
      var x = cljs.core.first(arglist__16153);
      var y = cljs.core.first(cljs.core.next(arglist__16153));
      var more = cljs.core.rest(cljs.core.next(arglist__16153));
      return G__16149__delegate(x, y, more)
    };
    G__16149.cljs$lang$arity$variadic = G__16149__delegate;
    return G__16149
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
    var G__16154__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__16155 = y;
            var G__16156 = cljs.core.first.call(null, more);
            var G__16157 = cljs.core.next.call(null, more);
            x = G__16155;
            y = G__16156;
            more = G__16157;
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
    var G__16154 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16154__delegate.call(this, x, y, more)
    };
    G__16154.cljs$lang$maxFixedArity = 2;
    G__16154.cljs$lang$applyTo = function(arglist__16158) {
      var x = cljs.core.first(arglist__16158);
      var y = cljs.core.first(cljs.core.next(arglist__16158));
      var more = cljs.core.rest(cljs.core.next(arglist__16158));
      return G__16154__delegate(x, y, more)
    };
    G__16154.cljs$lang$arity$variadic = G__16154__delegate;
    return G__16154
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
    var G__16159__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__16160 = y;
            var G__16161 = cljs.core.first.call(null, more);
            var G__16162 = cljs.core.next.call(null, more);
            x = G__16160;
            y = G__16161;
            more = G__16162;
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
    var G__16159 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16159__delegate.call(this, x, y, more)
    };
    G__16159.cljs$lang$maxFixedArity = 2;
    G__16159.cljs$lang$applyTo = function(arglist__16163) {
      var x = cljs.core.first(arglist__16163);
      var y = cljs.core.first(cljs.core.next(arglist__16163));
      var more = cljs.core.rest(cljs.core.next(arglist__16163));
      return G__16159__delegate(x, y, more)
    };
    G__16159.cljs$lang$arity$variadic = G__16159__delegate;
    return G__16159
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
    var G__16164__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__16164 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16164__delegate.call(this, x, y, more)
    };
    G__16164.cljs$lang$maxFixedArity = 2;
    G__16164.cljs$lang$applyTo = function(arglist__16165) {
      var x = cljs.core.first(arglist__16165);
      var y = cljs.core.first(cljs.core.next(arglist__16165));
      var more = cljs.core.rest(cljs.core.next(arglist__16165));
      return G__16164__delegate(x, y, more)
    };
    G__16164.cljs$lang$arity$variadic = G__16164__delegate;
    return G__16164
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
    var G__16166__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__16166 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16166__delegate.call(this, x, y, more)
    };
    G__16166.cljs$lang$maxFixedArity = 2;
    G__16166.cljs$lang$applyTo = function(arglist__16167) {
      var x = cljs.core.first(arglist__16167);
      var y = cljs.core.first(cljs.core.next(arglist__16167));
      var more = cljs.core.rest(cljs.core.next(arglist__16167));
      return G__16166__delegate(x, y, more)
    };
    G__16166.cljs$lang$arity$variadic = G__16166__delegate;
    return G__16166
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
  var rem__16169 = n % d;
  return cljs.core.fix.call(null, (n - rem__16169) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__16171 = cljs.core.quot.call(null, n, d);
  return n - d * q__16171
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
  var v__16174 = v - (v >> 1 & 1431655765);
  var v__16175 = (v__16174 & 858993459) + (v__16174 >> 2 & 858993459);
  return(v__16175 + (v__16175 >> 4) & 252645135) * 16843009 >> 24
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
    var G__16176__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__16177 = y;
            var G__16178 = cljs.core.first.call(null, more);
            var G__16179 = cljs.core.next.call(null, more);
            x = G__16177;
            y = G__16178;
            more = G__16179;
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
    var G__16176 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16176__delegate.call(this, x, y, more)
    };
    G__16176.cljs$lang$maxFixedArity = 2;
    G__16176.cljs$lang$applyTo = function(arglist__16180) {
      var x = cljs.core.first(arglist__16180);
      var y = cljs.core.first(cljs.core.next(arglist__16180));
      var more = cljs.core.rest(cljs.core.next(arglist__16180));
      return G__16176__delegate(x, y, more)
    };
    G__16176.cljs$lang$arity$variadic = G__16176__delegate;
    return G__16176
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
  var n__16184 = n;
  var xs__16185 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____16186 = xs__16185;
      if(and__3822__auto____16186) {
        return n__16184 > 0
      }else {
        return and__3822__auto____16186
      }
    }())) {
      var G__16187 = n__16184 - 1;
      var G__16188 = cljs.core.next.call(null, xs__16185);
      n__16184 = G__16187;
      xs__16185 = G__16188;
      continue
    }else {
      return xs__16185
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
    var G__16189__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__16190 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__16191 = cljs.core.next.call(null, more);
            sb = G__16190;
            more = G__16191;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__16189 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__16189__delegate.call(this, x, ys)
    };
    G__16189.cljs$lang$maxFixedArity = 1;
    G__16189.cljs$lang$applyTo = function(arglist__16192) {
      var x = cljs.core.first(arglist__16192);
      var ys = cljs.core.rest(arglist__16192);
      return G__16189__delegate(x, ys)
    };
    G__16189.cljs$lang$arity$variadic = G__16189__delegate;
    return G__16189
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
    var G__16193__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__16194 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__16195 = cljs.core.next.call(null, more);
            sb = G__16194;
            more = G__16195;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__16193 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__16193__delegate.call(this, x, ys)
    };
    G__16193.cljs$lang$maxFixedArity = 1;
    G__16193.cljs$lang$applyTo = function(arglist__16196) {
      var x = cljs.core.first(arglist__16196);
      var ys = cljs.core.rest(arglist__16196);
      return G__16193__delegate(x, ys)
    };
    G__16193.cljs$lang$arity$variadic = G__16193__delegate;
    return G__16193
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
  format.cljs$lang$applyTo = function(arglist__16197) {
    var fmt = cljs.core.first(arglist__16197);
    var args = cljs.core.rest(arglist__16197);
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
    var xs__16200 = cljs.core.seq.call(null, x);
    var ys__16201 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__16200 == null) {
        return ys__16201 == null
      }else {
        if(ys__16201 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__16200), cljs.core.first.call(null, ys__16201))) {
            var G__16202 = cljs.core.next.call(null, xs__16200);
            var G__16203 = cljs.core.next.call(null, ys__16201);
            xs__16200 = G__16202;
            ys__16201 = G__16203;
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
  return cljs.core.reduce.call(null, function(p1__16204_SHARP_, p2__16205_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__16204_SHARP_, cljs.core.hash.call(null, p2__16205_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__16209 = 0;
  var s__16210 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__16210) {
      var e__16211 = cljs.core.first.call(null, s__16210);
      var G__16212 = (h__16209 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__16211)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__16211)))) % 4503599627370496;
      var G__16213 = cljs.core.next.call(null, s__16210);
      h__16209 = G__16212;
      s__16210 = G__16213;
      continue
    }else {
      return h__16209
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__16217 = 0;
  var s__16218 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__16218) {
      var e__16219 = cljs.core.first.call(null, s__16218);
      var G__16220 = (h__16217 + cljs.core.hash.call(null, e__16219)) % 4503599627370496;
      var G__16221 = cljs.core.next.call(null, s__16218);
      h__16217 = G__16220;
      s__16218 = G__16221;
      continue
    }else {
      return h__16217
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__16242__16243 = cljs.core.seq.call(null, fn_map);
  if(G__16242__16243) {
    var G__16245__16247 = cljs.core.first.call(null, G__16242__16243);
    var vec__16246__16248 = G__16245__16247;
    var key_name__16249 = cljs.core.nth.call(null, vec__16246__16248, 0, null);
    var f__16250 = cljs.core.nth.call(null, vec__16246__16248, 1, null);
    var G__16242__16251 = G__16242__16243;
    var G__16245__16252 = G__16245__16247;
    var G__16242__16253 = G__16242__16251;
    while(true) {
      var vec__16254__16255 = G__16245__16252;
      var key_name__16256 = cljs.core.nth.call(null, vec__16254__16255, 0, null);
      var f__16257 = cljs.core.nth.call(null, vec__16254__16255, 1, null);
      var G__16242__16258 = G__16242__16253;
      var str_name__16259 = cljs.core.name.call(null, key_name__16256);
      obj[str_name__16259] = f__16257;
      var temp__3974__auto____16260 = cljs.core.next.call(null, G__16242__16258);
      if(temp__3974__auto____16260) {
        var G__16242__16261 = temp__3974__auto____16260;
        var G__16262 = cljs.core.first.call(null, G__16242__16261);
        var G__16263 = G__16242__16261;
        G__16245__16252 = G__16262;
        G__16242__16253 = G__16263;
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
  var this__16264 = this;
  var h__2192__auto____16265 = this__16264.__hash;
  if(!(h__2192__auto____16265 == null)) {
    return h__2192__auto____16265
  }else {
    var h__2192__auto____16266 = cljs.core.hash_coll.call(null, coll);
    this__16264.__hash = h__2192__auto____16266;
    return h__2192__auto____16266
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__16267 = this;
  if(this__16267.count === 1) {
    return null
  }else {
    return this__16267.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16268 = this;
  return new cljs.core.List(this__16268.meta, o, coll, this__16268.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__16269 = this;
  var this__16270 = this;
  return cljs.core.pr_str.call(null, this__16270)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16271 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16272 = this;
  return this__16272.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16273 = this;
  return this__16273.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16274 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16275 = this;
  return this__16275.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16276 = this;
  if(this__16276.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__16276.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16277 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16278 = this;
  return new cljs.core.List(meta, this__16278.first, this__16278.rest, this__16278.count, this__16278.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16279 = this;
  return this__16279.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16280 = this;
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
  var this__16281 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__16282 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16283 = this;
  return new cljs.core.List(this__16283.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__16284 = this;
  var this__16285 = this;
  return cljs.core.pr_str.call(null, this__16285)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16286 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16287 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16288 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16289 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16290 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16291 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16292 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16293 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16294 = this;
  return this__16294.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16295 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__16299__16300 = coll;
  if(G__16299__16300) {
    if(function() {
      var or__3824__auto____16301 = G__16299__16300.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____16301) {
        return or__3824__auto____16301
      }else {
        return G__16299__16300.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__16299__16300.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__16299__16300)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__16299__16300)
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
    var G__16302__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__16302 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16302__delegate.call(this, x, y, z, items)
    };
    G__16302.cljs$lang$maxFixedArity = 3;
    G__16302.cljs$lang$applyTo = function(arglist__16303) {
      var x = cljs.core.first(arglist__16303);
      var y = cljs.core.first(cljs.core.next(arglist__16303));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16303)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16303)));
      return G__16302__delegate(x, y, z, items)
    };
    G__16302.cljs$lang$arity$variadic = G__16302__delegate;
    return G__16302
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
  var this__16304 = this;
  var h__2192__auto____16305 = this__16304.__hash;
  if(!(h__2192__auto____16305 == null)) {
    return h__2192__auto____16305
  }else {
    var h__2192__auto____16306 = cljs.core.hash_coll.call(null, coll);
    this__16304.__hash = h__2192__auto____16306;
    return h__2192__auto____16306
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__16307 = this;
  if(this__16307.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__16307.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16308 = this;
  return new cljs.core.Cons(null, o, coll, this__16308.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__16309 = this;
  var this__16310 = this;
  return cljs.core.pr_str.call(null, this__16310)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16311 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16312 = this;
  return this__16312.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16313 = this;
  if(this__16313.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__16313.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16314 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16315 = this;
  return new cljs.core.Cons(meta, this__16315.first, this__16315.rest, this__16315.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16316 = this;
  return this__16316.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16317 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16317.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____16322 = coll == null;
    if(or__3824__auto____16322) {
      return or__3824__auto____16322
    }else {
      var G__16323__16324 = coll;
      if(G__16323__16324) {
        if(function() {
          var or__3824__auto____16325 = G__16323__16324.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____16325) {
            return or__3824__auto____16325
          }else {
            return G__16323__16324.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__16323__16324.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__16323__16324)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__16323__16324)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__16329__16330 = x;
  if(G__16329__16330) {
    if(function() {
      var or__3824__auto____16331 = G__16329__16330.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____16331) {
        return or__3824__auto____16331
      }else {
        return G__16329__16330.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__16329__16330.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__16329__16330)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__16329__16330)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__16332 = null;
  var G__16332__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__16332__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__16332 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__16332__2.call(this, string, f);
      case 3:
        return G__16332__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16332
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__16333 = null;
  var G__16333__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__16333__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__16333 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16333__2.call(this, string, k);
      case 3:
        return G__16333__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16333
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__16334 = null;
  var G__16334__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__16334__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__16334 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16334__2.call(this, string, n);
      case 3:
        return G__16334__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16334
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
  var G__16346 = null;
  var G__16346__2 = function(this_sym16337, coll) {
    var this__16339 = this;
    var this_sym16337__16340 = this;
    var ___16341 = this_sym16337__16340;
    if(coll == null) {
      return null
    }else {
      var strobj__16342 = coll.strobj;
      if(strobj__16342 == null) {
        return cljs.core._lookup.call(null, coll, this__16339.k, null)
      }else {
        return strobj__16342[this__16339.k]
      }
    }
  };
  var G__16346__3 = function(this_sym16338, coll, not_found) {
    var this__16339 = this;
    var this_sym16338__16343 = this;
    var ___16344 = this_sym16338__16343;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__16339.k, not_found)
    }
  };
  G__16346 = function(this_sym16338, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16346__2.call(this, this_sym16338, coll);
      case 3:
        return G__16346__3.call(this, this_sym16338, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16346
}();
cljs.core.Keyword.prototype.apply = function(this_sym16335, args16336) {
  var this__16345 = this;
  return this_sym16335.call.apply(this_sym16335, [this_sym16335].concat(args16336.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__16355 = null;
  var G__16355__2 = function(this_sym16349, coll) {
    var this_sym16349__16351 = this;
    var this__16352 = this_sym16349__16351;
    return cljs.core._lookup.call(null, coll, this__16352.toString(), null)
  };
  var G__16355__3 = function(this_sym16350, coll, not_found) {
    var this_sym16350__16353 = this;
    var this__16354 = this_sym16350__16353;
    return cljs.core._lookup.call(null, coll, this__16354.toString(), not_found)
  };
  G__16355 = function(this_sym16350, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16355__2.call(this, this_sym16350, coll);
      case 3:
        return G__16355__3.call(this, this_sym16350, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16355
}();
String.prototype.apply = function(this_sym16347, args16348) {
  return this_sym16347.call.apply(this_sym16347, [this_sym16347].concat(args16348.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__16357 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__16357
  }else {
    lazy_seq.x = x__16357.call(null);
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
  var this__16358 = this;
  var h__2192__auto____16359 = this__16358.__hash;
  if(!(h__2192__auto____16359 == null)) {
    return h__2192__auto____16359
  }else {
    var h__2192__auto____16360 = cljs.core.hash_coll.call(null, coll);
    this__16358.__hash = h__2192__auto____16360;
    return h__2192__auto____16360
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__16361 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16362 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__16363 = this;
  var this__16364 = this;
  return cljs.core.pr_str.call(null, this__16364)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16365 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16366 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16367 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16368 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16369 = this;
  return new cljs.core.LazySeq(meta, this__16369.realized, this__16369.x, this__16369.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16370 = this;
  return this__16370.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16371 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16371.meta)
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
  var this__16372 = this;
  return this__16372.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__16373 = this;
  var ___16374 = this;
  this__16373.buf[this__16373.end] = o;
  return this__16373.end = this__16373.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__16375 = this;
  var ___16376 = this;
  var ret__16377 = new cljs.core.ArrayChunk(this__16375.buf, 0, this__16375.end);
  this__16375.buf = null;
  return ret__16377
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
  var this__16378 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__16378.arr[this__16378.off], this__16378.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__16379 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__16379.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__16380 = this;
  if(this__16380.off === this__16380.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__16380.arr, this__16380.off + 1, this__16380.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__16381 = this;
  return this__16381.arr[this__16381.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__16382 = this;
  if(function() {
    var and__3822__auto____16383 = i >= 0;
    if(and__3822__auto____16383) {
      return i < this__16382.end - this__16382.off
    }else {
      return and__3822__auto____16383
    }
  }()) {
    return this__16382.arr[this__16382.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__16384 = this;
  return this__16384.end - this__16384.off
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
  var this__16385 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16386 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16387 = this;
  return cljs.core._nth.call(null, this__16387.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16388 = this;
  if(cljs.core._count.call(null, this__16388.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__16388.chunk), this__16388.more, this__16388.meta)
  }else {
    if(this__16388.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__16388.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__16389 = this;
  if(this__16389.more == null) {
    return null
  }else {
    return this__16389.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16390 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__16391 = this;
  return new cljs.core.ChunkedCons(this__16391.chunk, this__16391.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16392 = this;
  return this__16392.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__16393 = this;
  return this__16393.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__16394 = this;
  if(this__16394.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__16394.more
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
    var G__16398__16399 = s;
    if(G__16398__16399) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____16400 = null;
        if(cljs.core.truth_(or__3824__auto____16400)) {
          return or__3824__auto____16400
        }else {
          return G__16398__16399.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__16398__16399.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__16398__16399)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__16398__16399)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__16403 = [];
  var s__16404 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__16404)) {
      ary__16403.push(cljs.core.first.call(null, s__16404));
      var G__16405 = cljs.core.next.call(null, s__16404);
      s__16404 = G__16405;
      continue
    }else {
      return ary__16403
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__16409 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__16410 = 0;
  var xs__16411 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__16411) {
      ret__16409[i__16410] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__16411));
      var G__16412 = i__16410 + 1;
      var G__16413 = cljs.core.next.call(null, xs__16411);
      i__16410 = G__16412;
      xs__16411 = G__16413;
      continue
    }else {
    }
    break
  }
  return ret__16409
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
    var a__16421 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__16422 = cljs.core.seq.call(null, init_val_or_seq);
      var i__16423 = 0;
      var s__16424 = s__16422;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____16425 = s__16424;
          if(and__3822__auto____16425) {
            return i__16423 < size
          }else {
            return and__3822__auto____16425
          }
        }())) {
          a__16421[i__16423] = cljs.core.first.call(null, s__16424);
          var G__16428 = i__16423 + 1;
          var G__16429 = cljs.core.next.call(null, s__16424);
          i__16423 = G__16428;
          s__16424 = G__16429;
          continue
        }else {
          return a__16421
        }
        break
      }
    }else {
      var n__2527__auto____16426 = size;
      var i__16427 = 0;
      while(true) {
        if(i__16427 < n__2527__auto____16426) {
          a__16421[i__16427] = init_val_or_seq;
          var G__16430 = i__16427 + 1;
          i__16427 = G__16430;
          continue
        }else {
        }
        break
      }
      return a__16421
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
    var a__16438 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__16439 = cljs.core.seq.call(null, init_val_or_seq);
      var i__16440 = 0;
      var s__16441 = s__16439;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____16442 = s__16441;
          if(and__3822__auto____16442) {
            return i__16440 < size
          }else {
            return and__3822__auto____16442
          }
        }())) {
          a__16438[i__16440] = cljs.core.first.call(null, s__16441);
          var G__16445 = i__16440 + 1;
          var G__16446 = cljs.core.next.call(null, s__16441);
          i__16440 = G__16445;
          s__16441 = G__16446;
          continue
        }else {
          return a__16438
        }
        break
      }
    }else {
      var n__2527__auto____16443 = size;
      var i__16444 = 0;
      while(true) {
        if(i__16444 < n__2527__auto____16443) {
          a__16438[i__16444] = init_val_or_seq;
          var G__16447 = i__16444 + 1;
          i__16444 = G__16447;
          continue
        }else {
        }
        break
      }
      return a__16438
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
    var a__16455 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__16456 = cljs.core.seq.call(null, init_val_or_seq);
      var i__16457 = 0;
      var s__16458 = s__16456;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____16459 = s__16458;
          if(and__3822__auto____16459) {
            return i__16457 < size
          }else {
            return and__3822__auto____16459
          }
        }())) {
          a__16455[i__16457] = cljs.core.first.call(null, s__16458);
          var G__16462 = i__16457 + 1;
          var G__16463 = cljs.core.next.call(null, s__16458);
          i__16457 = G__16462;
          s__16458 = G__16463;
          continue
        }else {
          return a__16455
        }
        break
      }
    }else {
      var n__2527__auto____16460 = size;
      var i__16461 = 0;
      while(true) {
        if(i__16461 < n__2527__auto____16460) {
          a__16455[i__16461] = init_val_or_seq;
          var G__16464 = i__16461 + 1;
          i__16461 = G__16464;
          continue
        }else {
        }
        break
      }
      return a__16455
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
    var s__16469 = s;
    var i__16470 = n;
    var sum__16471 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____16472 = i__16470 > 0;
        if(and__3822__auto____16472) {
          return cljs.core.seq.call(null, s__16469)
        }else {
          return and__3822__auto____16472
        }
      }())) {
        var G__16473 = cljs.core.next.call(null, s__16469);
        var G__16474 = i__16470 - 1;
        var G__16475 = sum__16471 + 1;
        s__16469 = G__16473;
        i__16470 = G__16474;
        sum__16471 = G__16475;
        continue
      }else {
        return sum__16471
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
      var s__16480 = cljs.core.seq.call(null, x);
      if(s__16480) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__16480)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__16480), concat.call(null, cljs.core.chunk_rest.call(null, s__16480), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__16480), concat.call(null, cljs.core.rest.call(null, s__16480), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__16484__delegate = function(x, y, zs) {
      var cat__16483 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__16482 = cljs.core.seq.call(null, xys);
          if(xys__16482) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__16482)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__16482), cat.call(null, cljs.core.chunk_rest.call(null, xys__16482), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__16482), cat.call(null, cljs.core.rest.call(null, xys__16482), zs))
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
      return cat__16483.call(null, concat.call(null, x, y), zs)
    };
    var G__16484 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16484__delegate.call(this, x, y, zs)
    };
    G__16484.cljs$lang$maxFixedArity = 2;
    G__16484.cljs$lang$applyTo = function(arglist__16485) {
      var x = cljs.core.first(arglist__16485);
      var y = cljs.core.first(cljs.core.next(arglist__16485));
      var zs = cljs.core.rest(cljs.core.next(arglist__16485));
      return G__16484__delegate(x, y, zs)
    };
    G__16484.cljs$lang$arity$variadic = G__16484__delegate;
    return G__16484
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
    var G__16486__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__16486 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__16486__delegate.call(this, a, b, c, d, more)
    };
    G__16486.cljs$lang$maxFixedArity = 4;
    G__16486.cljs$lang$applyTo = function(arglist__16487) {
      var a = cljs.core.first(arglist__16487);
      var b = cljs.core.first(cljs.core.next(arglist__16487));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16487)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16487))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16487))));
      return G__16486__delegate(a, b, c, d, more)
    };
    G__16486.cljs$lang$arity$variadic = G__16486__delegate;
    return G__16486
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
  var args__16529 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__16530 = cljs.core._first.call(null, args__16529);
    var args__16531 = cljs.core._rest.call(null, args__16529);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__16530)
      }else {
        return f.call(null, a__16530)
      }
    }else {
      var b__16532 = cljs.core._first.call(null, args__16531);
      var args__16533 = cljs.core._rest.call(null, args__16531);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__16530, b__16532)
        }else {
          return f.call(null, a__16530, b__16532)
        }
      }else {
        var c__16534 = cljs.core._first.call(null, args__16533);
        var args__16535 = cljs.core._rest.call(null, args__16533);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__16530, b__16532, c__16534)
          }else {
            return f.call(null, a__16530, b__16532, c__16534)
          }
        }else {
          var d__16536 = cljs.core._first.call(null, args__16535);
          var args__16537 = cljs.core._rest.call(null, args__16535);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__16530, b__16532, c__16534, d__16536)
            }else {
              return f.call(null, a__16530, b__16532, c__16534, d__16536)
            }
          }else {
            var e__16538 = cljs.core._first.call(null, args__16537);
            var args__16539 = cljs.core._rest.call(null, args__16537);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__16530, b__16532, c__16534, d__16536, e__16538)
              }else {
                return f.call(null, a__16530, b__16532, c__16534, d__16536, e__16538)
              }
            }else {
              var f__16540 = cljs.core._first.call(null, args__16539);
              var args__16541 = cljs.core._rest.call(null, args__16539);
              if(argc === 6) {
                if(f__16540.cljs$lang$arity$6) {
                  return f__16540.cljs$lang$arity$6(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540)
                }else {
                  return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540)
                }
              }else {
                var g__16542 = cljs.core._first.call(null, args__16541);
                var args__16543 = cljs.core._rest.call(null, args__16541);
                if(argc === 7) {
                  if(f__16540.cljs$lang$arity$7) {
                    return f__16540.cljs$lang$arity$7(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542)
                  }else {
                    return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542)
                  }
                }else {
                  var h__16544 = cljs.core._first.call(null, args__16543);
                  var args__16545 = cljs.core._rest.call(null, args__16543);
                  if(argc === 8) {
                    if(f__16540.cljs$lang$arity$8) {
                      return f__16540.cljs$lang$arity$8(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544)
                    }else {
                      return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544)
                    }
                  }else {
                    var i__16546 = cljs.core._first.call(null, args__16545);
                    var args__16547 = cljs.core._rest.call(null, args__16545);
                    if(argc === 9) {
                      if(f__16540.cljs$lang$arity$9) {
                        return f__16540.cljs$lang$arity$9(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546)
                      }else {
                        return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546)
                      }
                    }else {
                      var j__16548 = cljs.core._first.call(null, args__16547);
                      var args__16549 = cljs.core._rest.call(null, args__16547);
                      if(argc === 10) {
                        if(f__16540.cljs$lang$arity$10) {
                          return f__16540.cljs$lang$arity$10(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548)
                        }else {
                          return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548)
                        }
                      }else {
                        var k__16550 = cljs.core._first.call(null, args__16549);
                        var args__16551 = cljs.core._rest.call(null, args__16549);
                        if(argc === 11) {
                          if(f__16540.cljs$lang$arity$11) {
                            return f__16540.cljs$lang$arity$11(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550)
                          }else {
                            return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550)
                          }
                        }else {
                          var l__16552 = cljs.core._first.call(null, args__16551);
                          var args__16553 = cljs.core._rest.call(null, args__16551);
                          if(argc === 12) {
                            if(f__16540.cljs$lang$arity$12) {
                              return f__16540.cljs$lang$arity$12(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552)
                            }else {
                              return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552)
                            }
                          }else {
                            var m__16554 = cljs.core._first.call(null, args__16553);
                            var args__16555 = cljs.core._rest.call(null, args__16553);
                            if(argc === 13) {
                              if(f__16540.cljs$lang$arity$13) {
                                return f__16540.cljs$lang$arity$13(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554)
                              }else {
                                return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554)
                              }
                            }else {
                              var n__16556 = cljs.core._first.call(null, args__16555);
                              var args__16557 = cljs.core._rest.call(null, args__16555);
                              if(argc === 14) {
                                if(f__16540.cljs$lang$arity$14) {
                                  return f__16540.cljs$lang$arity$14(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556)
                                }else {
                                  return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556)
                                }
                              }else {
                                var o__16558 = cljs.core._first.call(null, args__16557);
                                var args__16559 = cljs.core._rest.call(null, args__16557);
                                if(argc === 15) {
                                  if(f__16540.cljs$lang$arity$15) {
                                    return f__16540.cljs$lang$arity$15(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556, o__16558)
                                  }else {
                                    return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556, o__16558)
                                  }
                                }else {
                                  var p__16560 = cljs.core._first.call(null, args__16559);
                                  var args__16561 = cljs.core._rest.call(null, args__16559);
                                  if(argc === 16) {
                                    if(f__16540.cljs$lang$arity$16) {
                                      return f__16540.cljs$lang$arity$16(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556, o__16558, p__16560)
                                    }else {
                                      return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556, o__16558, p__16560)
                                    }
                                  }else {
                                    var q__16562 = cljs.core._first.call(null, args__16561);
                                    var args__16563 = cljs.core._rest.call(null, args__16561);
                                    if(argc === 17) {
                                      if(f__16540.cljs$lang$arity$17) {
                                        return f__16540.cljs$lang$arity$17(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556, o__16558, p__16560, q__16562)
                                      }else {
                                        return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556, o__16558, p__16560, q__16562)
                                      }
                                    }else {
                                      var r__16564 = cljs.core._first.call(null, args__16563);
                                      var args__16565 = cljs.core._rest.call(null, args__16563);
                                      if(argc === 18) {
                                        if(f__16540.cljs$lang$arity$18) {
                                          return f__16540.cljs$lang$arity$18(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556, o__16558, p__16560, q__16562, r__16564)
                                        }else {
                                          return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556, o__16558, p__16560, q__16562, r__16564)
                                        }
                                      }else {
                                        var s__16566 = cljs.core._first.call(null, args__16565);
                                        var args__16567 = cljs.core._rest.call(null, args__16565);
                                        if(argc === 19) {
                                          if(f__16540.cljs$lang$arity$19) {
                                            return f__16540.cljs$lang$arity$19(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556, o__16558, p__16560, q__16562, r__16564, s__16566)
                                          }else {
                                            return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556, o__16558, p__16560, q__16562, r__16564, s__16566)
                                          }
                                        }else {
                                          var t__16568 = cljs.core._first.call(null, args__16567);
                                          var args__16569 = cljs.core._rest.call(null, args__16567);
                                          if(argc === 20) {
                                            if(f__16540.cljs$lang$arity$20) {
                                              return f__16540.cljs$lang$arity$20(a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556, o__16558, p__16560, q__16562, r__16564, s__16566, t__16568)
                                            }else {
                                              return f__16540.call(null, a__16530, b__16532, c__16534, d__16536, e__16538, f__16540, g__16542, h__16544, i__16546, j__16548, k__16550, l__16552, m__16554, n__16556, o__16558, p__16560, q__16562, r__16564, s__16566, t__16568)
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
    var fixed_arity__16584 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__16585 = cljs.core.bounded_count.call(null, args, fixed_arity__16584 + 1);
      if(bc__16585 <= fixed_arity__16584) {
        return cljs.core.apply_to.call(null, f, bc__16585, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__16586 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__16587 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__16588 = cljs.core.bounded_count.call(null, arglist__16586, fixed_arity__16587 + 1);
      if(bc__16588 <= fixed_arity__16587) {
        return cljs.core.apply_to.call(null, f, bc__16588, arglist__16586)
      }else {
        return f.cljs$lang$applyTo(arglist__16586)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__16586))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__16589 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__16590 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__16591 = cljs.core.bounded_count.call(null, arglist__16589, fixed_arity__16590 + 1);
      if(bc__16591 <= fixed_arity__16590) {
        return cljs.core.apply_to.call(null, f, bc__16591, arglist__16589)
      }else {
        return f.cljs$lang$applyTo(arglist__16589)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__16589))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__16592 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__16593 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__16594 = cljs.core.bounded_count.call(null, arglist__16592, fixed_arity__16593 + 1);
      if(bc__16594 <= fixed_arity__16593) {
        return cljs.core.apply_to.call(null, f, bc__16594, arglist__16592)
      }else {
        return f.cljs$lang$applyTo(arglist__16592)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__16592))
    }
  };
  var apply__6 = function() {
    var G__16598__delegate = function(f, a, b, c, d, args) {
      var arglist__16595 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__16596 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__16597 = cljs.core.bounded_count.call(null, arglist__16595, fixed_arity__16596 + 1);
        if(bc__16597 <= fixed_arity__16596) {
          return cljs.core.apply_to.call(null, f, bc__16597, arglist__16595)
        }else {
          return f.cljs$lang$applyTo(arglist__16595)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__16595))
      }
    };
    var G__16598 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__16598__delegate.call(this, f, a, b, c, d, args)
    };
    G__16598.cljs$lang$maxFixedArity = 5;
    G__16598.cljs$lang$applyTo = function(arglist__16599) {
      var f = cljs.core.first(arglist__16599);
      var a = cljs.core.first(cljs.core.next(arglist__16599));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16599)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16599))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16599)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16599)))));
      return G__16598__delegate(f, a, b, c, d, args)
    };
    G__16598.cljs$lang$arity$variadic = G__16598__delegate;
    return G__16598
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
  vary_meta.cljs$lang$applyTo = function(arglist__16600) {
    var obj = cljs.core.first(arglist__16600);
    var f = cljs.core.first(cljs.core.next(arglist__16600));
    var args = cljs.core.rest(cljs.core.next(arglist__16600));
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
    var G__16601__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__16601 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16601__delegate.call(this, x, y, more)
    };
    G__16601.cljs$lang$maxFixedArity = 2;
    G__16601.cljs$lang$applyTo = function(arglist__16602) {
      var x = cljs.core.first(arglist__16602);
      var y = cljs.core.first(cljs.core.next(arglist__16602));
      var more = cljs.core.rest(cljs.core.next(arglist__16602));
      return G__16601__delegate(x, y, more)
    };
    G__16601.cljs$lang$arity$variadic = G__16601__delegate;
    return G__16601
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
        var G__16603 = pred;
        var G__16604 = cljs.core.next.call(null, coll);
        pred = G__16603;
        coll = G__16604;
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
      var or__3824__auto____16606 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____16606)) {
        return or__3824__auto____16606
      }else {
        var G__16607 = pred;
        var G__16608 = cljs.core.next.call(null, coll);
        pred = G__16607;
        coll = G__16608;
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
    var G__16609 = null;
    var G__16609__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__16609__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__16609__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__16609__3 = function() {
      var G__16610__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__16610 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__16610__delegate.call(this, x, y, zs)
      };
      G__16610.cljs$lang$maxFixedArity = 2;
      G__16610.cljs$lang$applyTo = function(arglist__16611) {
        var x = cljs.core.first(arglist__16611);
        var y = cljs.core.first(cljs.core.next(arglist__16611));
        var zs = cljs.core.rest(cljs.core.next(arglist__16611));
        return G__16610__delegate(x, y, zs)
      };
      G__16610.cljs$lang$arity$variadic = G__16610__delegate;
      return G__16610
    }();
    G__16609 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__16609__0.call(this);
        case 1:
          return G__16609__1.call(this, x);
        case 2:
          return G__16609__2.call(this, x, y);
        default:
          return G__16609__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__16609.cljs$lang$maxFixedArity = 2;
    G__16609.cljs$lang$applyTo = G__16609__3.cljs$lang$applyTo;
    return G__16609
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__16612__delegate = function(args) {
      return x
    };
    var G__16612 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__16612__delegate.call(this, args)
    };
    G__16612.cljs$lang$maxFixedArity = 0;
    G__16612.cljs$lang$applyTo = function(arglist__16613) {
      var args = cljs.core.seq(arglist__16613);
      return G__16612__delegate(args)
    };
    G__16612.cljs$lang$arity$variadic = G__16612__delegate;
    return G__16612
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
      var G__16620 = null;
      var G__16620__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__16620__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__16620__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__16620__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__16620__4 = function() {
        var G__16621__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__16621 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16621__delegate.call(this, x, y, z, args)
        };
        G__16621.cljs$lang$maxFixedArity = 3;
        G__16621.cljs$lang$applyTo = function(arglist__16622) {
          var x = cljs.core.first(arglist__16622);
          var y = cljs.core.first(cljs.core.next(arglist__16622));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16622)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16622)));
          return G__16621__delegate(x, y, z, args)
        };
        G__16621.cljs$lang$arity$variadic = G__16621__delegate;
        return G__16621
      }();
      G__16620 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__16620__0.call(this);
          case 1:
            return G__16620__1.call(this, x);
          case 2:
            return G__16620__2.call(this, x, y);
          case 3:
            return G__16620__3.call(this, x, y, z);
          default:
            return G__16620__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16620.cljs$lang$maxFixedArity = 3;
      G__16620.cljs$lang$applyTo = G__16620__4.cljs$lang$applyTo;
      return G__16620
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__16623 = null;
      var G__16623__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__16623__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__16623__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__16623__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__16623__4 = function() {
        var G__16624__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__16624 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16624__delegate.call(this, x, y, z, args)
        };
        G__16624.cljs$lang$maxFixedArity = 3;
        G__16624.cljs$lang$applyTo = function(arglist__16625) {
          var x = cljs.core.first(arglist__16625);
          var y = cljs.core.first(cljs.core.next(arglist__16625));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16625)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16625)));
          return G__16624__delegate(x, y, z, args)
        };
        G__16624.cljs$lang$arity$variadic = G__16624__delegate;
        return G__16624
      }();
      G__16623 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__16623__0.call(this);
          case 1:
            return G__16623__1.call(this, x);
          case 2:
            return G__16623__2.call(this, x, y);
          case 3:
            return G__16623__3.call(this, x, y, z);
          default:
            return G__16623__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16623.cljs$lang$maxFixedArity = 3;
      G__16623.cljs$lang$applyTo = G__16623__4.cljs$lang$applyTo;
      return G__16623
    }()
  };
  var comp__4 = function() {
    var G__16626__delegate = function(f1, f2, f3, fs) {
      var fs__16617 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__16627__delegate = function(args) {
          var ret__16618 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__16617), args);
          var fs__16619 = cljs.core.next.call(null, fs__16617);
          while(true) {
            if(fs__16619) {
              var G__16628 = cljs.core.first.call(null, fs__16619).call(null, ret__16618);
              var G__16629 = cljs.core.next.call(null, fs__16619);
              ret__16618 = G__16628;
              fs__16619 = G__16629;
              continue
            }else {
              return ret__16618
            }
            break
          }
        };
        var G__16627 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__16627__delegate.call(this, args)
        };
        G__16627.cljs$lang$maxFixedArity = 0;
        G__16627.cljs$lang$applyTo = function(arglist__16630) {
          var args = cljs.core.seq(arglist__16630);
          return G__16627__delegate(args)
        };
        G__16627.cljs$lang$arity$variadic = G__16627__delegate;
        return G__16627
      }()
    };
    var G__16626 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16626__delegate.call(this, f1, f2, f3, fs)
    };
    G__16626.cljs$lang$maxFixedArity = 3;
    G__16626.cljs$lang$applyTo = function(arglist__16631) {
      var f1 = cljs.core.first(arglist__16631);
      var f2 = cljs.core.first(cljs.core.next(arglist__16631));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16631)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16631)));
      return G__16626__delegate(f1, f2, f3, fs)
    };
    G__16626.cljs$lang$arity$variadic = G__16626__delegate;
    return G__16626
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
      var G__16632__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__16632 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__16632__delegate.call(this, args)
      };
      G__16632.cljs$lang$maxFixedArity = 0;
      G__16632.cljs$lang$applyTo = function(arglist__16633) {
        var args = cljs.core.seq(arglist__16633);
        return G__16632__delegate(args)
      };
      G__16632.cljs$lang$arity$variadic = G__16632__delegate;
      return G__16632
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__16634__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__16634 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__16634__delegate.call(this, args)
      };
      G__16634.cljs$lang$maxFixedArity = 0;
      G__16634.cljs$lang$applyTo = function(arglist__16635) {
        var args = cljs.core.seq(arglist__16635);
        return G__16634__delegate(args)
      };
      G__16634.cljs$lang$arity$variadic = G__16634__delegate;
      return G__16634
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__16636__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__16636 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__16636__delegate.call(this, args)
      };
      G__16636.cljs$lang$maxFixedArity = 0;
      G__16636.cljs$lang$applyTo = function(arglist__16637) {
        var args = cljs.core.seq(arglist__16637);
        return G__16636__delegate(args)
      };
      G__16636.cljs$lang$arity$variadic = G__16636__delegate;
      return G__16636
    }()
  };
  var partial__5 = function() {
    var G__16638__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__16639__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__16639 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__16639__delegate.call(this, args)
        };
        G__16639.cljs$lang$maxFixedArity = 0;
        G__16639.cljs$lang$applyTo = function(arglist__16640) {
          var args = cljs.core.seq(arglist__16640);
          return G__16639__delegate(args)
        };
        G__16639.cljs$lang$arity$variadic = G__16639__delegate;
        return G__16639
      }()
    };
    var G__16638 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__16638__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__16638.cljs$lang$maxFixedArity = 4;
    G__16638.cljs$lang$applyTo = function(arglist__16641) {
      var f = cljs.core.first(arglist__16641);
      var arg1 = cljs.core.first(cljs.core.next(arglist__16641));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16641)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16641))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16641))));
      return G__16638__delegate(f, arg1, arg2, arg3, more)
    };
    G__16638.cljs$lang$arity$variadic = G__16638__delegate;
    return G__16638
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
      var G__16642 = null;
      var G__16642__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__16642__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__16642__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__16642__4 = function() {
        var G__16643__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__16643 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16643__delegate.call(this, a, b, c, ds)
        };
        G__16643.cljs$lang$maxFixedArity = 3;
        G__16643.cljs$lang$applyTo = function(arglist__16644) {
          var a = cljs.core.first(arglist__16644);
          var b = cljs.core.first(cljs.core.next(arglist__16644));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16644)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16644)));
          return G__16643__delegate(a, b, c, ds)
        };
        G__16643.cljs$lang$arity$variadic = G__16643__delegate;
        return G__16643
      }();
      G__16642 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__16642__1.call(this, a);
          case 2:
            return G__16642__2.call(this, a, b);
          case 3:
            return G__16642__3.call(this, a, b, c);
          default:
            return G__16642__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16642.cljs$lang$maxFixedArity = 3;
      G__16642.cljs$lang$applyTo = G__16642__4.cljs$lang$applyTo;
      return G__16642
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__16645 = null;
      var G__16645__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__16645__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__16645__4 = function() {
        var G__16646__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__16646 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16646__delegate.call(this, a, b, c, ds)
        };
        G__16646.cljs$lang$maxFixedArity = 3;
        G__16646.cljs$lang$applyTo = function(arglist__16647) {
          var a = cljs.core.first(arglist__16647);
          var b = cljs.core.first(cljs.core.next(arglist__16647));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16647)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16647)));
          return G__16646__delegate(a, b, c, ds)
        };
        G__16646.cljs$lang$arity$variadic = G__16646__delegate;
        return G__16646
      }();
      G__16645 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__16645__2.call(this, a, b);
          case 3:
            return G__16645__3.call(this, a, b, c);
          default:
            return G__16645__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16645.cljs$lang$maxFixedArity = 3;
      G__16645.cljs$lang$applyTo = G__16645__4.cljs$lang$applyTo;
      return G__16645
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__16648 = null;
      var G__16648__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__16648__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__16648__4 = function() {
        var G__16649__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__16649 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16649__delegate.call(this, a, b, c, ds)
        };
        G__16649.cljs$lang$maxFixedArity = 3;
        G__16649.cljs$lang$applyTo = function(arglist__16650) {
          var a = cljs.core.first(arglist__16650);
          var b = cljs.core.first(cljs.core.next(arglist__16650));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16650)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16650)));
          return G__16649__delegate(a, b, c, ds)
        };
        G__16649.cljs$lang$arity$variadic = G__16649__delegate;
        return G__16649
      }();
      G__16648 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__16648__2.call(this, a, b);
          case 3:
            return G__16648__3.call(this, a, b, c);
          default:
            return G__16648__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16648.cljs$lang$maxFixedArity = 3;
      G__16648.cljs$lang$applyTo = G__16648__4.cljs$lang$applyTo;
      return G__16648
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
  var mapi__16666 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____16674 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16674) {
        var s__16675 = temp__3974__auto____16674;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__16675)) {
          var c__16676 = cljs.core.chunk_first.call(null, s__16675);
          var size__16677 = cljs.core.count.call(null, c__16676);
          var b__16678 = cljs.core.chunk_buffer.call(null, size__16677);
          var n__2527__auto____16679 = size__16677;
          var i__16680 = 0;
          while(true) {
            if(i__16680 < n__2527__auto____16679) {
              cljs.core.chunk_append.call(null, b__16678, f.call(null, idx + i__16680, cljs.core._nth.call(null, c__16676, i__16680)));
              var G__16681 = i__16680 + 1;
              i__16680 = G__16681;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__16678), mapi.call(null, idx + size__16677, cljs.core.chunk_rest.call(null, s__16675)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__16675)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__16675)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__16666.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____16691 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____16691) {
      var s__16692 = temp__3974__auto____16691;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__16692)) {
        var c__16693 = cljs.core.chunk_first.call(null, s__16692);
        var size__16694 = cljs.core.count.call(null, c__16693);
        var b__16695 = cljs.core.chunk_buffer.call(null, size__16694);
        var n__2527__auto____16696 = size__16694;
        var i__16697 = 0;
        while(true) {
          if(i__16697 < n__2527__auto____16696) {
            var x__16698 = f.call(null, cljs.core._nth.call(null, c__16693, i__16697));
            if(x__16698 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__16695, x__16698)
            }
            var G__16700 = i__16697 + 1;
            i__16697 = G__16700;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__16695), keep.call(null, f, cljs.core.chunk_rest.call(null, s__16692)))
      }else {
        var x__16699 = f.call(null, cljs.core.first.call(null, s__16692));
        if(x__16699 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__16692))
        }else {
          return cljs.core.cons.call(null, x__16699, keep.call(null, f, cljs.core.rest.call(null, s__16692)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__16726 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____16736 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16736) {
        var s__16737 = temp__3974__auto____16736;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__16737)) {
          var c__16738 = cljs.core.chunk_first.call(null, s__16737);
          var size__16739 = cljs.core.count.call(null, c__16738);
          var b__16740 = cljs.core.chunk_buffer.call(null, size__16739);
          var n__2527__auto____16741 = size__16739;
          var i__16742 = 0;
          while(true) {
            if(i__16742 < n__2527__auto____16741) {
              var x__16743 = f.call(null, idx + i__16742, cljs.core._nth.call(null, c__16738, i__16742));
              if(x__16743 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__16740, x__16743)
              }
              var G__16745 = i__16742 + 1;
              i__16742 = G__16745;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__16740), keepi.call(null, idx + size__16739, cljs.core.chunk_rest.call(null, s__16737)))
        }else {
          var x__16744 = f.call(null, idx, cljs.core.first.call(null, s__16737));
          if(x__16744 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__16737))
          }else {
            return cljs.core.cons.call(null, x__16744, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__16737)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__16726.call(null, 0, coll)
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
          var and__3822__auto____16831 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16831)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____16831
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16832 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16832)) {
            var and__3822__auto____16833 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____16833)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____16833
            }
          }else {
            return and__3822__auto____16832
          }
        }())
      };
      var ep1__4 = function() {
        var G__16902__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____16834 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____16834)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____16834
            }
          }())
        };
        var G__16902 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16902__delegate.call(this, x, y, z, args)
        };
        G__16902.cljs$lang$maxFixedArity = 3;
        G__16902.cljs$lang$applyTo = function(arglist__16903) {
          var x = cljs.core.first(arglist__16903);
          var y = cljs.core.first(cljs.core.next(arglist__16903));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16903)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16903)));
          return G__16902__delegate(x, y, z, args)
        };
        G__16902.cljs$lang$arity$variadic = G__16902__delegate;
        return G__16902
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
          var and__3822__auto____16846 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16846)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____16846
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16847 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16847)) {
            var and__3822__auto____16848 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____16848)) {
              var and__3822__auto____16849 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____16849)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____16849
              }
            }else {
              return and__3822__auto____16848
            }
          }else {
            return and__3822__auto____16847
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16850 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16850)) {
            var and__3822__auto____16851 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____16851)) {
              var and__3822__auto____16852 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____16852)) {
                var and__3822__auto____16853 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____16853)) {
                  var and__3822__auto____16854 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____16854)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____16854
                  }
                }else {
                  return and__3822__auto____16853
                }
              }else {
                return and__3822__auto____16852
              }
            }else {
              return and__3822__auto____16851
            }
          }else {
            return and__3822__auto____16850
          }
        }())
      };
      var ep2__4 = function() {
        var G__16904__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____16855 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____16855)) {
              return cljs.core.every_QMARK_.call(null, function(p1__16701_SHARP_) {
                var and__3822__auto____16856 = p1.call(null, p1__16701_SHARP_);
                if(cljs.core.truth_(and__3822__auto____16856)) {
                  return p2.call(null, p1__16701_SHARP_)
                }else {
                  return and__3822__auto____16856
                }
              }, args)
            }else {
              return and__3822__auto____16855
            }
          }())
        };
        var G__16904 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16904__delegate.call(this, x, y, z, args)
        };
        G__16904.cljs$lang$maxFixedArity = 3;
        G__16904.cljs$lang$applyTo = function(arglist__16905) {
          var x = cljs.core.first(arglist__16905);
          var y = cljs.core.first(cljs.core.next(arglist__16905));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16905)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16905)));
          return G__16904__delegate(x, y, z, args)
        };
        G__16904.cljs$lang$arity$variadic = G__16904__delegate;
        return G__16904
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
          var and__3822__auto____16875 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16875)) {
            var and__3822__auto____16876 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16876)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____16876
            }
          }else {
            return and__3822__auto____16875
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16877 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16877)) {
            var and__3822__auto____16878 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16878)) {
              var and__3822__auto____16879 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____16879)) {
                var and__3822__auto____16880 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____16880)) {
                  var and__3822__auto____16881 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____16881)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____16881
                  }
                }else {
                  return and__3822__auto____16880
                }
              }else {
                return and__3822__auto____16879
              }
            }else {
              return and__3822__auto____16878
            }
          }else {
            return and__3822__auto____16877
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16882 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16882)) {
            var and__3822__auto____16883 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16883)) {
              var and__3822__auto____16884 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____16884)) {
                var and__3822__auto____16885 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____16885)) {
                  var and__3822__auto____16886 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____16886)) {
                    var and__3822__auto____16887 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____16887)) {
                      var and__3822__auto____16888 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____16888)) {
                        var and__3822__auto____16889 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____16889)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____16889
                        }
                      }else {
                        return and__3822__auto____16888
                      }
                    }else {
                      return and__3822__auto____16887
                    }
                  }else {
                    return and__3822__auto____16886
                  }
                }else {
                  return and__3822__auto____16885
                }
              }else {
                return and__3822__auto____16884
              }
            }else {
              return and__3822__auto____16883
            }
          }else {
            return and__3822__auto____16882
          }
        }())
      };
      var ep3__4 = function() {
        var G__16906__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____16890 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____16890)) {
              return cljs.core.every_QMARK_.call(null, function(p1__16702_SHARP_) {
                var and__3822__auto____16891 = p1.call(null, p1__16702_SHARP_);
                if(cljs.core.truth_(and__3822__auto____16891)) {
                  var and__3822__auto____16892 = p2.call(null, p1__16702_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____16892)) {
                    return p3.call(null, p1__16702_SHARP_)
                  }else {
                    return and__3822__auto____16892
                  }
                }else {
                  return and__3822__auto____16891
                }
              }, args)
            }else {
              return and__3822__auto____16890
            }
          }())
        };
        var G__16906 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16906__delegate.call(this, x, y, z, args)
        };
        G__16906.cljs$lang$maxFixedArity = 3;
        G__16906.cljs$lang$applyTo = function(arglist__16907) {
          var x = cljs.core.first(arglist__16907);
          var y = cljs.core.first(cljs.core.next(arglist__16907));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16907)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16907)));
          return G__16906__delegate(x, y, z, args)
        };
        G__16906.cljs$lang$arity$variadic = G__16906__delegate;
        return G__16906
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
    var G__16908__delegate = function(p1, p2, p3, ps) {
      var ps__16893 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__16703_SHARP_) {
            return p1__16703_SHARP_.call(null, x)
          }, ps__16893)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__16704_SHARP_) {
            var and__3822__auto____16898 = p1__16704_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16898)) {
              return p1__16704_SHARP_.call(null, y)
            }else {
              return and__3822__auto____16898
            }
          }, ps__16893)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__16705_SHARP_) {
            var and__3822__auto____16899 = p1__16705_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16899)) {
              var and__3822__auto____16900 = p1__16705_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____16900)) {
                return p1__16705_SHARP_.call(null, z)
              }else {
                return and__3822__auto____16900
              }
            }else {
              return and__3822__auto____16899
            }
          }, ps__16893)
        };
        var epn__4 = function() {
          var G__16909__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____16901 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____16901)) {
                return cljs.core.every_QMARK_.call(null, function(p1__16706_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__16706_SHARP_, args)
                }, ps__16893)
              }else {
                return and__3822__auto____16901
              }
            }())
          };
          var G__16909 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__16909__delegate.call(this, x, y, z, args)
          };
          G__16909.cljs$lang$maxFixedArity = 3;
          G__16909.cljs$lang$applyTo = function(arglist__16910) {
            var x = cljs.core.first(arglist__16910);
            var y = cljs.core.first(cljs.core.next(arglist__16910));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16910)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16910)));
            return G__16909__delegate(x, y, z, args)
          };
          G__16909.cljs$lang$arity$variadic = G__16909__delegate;
          return G__16909
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
    var G__16908 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16908__delegate.call(this, p1, p2, p3, ps)
    };
    G__16908.cljs$lang$maxFixedArity = 3;
    G__16908.cljs$lang$applyTo = function(arglist__16911) {
      var p1 = cljs.core.first(arglist__16911);
      var p2 = cljs.core.first(cljs.core.next(arglist__16911));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16911)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16911)));
      return G__16908__delegate(p1, p2, p3, ps)
    };
    G__16908.cljs$lang$arity$variadic = G__16908__delegate;
    return G__16908
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
        var or__3824__auto____16992 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16992)) {
          return or__3824__auto____16992
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____16993 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16993)) {
          return or__3824__auto____16993
        }else {
          var or__3824__auto____16994 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____16994)) {
            return or__3824__auto____16994
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__17063__delegate = function(x, y, z, args) {
          var or__3824__auto____16995 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____16995)) {
            return or__3824__auto____16995
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__17063 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17063__delegate.call(this, x, y, z, args)
        };
        G__17063.cljs$lang$maxFixedArity = 3;
        G__17063.cljs$lang$applyTo = function(arglist__17064) {
          var x = cljs.core.first(arglist__17064);
          var y = cljs.core.first(cljs.core.next(arglist__17064));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17064)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17064)));
          return G__17063__delegate(x, y, z, args)
        };
        G__17063.cljs$lang$arity$variadic = G__17063__delegate;
        return G__17063
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
        var or__3824__auto____17007 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17007)) {
          return or__3824__auto____17007
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____17008 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17008)) {
          return or__3824__auto____17008
        }else {
          var or__3824__auto____17009 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____17009)) {
            return or__3824__auto____17009
          }else {
            var or__3824__auto____17010 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17010)) {
              return or__3824__auto____17010
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____17011 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17011)) {
          return or__3824__auto____17011
        }else {
          var or__3824__auto____17012 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____17012)) {
            return or__3824__auto____17012
          }else {
            var or__3824__auto____17013 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____17013)) {
              return or__3824__auto____17013
            }else {
              var or__3824__auto____17014 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____17014)) {
                return or__3824__auto____17014
              }else {
                var or__3824__auto____17015 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____17015)) {
                  return or__3824__auto____17015
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__17065__delegate = function(x, y, z, args) {
          var or__3824__auto____17016 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____17016)) {
            return or__3824__auto____17016
          }else {
            return cljs.core.some.call(null, function(p1__16746_SHARP_) {
              var or__3824__auto____17017 = p1.call(null, p1__16746_SHARP_);
              if(cljs.core.truth_(or__3824__auto____17017)) {
                return or__3824__auto____17017
              }else {
                return p2.call(null, p1__16746_SHARP_)
              }
            }, args)
          }
        };
        var G__17065 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17065__delegate.call(this, x, y, z, args)
        };
        G__17065.cljs$lang$maxFixedArity = 3;
        G__17065.cljs$lang$applyTo = function(arglist__17066) {
          var x = cljs.core.first(arglist__17066);
          var y = cljs.core.first(cljs.core.next(arglist__17066));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17066)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17066)));
          return G__17065__delegate(x, y, z, args)
        };
        G__17065.cljs$lang$arity$variadic = G__17065__delegate;
        return G__17065
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
        var or__3824__auto____17036 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17036)) {
          return or__3824__auto____17036
        }else {
          var or__3824__auto____17037 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____17037)) {
            return or__3824__auto____17037
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____17038 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17038)) {
          return or__3824__auto____17038
        }else {
          var or__3824__auto____17039 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____17039)) {
            return or__3824__auto____17039
          }else {
            var or__3824__auto____17040 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17040)) {
              return or__3824__auto____17040
            }else {
              var or__3824__auto____17041 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____17041)) {
                return or__3824__auto____17041
              }else {
                var or__3824__auto____17042 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____17042)) {
                  return or__3824__auto____17042
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____17043 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17043)) {
          return or__3824__auto____17043
        }else {
          var or__3824__auto____17044 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____17044)) {
            return or__3824__auto____17044
          }else {
            var or__3824__auto____17045 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17045)) {
              return or__3824__auto____17045
            }else {
              var or__3824__auto____17046 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____17046)) {
                return or__3824__auto____17046
              }else {
                var or__3824__auto____17047 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____17047)) {
                  return or__3824__auto____17047
                }else {
                  var or__3824__auto____17048 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____17048)) {
                    return or__3824__auto____17048
                  }else {
                    var or__3824__auto____17049 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____17049)) {
                      return or__3824__auto____17049
                    }else {
                      var or__3824__auto____17050 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____17050)) {
                        return or__3824__auto____17050
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
        var G__17067__delegate = function(x, y, z, args) {
          var or__3824__auto____17051 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____17051)) {
            return or__3824__auto____17051
          }else {
            return cljs.core.some.call(null, function(p1__16747_SHARP_) {
              var or__3824__auto____17052 = p1.call(null, p1__16747_SHARP_);
              if(cljs.core.truth_(or__3824__auto____17052)) {
                return or__3824__auto____17052
              }else {
                var or__3824__auto____17053 = p2.call(null, p1__16747_SHARP_);
                if(cljs.core.truth_(or__3824__auto____17053)) {
                  return or__3824__auto____17053
                }else {
                  return p3.call(null, p1__16747_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__17067 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17067__delegate.call(this, x, y, z, args)
        };
        G__17067.cljs$lang$maxFixedArity = 3;
        G__17067.cljs$lang$applyTo = function(arglist__17068) {
          var x = cljs.core.first(arglist__17068);
          var y = cljs.core.first(cljs.core.next(arglist__17068));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17068)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17068)));
          return G__17067__delegate(x, y, z, args)
        };
        G__17067.cljs$lang$arity$variadic = G__17067__delegate;
        return G__17067
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
    var G__17069__delegate = function(p1, p2, p3, ps) {
      var ps__17054 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__16748_SHARP_) {
            return p1__16748_SHARP_.call(null, x)
          }, ps__17054)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__16749_SHARP_) {
            var or__3824__auto____17059 = p1__16749_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17059)) {
              return or__3824__auto____17059
            }else {
              return p1__16749_SHARP_.call(null, y)
            }
          }, ps__17054)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__16750_SHARP_) {
            var or__3824__auto____17060 = p1__16750_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17060)) {
              return or__3824__auto____17060
            }else {
              var or__3824__auto____17061 = p1__16750_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____17061)) {
                return or__3824__auto____17061
              }else {
                return p1__16750_SHARP_.call(null, z)
              }
            }
          }, ps__17054)
        };
        var spn__4 = function() {
          var G__17070__delegate = function(x, y, z, args) {
            var or__3824__auto____17062 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____17062)) {
              return or__3824__auto____17062
            }else {
              return cljs.core.some.call(null, function(p1__16751_SHARP_) {
                return cljs.core.some.call(null, p1__16751_SHARP_, args)
              }, ps__17054)
            }
          };
          var G__17070 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__17070__delegate.call(this, x, y, z, args)
          };
          G__17070.cljs$lang$maxFixedArity = 3;
          G__17070.cljs$lang$applyTo = function(arglist__17071) {
            var x = cljs.core.first(arglist__17071);
            var y = cljs.core.first(cljs.core.next(arglist__17071));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17071)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17071)));
            return G__17070__delegate(x, y, z, args)
          };
          G__17070.cljs$lang$arity$variadic = G__17070__delegate;
          return G__17070
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
    var G__17069 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17069__delegate.call(this, p1, p2, p3, ps)
    };
    G__17069.cljs$lang$maxFixedArity = 3;
    G__17069.cljs$lang$applyTo = function(arglist__17072) {
      var p1 = cljs.core.first(arglist__17072);
      var p2 = cljs.core.first(cljs.core.next(arglist__17072));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17072)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17072)));
      return G__17069__delegate(p1, p2, p3, ps)
    };
    G__17069.cljs$lang$arity$variadic = G__17069__delegate;
    return G__17069
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
      var temp__3974__auto____17091 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17091) {
        var s__17092 = temp__3974__auto____17091;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__17092)) {
          var c__17093 = cljs.core.chunk_first.call(null, s__17092);
          var size__17094 = cljs.core.count.call(null, c__17093);
          var b__17095 = cljs.core.chunk_buffer.call(null, size__17094);
          var n__2527__auto____17096 = size__17094;
          var i__17097 = 0;
          while(true) {
            if(i__17097 < n__2527__auto____17096) {
              cljs.core.chunk_append.call(null, b__17095, f.call(null, cljs.core._nth.call(null, c__17093, i__17097)));
              var G__17109 = i__17097 + 1;
              i__17097 = G__17109;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__17095), map.call(null, f, cljs.core.chunk_rest.call(null, s__17092)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__17092)), map.call(null, f, cljs.core.rest.call(null, s__17092)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__17098 = cljs.core.seq.call(null, c1);
      var s2__17099 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____17100 = s1__17098;
        if(and__3822__auto____17100) {
          return s2__17099
        }else {
          return and__3822__auto____17100
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__17098), cljs.core.first.call(null, s2__17099)), map.call(null, f, cljs.core.rest.call(null, s1__17098), cljs.core.rest.call(null, s2__17099)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__17101 = cljs.core.seq.call(null, c1);
      var s2__17102 = cljs.core.seq.call(null, c2);
      var s3__17103 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____17104 = s1__17101;
        if(and__3822__auto____17104) {
          var and__3822__auto____17105 = s2__17102;
          if(and__3822__auto____17105) {
            return s3__17103
          }else {
            return and__3822__auto____17105
          }
        }else {
          return and__3822__auto____17104
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__17101), cljs.core.first.call(null, s2__17102), cljs.core.first.call(null, s3__17103)), map.call(null, f, cljs.core.rest.call(null, s1__17101), cljs.core.rest.call(null, s2__17102), cljs.core.rest.call(null, s3__17103)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__17110__delegate = function(f, c1, c2, c3, colls) {
      var step__17108 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__17107 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__17107)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__17107), step.call(null, map.call(null, cljs.core.rest, ss__17107)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__16912_SHARP_) {
        return cljs.core.apply.call(null, f, p1__16912_SHARP_)
      }, step__17108.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__17110 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__17110__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__17110.cljs$lang$maxFixedArity = 4;
    G__17110.cljs$lang$applyTo = function(arglist__17111) {
      var f = cljs.core.first(arglist__17111);
      var c1 = cljs.core.first(cljs.core.next(arglist__17111));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17111)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17111))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17111))));
      return G__17110__delegate(f, c1, c2, c3, colls)
    };
    G__17110.cljs$lang$arity$variadic = G__17110__delegate;
    return G__17110
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
      var temp__3974__auto____17114 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17114) {
        var s__17115 = temp__3974__auto____17114;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__17115), take.call(null, n - 1, cljs.core.rest.call(null, s__17115)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__17121 = function(n, coll) {
    while(true) {
      var s__17119 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____17120 = n > 0;
        if(and__3822__auto____17120) {
          return s__17119
        }else {
          return and__3822__auto____17120
        }
      }())) {
        var G__17122 = n - 1;
        var G__17123 = cljs.core.rest.call(null, s__17119);
        n = G__17122;
        coll = G__17123;
        continue
      }else {
        return s__17119
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__17121.call(null, n, coll)
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
  var s__17126 = cljs.core.seq.call(null, coll);
  var lead__17127 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__17127) {
      var G__17128 = cljs.core.next.call(null, s__17126);
      var G__17129 = cljs.core.next.call(null, lead__17127);
      s__17126 = G__17128;
      lead__17127 = G__17129;
      continue
    }else {
      return s__17126
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__17135 = function(pred, coll) {
    while(true) {
      var s__17133 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____17134 = s__17133;
        if(and__3822__auto____17134) {
          return pred.call(null, cljs.core.first.call(null, s__17133))
        }else {
          return and__3822__auto____17134
        }
      }())) {
        var G__17136 = pred;
        var G__17137 = cljs.core.rest.call(null, s__17133);
        pred = G__17136;
        coll = G__17137;
        continue
      }else {
        return s__17133
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__17135.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____17140 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17140) {
      var s__17141 = temp__3974__auto____17140;
      return cljs.core.concat.call(null, s__17141, cycle.call(null, s__17141))
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
      var s1__17146 = cljs.core.seq.call(null, c1);
      var s2__17147 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____17148 = s1__17146;
        if(and__3822__auto____17148) {
          return s2__17147
        }else {
          return and__3822__auto____17148
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__17146), cljs.core.cons.call(null, cljs.core.first.call(null, s2__17147), interleave.call(null, cljs.core.rest.call(null, s1__17146), cljs.core.rest.call(null, s2__17147))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__17150__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__17149 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__17149)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__17149), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__17149)))
        }else {
          return null
        }
      }, null)
    };
    var G__17150 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__17150__delegate.call(this, c1, c2, colls)
    };
    G__17150.cljs$lang$maxFixedArity = 2;
    G__17150.cljs$lang$applyTo = function(arglist__17151) {
      var c1 = cljs.core.first(arglist__17151);
      var c2 = cljs.core.first(cljs.core.next(arglist__17151));
      var colls = cljs.core.rest(cljs.core.next(arglist__17151));
      return G__17150__delegate(c1, c2, colls)
    };
    G__17150.cljs$lang$arity$variadic = G__17150__delegate;
    return G__17150
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
  var cat__17161 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____17159 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____17159) {
        var coll__17160 = temp__3971__auto____17159;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__17160), cat.call(null, cljs.core.rest.call(null, coll__17160), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__17161.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__17162__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__17162 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__17162__delegate.call(this, f, coll, colls)
    };
    G__17162.cljs$lang$maxFixedArity = 2;
    G__17162.cljs$lang$applyTo = function(arglist__17163) {
      var f = cljs.core.first(arglist__17163);
      var coll = cljs.core.first(cljs.core.next(arglist__17163));
      var colls = cljs.core.rest(cljs.core.next(arglist__17163));
      return G__17162__delegate(f, coll, colls)
    };
    G__17162.cljs$lang$arity$variadic = G__17162__delegate;
    return G__17162
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
    var temp__3974__auto____17173 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17173) {
      var s__17174 = temp__3974__auto____17173;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__17174)) {
        var c__17175 = cljs.core.chunk_first.call(null, s__17174);
        var size__17176 = cljs.core.count.call(null, c__17175);
        var b__17177 = cljs.core.chunk_buffer.call(null, size__17176);
        var n__2527__auto____17178 = size__17176;
        var i__17179 = 0;
        while(true) {
          if(i__17179 < n__2527__auto____17178) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__17175, i__17179)))) {
              cljs.core.chunk_append.call(null, b__17177, cljs.core._nth.call(null, c__17175, i__17179))
            }else {
            }
            var G__17182 = i__17179 + 1;
            i__17179 = G__17182;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__17177), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__17174)))
      }else {
        var f__17180 = cljs.core.first.call(null, s__17174);
        var r__17181 = cljs.core.rest.call(null, s__17174);
        if(cljs.core.truth_(pred.call(null, f__17180))) {
          return cljs.core.cons.call(null, f__17180, filter.call(null, pred, r__17181))
        }else {
          return filter.call(null, pred, r__17181)
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
  var walk__17185 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__17185.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__17183_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__17183_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__17189__17190 = to;
    if(G__17189__17190) {
      if(function() {
        var or__3824__auto____17191 = G__17189__17190.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____17191) {
          return or__3824__auto____17191
        }else {
          return G__17189__17190.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__17189__17190.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__17189__17190)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__17189__17190)
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
    var G__17192__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__17192 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__17192__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__17192.cljs$lang$maxFixedArity = 4;
    G__17192.cljs$lang$applyTo = function(arglist__17193) {
      var f = cljs.core.first(arglist__17193);
      var c1 = cljs.core.first(cljs.core.next(arglist__17193));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17193)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17193))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17193))));
      return G__17192__delegate(f, c1, c2, c3, colls)
    };
    G__17192.cljs$lang$arity$variadic = G__17192__delegate;
    return G__17192
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
      var temp__3974__auto____17200 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17200) {
        var s__17201 = temp__3974__auto____17200;
        var p__17202 = cljs.core.take.call(null, n, s__17201);
        if(n === cljs.core.count.call(null, p__17202)) {
          return cljs.core.cons.call(null, p__17202, partition.call(null, n, step, cljs.core.drop.call(null, step, s__17201)))
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
      var temp__3974__auto____17203 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17203) {
        var s__17204 = temp__3974__auto____17203;
        var p__17205 = cljs.core.take.call(null, n, s__17204);
        if(n === cljs.core.count.call(null, p__17205)) {
          return cljs.core.cons.call(null, p__17205, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__17204)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__17205, pad)))
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
    var sentinel__17210 = cljs.core.lookup_sentinel;
    var m__17211 = m;
    var ks__17212 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__17212) {
        var m__17213 = cljs.core._lookup.call(null, m__17211, cljs.core.first.call(null, ks__17212), sentinel__17210);
        if(sentinel__17210 === m__17213) {
          return not_found
        }else {
          var G__17214 = sentinel__17210;
          var G__17215 = m__17213;
          var G__17216 = cljs.core.next.call(null, ks__17212);
          sentinel__17210 = G__17214;
          m__17211 = G__17215;
          ks__17212 = G__17216;
          continue
        }
      }else {
        return m__17211
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
cljs.core.assoc_in = function assoc_in(m, p__17217, v) {
  var vec__17222__17223 = p__17217;
  var k__17224 = cljs.core.nth.call(null, vec__17222__17223, 0, null);
  var ks__17225 = cljs.core.nthnext.call(null, vec__17222__17223, 1);
  if(cljs.core.truth_(ks__17225)) {
    return cljs.core.assoc.call(null, m, k__17224, assoc_in.call(null, cljs.core._lookup.call(null, m, k__17224, null), ks__17225, v))
  }else {
    return cljs.core.assoc.call(null, m, k__17224, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__17226, f, args) {
    var vec__17231__17232 = p__17226;
    var k__17233 = cljs.core.nth.call(null, vec__17231__17232, 0, null);
    var ks__17234 = cljs.core.nthnext.call(null, vec__17231__17232, 1);
    if(cljs.core.truth_(ks__17234)) {
      return cljs.core.assoc.call(null, m, k__17233, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__17233, null), ks__17234, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__17233, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__17233, null), args))
    }
  };
  var update_in = function(m, p__17226, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__17226, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__17235) {
    var m = cljs.core.first(arglist__17235);
    var p__17226 = cljs.core.first(cljs.core.next(arglist__17235));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17235)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17235)));
    return update_in__delegate(m, p__17226, f, args)
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
  var this__17238 = this;
  var h__2192__auto____17239 = this__17238.__hash;
  if(!(h__2192__auto____17239 == null)) {
    return h__2192__auto____17239
  }else {
    var h__2192__auto____17240 = cljs.core.hash_coll.call(null, coll);
    this__17238.__hash = h__2192__auto____17240;
    return h__2192__auto____17240
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17241 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17242 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17243 = this;
  var new_array__17244 = this__17243.array.slice();
  new_array__17244[k] = v;
  return new cljs.core.Vector(this__17243.meta, new_array__17244, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__17275 = null;
  var G__17275__2 = function(this_sym17245, k) {
    var this__17247 = this;
    var this_sym17245__17248 = this;
    var coll__17249 = this_sym17245__17248;
    return coll__17249.cljs$core$ILookup$_lookup$arity$2(coll__17249, k)
  };
  var G__17275__3 = function(this_sym17246, k, not_found) {
    var this__17247 = this;
    var this_sym17246__17250 = this;
    var coll__17251 = this_sym17246__17250;
    return coll__17251.cljs$core$ILookup$_lookup$arity$3(coll__17251, k, not_found)
  };
  G__17275 = function(this_sym17246, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17275__2.call(this, this_sym17246, k);
      case 3:
        return G__17275__3.call(this, this_sym17246, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17275
}();
cljs.core.Vector.prototype.apply = function(this_sym17236, args17237) {
  var this__17252 = this;
  return this_sym17236.call.apply(this_sym17236, [this_sym17236].concat(args17237.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17253 = this;
  var new_array__17254 = this__17253.array.slice();
  new_array__17254.push(o);
  return new cljs.core.Vector(this__17253.meta, new_array__17254, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__17255 = this;
  var this__17256 = this;
  return cljs.core.pr_str.call(null, this__17256)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__17257 = this;
  return cljs.core.ci_reduce.call(null, this__17257.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__17258 = this;
  return cljs.core.ci_reduce.call(null, this__17258.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17259 = this;
  if(this__17259.array.length > 0) {
    var vector_seq__17260 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__17259.array.length) {
          return cljs.core.cons.call(null, this__17259.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__17260.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17261 = this;
  return this__17261.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__17262 = this;
  var count__17263 = this__17262.array.length;
  if(count__17263 > 0) {
    return this__17262.array[count__17263 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__17264 = this;
  if(this__17264.array.length > 0) {
    var new_array__17265 = this__17264.array.slice();
    new_array__17265.pop();
    return new cljs.core.Vector(this__17264.meta, new_array__17265, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__17266 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17267 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17268 = this;
  return new cljs.core.Vector(meta, this__17268.array, this__17268.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17269 = this;
  return this__17269.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__17270 = this;
  if(function() {
    var and__3822__auto____17271 = 0 <= n;
    if(and__3822__auto____17271) {
      return n < this__17270.array.length
    }else {
      return and__3822__auto____17271
    }
  }()) {
    return this__17270.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__17272 = this;
  if(function() {
    var and__3822__auto____17273 = 0 <= n;
    if(and__3822__auto____17273) {
      return n < this__17272.array.length
    }else {
      return and__3822__auto____17273
    }
  }()) {
    return this__17272.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17274 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__17274.meta)
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
  var cnt__17277 = pv.cnt;
  if(cnt__17277 < 32) {
    return 0
  }else {
    return cnt__17277 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__17283 = level;
  var ret__17284 = node;
  while(true) {
    if(ll__17283 === 0) {
      return ret__17284
    }else {
      var embed__17285 = ret__17284;
      var r__17286 = cljs.core.pv_fresh_node.call(null, edit);
      var ___17287 = cljs.core.pv_aset.call(null, r__17286, 0, embed__17285);
      var G__17288 = ll__17283 - 5;
      var G__17289 = r__17286;
      ll__17283 = G__17288;
      ret__17284 = G__17289;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__17295 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__17296 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__17295, subidx__17296, tailnode);
    return ret__17295
  }else {
    var child__17297 = cljs.core.pv_aget.call(null, parent, subidx__17296);
    if(!(child__17297 == null)) {
      var node_to_insert__17298 = push_tail.call(null, pv, level - 5, child__17297, tailnode);
      cljs.core.pv_aset.call(null, ret__17295, subidx__17296, node_to_insert__17298);
      return ret__17295
    }else {
      var node_to_insert__17299 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__17295, subidx__17296, node_to_insert__17299);
      return ret__17295
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____17303 = 0 <= i;
    if(and__3822__auto____17303) {
      return i < pv.cnt
    }else {
      return and__3822__auto____17303
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__17304 = pv.root;
      var level__17305 = pv.shift;
      while(true) {
        if(level__17305 > 0) {
          var G__17306 = cljs.core.pv_aget.call(null, node__17304, i >>> level__17305 & 31);
          var G__17307 = level__17305 - 5;
          node__17304 = G__17306;
          level__17305 = G__17307;
          continue
        }else {
          return node__17304.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__17310 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__17310, i & 31, val);
    return ret__17310
  }else {
    var subidx__17311 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__17310, subidx__17311, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__17311), i, val));
    return ret__17310
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__17317 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__17318 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__17317));
    if(function() {
      var and__3822__auto____17319 = new_child__17318 == null;
      if(and__3822__auto____17319) {
        return subidx__17317 === 0
      }else {
        return and__3822__auto____17319
      }
    }()) {
      return null
    }else {
      var ret__17320 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__17320, subidx__17317, new_child__17318);
      return ret__17320
    }
  }else {
    if(subidx__17317 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__17321 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__17321, subidx__17317, null);
        return ret__17321
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
  var this__17324 = this;
  return new cljs.core.TransientVector(this__17324.cnt, this__17324.shift, cljs.core.tv_editable_root.call(null, this__17324.root), cljs.core.tv_editable_tail.call(null, this__17324.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17325 = this;
  var h__2192__auto____17326 = this__17325.__hash;
  if(!(h__2192__auto____17326 == null)) {
    return h__2192__auto____17326
  }else {
    var h__2192__auto____17327 = cljs.core.hash_coll.call(null, coll);
    this__17325.__hash = h__2192__auto____17327;
    return h__2192__auto____17327
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17328 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17329 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17330 = this;
  if(function() {
    var and__3822__auto____17331 = 0 <= k;
    if(and__3822__auto____17331) {
      return k < this__17330.cnt
    }else {
      return and__3822__auto____17331
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__17332 = this__17330.tail.slice();
      new_tail__17332[k & 31] = v;
      return new cljs.core.PersistentVector(this__17330.meta, this__17330.cnt, this__17330.shift, this__17330.root, new_tail__17332, null)
    }else {
      return new cljs.core.PersistentVector(this__17330.meta, this__17330.cnt, this__17330.shift, cljs.core.do_assoc.call(null, coll, this__17330.shift, this__17330.root, k, v), this__17330.tail, null)
    }
  }else {
    if(k === this__17330.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__17330.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__17380 = null;
  var G__17380__2 = function(this_sym17333, k) {
    var this__17335 = this;
    var this_sym17333__17336 = this;
    var coll__17337 = this_sym17333__17336;
    return coll__17337.cljs$core$ILookup$_lookup$arity$2(coll__17337, k)
  };
  var G__17380__3 = function(this_sym17334, k, not_found) {
    var this__17335 = this;
    var this_sym17334__17338 = this;
    var coll__17339 = this_sym17334__17338;
    return coll__17339.cljs$core$ILookup$_lookup$arity$3(coll__17339, k, not_found)
  };
  G__17380 = function(this_sym17334, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17380__2.call(this, this_sym17334, k);
      case 3:
        return G__17380__3.call(this, this_sym17334, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17380
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym17322, args17323) {
  var this__17340 = this;
  return this_sym17322.call.apply(this_sym17322, [this_sym17322].concat(args17323.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__17341 = this;
  var step_init__17342 = [0, init];
  var i__17343 = 0;
  while(true) {
    if(i__17343 < this__17341.cnt) {
      var arr__17344 = cljs.core.array_for.call(null, v, i__17343);
      var len__17345 = arr__17344.length;
      var init__17349 = function() {
        var j__17346 = 0;
        var init__17347 = step_init__17342[1];
        while(true) {
          if(j__17346 < len__17345) {
            var init__17348 = f.call(null, init__17347, j__17346 + i__17343, arr__17344[j__17346]);
            if(cljs.core.reduced_QMARK_.call(null, init__17348)) {
              return init__17348
            }else {
              var G__17381 = j__17346 + 1;
              var G__17382 = init__17348;
              j__17346 = G__17381;
              init__17347 = G__17382;
              continue
            }
          }else {
            step_init__17342[0] = len__17345;
            step_init__17342[1] = init__17347;
            return init__17347
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__17349)) {
        return cljs.core.deref.call(null, init__17349)
      }else {
        var G__17383 = i__17343 + step_init__17342[0];
        i__17343 = G__17383;
        continue
      }
    }else {
      return step_init__17342[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17350 = this;
  if(this__17350.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__17351 = this__17350.tail.slice();
    new_tail__17351.push(o);
    return new cljs.core.PersistentVector(this__17350.meta, this__17350.cnt + 1, this__17350.shift, this__17350.root, new_tail__17351, null)
  }else {
    var root_overflow_QMARK___17352 = this__17350.cnt >>> 5 > 1 << this__17350.shift;
    var new_shift__17353 = root_overflow_QMARK___17352 ? this__17350.shift + 5 : this__17350.shift;
    var new_root__17355 = root_overflow_QMARK___17352 ? function() {
      var n_r__17354 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__17354, 0, this__17350.root);
      cljs.core.pv_aset.call(null, n_r__17354, 1, cljs.core.new_path.call(null, null, this__17350.shift, new cljs.core.VectorNode(null, this__17350.tail)));
      return n_r__17354
    }() : cljs.core.push_tail.call(null, coll, this__17350.shift, this__17350.root, new cljs.core.VectorNode(null, this__17350.tail));
    return new cljs.core.PersistentVector(this__17350.meta, this__17350.cnt + 1, new_shift__17353, new_root__17355, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__17356 = this;
  if(this__17356.cnt > 0) {
    return new cljs.core.RSeq(coll, this__17356.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__17357 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__17358 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__17359 = this;
  var this__17360 = this;
  return cljs.core.pr_str.call(null, this__17360)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__17361 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__17362 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17363 = this;
  if(this__17363.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17364 = this;
  return this__17364.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__17365 = this;
  if(this__17365.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__17365.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__17366 = this;
  if(this__17366.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__17366.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__17366.meta)
    }else {
      if(1 < this__17366.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__17366.meta, this__17366.cnt - 1, this__17366.shift, this__17366.root, this__17366.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__17367 = cljs.core.array_for.call(null, coll, this__17366.cnt - 2);
          var nr__17368 = cljs.core.pop_tail.call(null, coll, this__17366.shift, this__17366.root);
          var new_root__17369 = nr__17368 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__17368;
          var cnt_1__17370 = this__17366.cnt - 1;
          if(function() {
            var and__3822__auto____17371 = 5 < this__17366.shift;
            if(and__3822__auto____17371) {
              return cljs.core.pv_aget.call(null, new_root__17369, 1) == null
            }else {
              return and__3822__auto____17371
            }
          }()) {
            return new cljs.core.PersistentVector(this__17366.meta, cnt_1__17370, this__17366.shift - 5, cljs.core.pv_aget.call(null, new_root__17369, 0), new_tail__17367, null)
          }else {
            return new cljs.core.PersistentVector(this__17366.meta, cnt_1__17370, this__17366.shift, new_root__17369, new_tail__17367, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__17372 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17373 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17374 = this;
  return new cljs.core.PersistentVector(meta, this__17374.cnt, this__17374.shift, this__17374.root, this__17374.tail, this__17374.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17375 = this;
  return this__17375.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__17376 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__17377 = this;
  if(function() {
    var and__3822__auto____17378 = 0 <= n;
    if(and__3822__auto____17378) {
      return n < this__17377.cnt
    }else {
      return and__3822__auto____17378
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17379 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__17379.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__17384 = xs.length;
  var xs__17385 = no_clone === true ? xs : xs.slice();
  if(l__17384 < 32) {
    return new cljs.core.PersistentVector(null, l__17384, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__17385, null)
  }else {
    var node__17386 = xs__17385.slice(0, 32);
    var v__17387 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__17386, null);
    var i__17388 = 32;
    var out__17389 = cljs.core._as_transient.call(null, v__17387);
    while(true) {
      if(i__17388 < l__17384) {
        var G__17390 = i__17388 + 1;
        var G__17391 = cljs.core.conj_BANG_.call(null, out__17389, xs__17385[i__17388]);
        i__17388 = G__17390;
        out__17389 = G__17391;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__17389)
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
  vector.cljs$lang$applyTo = function(arglist__17392) {
    var args = cljs.core.seq(arglist__17392);
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
  var this__17393 = this;
  if(this__17393.off + 1 < this__17393.node.length) {
    var s__17394 = cljs.core.chunked_seq.call(null, this__17393.vec, this__17393.node, this__17393.i, this__17393.off + 1);
    if(s__17394 == null) {
      return null
    }else {
      return s__17394
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17395 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17396 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17397 = this;
  return this__17397.node[this__17397.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17398 = this;
  if(this__17398.off + 1 < this__17398.node.length) {
    var s__17399 = cljs.core.chunked_seq.call(null, this__17398.vec, this__17398.node, this__17398.i, this__17398.off + 1);
    if(s__17399 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__17399
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__17400 = this;
  var l__17401 = this__17400.node.length;
  var s__17402 = this__17400.i + l__17401 < cljs.core._count.call(null, this__17400.vec) ? cljs.core.chunked_seq.call(null, this__17400.vec, this__17400.i + l__17401, 0) : null;
  if(s__17402 == null) {
    return null
  }else {
    return s__17402
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17403 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__17404 = this;
  return cljs.core.chunked_seq.call(null, this__17404.vec, this__17404.node, this__17404.i, this__17404.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__17405 = this;
  return this__17405.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17406 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__17406.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__17407 = this;
  return cljs.core.array_chunk.call(null, this__17407.node, this__17407.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__17408 = this;
  var l__17409 = this__17408.node.length;
  var s__17410 = this__17408.i + l__17409 < cljs.core._count.call(null, this__17408.vec) ? cljs.core.chunked_seq.call(null, this__17408.vec, this__17408.i + l__17409, 0) : null;
  if(s__17410 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__17410
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
  var this__17413 = this;
  var h__2192__auto____17414 = this__17413.__hash;
  if(!(h__2192__auto____17414 == null)) {
    return h__2192__auto____17414
  }else {
    var h__2192__auto____17415 = cljs.core.hash_coll.call(null, coll);
    this__17413.__hash = h__2192__auto____17415;
    return h__2192__auto____17415
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17416 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17417 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__17418 = this;
  var v_pos__17419 = this__17418.start + key;
  return new cljs.core.Subvec(this__17418.meta, cljs.core._assoc.call(null, this__17418.v, v_pos__17419, val), this__17418.start, this__17418.end > v_pos__17419 + 1 ? this__17418.end : v_pos__17419 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__17445 = null;
  var G__17445__2 = function(this_sym17420, k) {
    var this__17422 = this;
    var this_sym17420__17423 = this;
    var coll__17424 = this_sym17420__17423;
    return coll__17424.cljs$core$ILookup$_lookup$arity$2(coll__17424, k)
  };
  var G__17445__3 = function(this_sym17421, k, not_found) {
    var this__17422 = this;
    var this_sym17421__17425 = this;
    var coll__17426 = this_sym17421__17425;
    return coll__17426.cljs$core$ILookup$_lookup$arity$3(coll__17426, k, not_found)
  };
  G__17445 = function(this_sym17421, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17445__2.call(this, this_sym17421, k);
      case 3:
        return G__17445__3.call(this, this_sym17421, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17445
}();
cljs.core.Subvec.prototype.apply = function(this_sym17411, args17412) {
  var this__17427 = this;
  return this_sym17411.call.apply(this_sym17411, [this_sym17411].concat(args17412.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17428 = this;
  return new cljs.core.Subvec(this__17428.meta, cljs.core._assoc_n.call(null, this__17428.v, this__17428.end, o), this__17428.start, this__17428.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__17429 = this;
  var this__17430 = this;
  return cljs.core.pr_str.call(null, this__17430)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__17431 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__17432 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17433 = this;
  var subvec_seq__17434 = function subvec_seq(i) {
    if(i === this__17433.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__17433.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__17434.call(null, this__17433.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17435 = this;
  return this__17435.end - this__17435.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__17436 = this;
  return cljs.core._nth.call(null, this__17436.v, this__17436.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__17437 = this;
  if(this__17437.start === this__17437.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__17437.meta, this__17437.v, this__17437.start, this__17437.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__17438 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17439 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17440 = this;
  return new cljs.core.Subvec(meta, this__17440.v, this__17440.start, this__17440.end, this__17440.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17441 = this;
  return this__17441.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__17442 = this;
  return cljs.core._nth.call(null, this__17442.v, this__17442.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__17443 = this;
  return cljs.core._nth.call(null, this__17443.v, this__17443.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17444 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__17444.meta)
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
  var ret__17447 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__17447, 0, tl.length);
  return ret__17447
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__17451 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__17452 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__17451, subidx__17452, level === 5 ? tail_node : function() {
    var child__17453 = cljs.core.pv_aget.call(null, ret__17451, subidx__17452);
    if(!(child__17453 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__17453, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__17451
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__17458 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__17459 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__17460 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__17458, subidx__17459));
    if(function() {
      var and__3822__auto____17461 = new_child__17460 == null;
      if(and__3822__auto____17461) {
        return subidx__17459 === 0
      }else {
        return and__3822__auto____17461
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__17458, subidx__17459, new_child__17460);
      return node__17458
    }
  }else {
    if(subidx__17459 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__17458, subidx__17459, null);
        return node__17458
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____17466 = 0 <= i;
    if(and__3822__auto____17466) {
      return i < tv.cnt
    }else {
      return and__3822__auto____17466
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__17467 = tv.root;
      var node__17468 = root__17467;
      var level__17469 = tv.shift;
      while(true) {
        if(level__17469 > 0) {
          var G__17470 = cljs.core.tv_ensure_editable.call(null, root__17467.edit, cljs.core.pv_aget.call(null, node__17468, i >>> level__17469 & 31));
          var G__17471 = level__17469 - 5;
          node__17468 = G__17470;
          level__17469 = G__17471;
          continue
        }else {
          return node__17468.arr
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
  var G__17511 = null;
  var G__17511__2 = function(this_sym17474, k) {
    var this__17476 = this;
    var this_sym17474__17477 = this;
    var coll__17478 = this_sym17474__17477;
    return coll__17478.cljs$core$ILookup$_lookup$arity$2(coll__17478, k)
  };
  var G__17511__3 = function(this_sym17475, k, not_found) {
    var this__17476 = this;
    var this_sym17475__17479 = this;
    var coll__17480 = this_sym17475__17479;
    return coll__17480.cljs$core$ILookup$_lookup$arity$3(coll__17480, k, not_found)
  };
  G__17511 = function(this_sym17475, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17511__2.call(this, this_sym17475, k);
      case 3:
        return G__17511__3.call(this, this_sym17475, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17511
}();
cljs.core.TransientVector.prototype.apply = function(this_sym17472, args17473) {
  var this__17481 = this;
  return this_sym17472.call.apply(this_sym17472, [this_sym17472].concat(args17473.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17482 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17483 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__17484 = this;
  if(this__17484.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__17485 = this;
  if(function() {
    var and__3822__auto____17486 = 0 <= n;
    if(and__3822__auto____17486) {
      return n < this__17485.cnt
    }else {
      return and__3822__auto____17486
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17487 = this;
  if(this__17487.root.edit) {
    return this__17487.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__17488 = this;
  if(this__17488.root.edit) {
    if(function() {
      var and__3822__auto____17489 = 0 <= n;
      if(and__3822__auto____17489) {
        return n < this__17488.cnt
      }else {
        return and__3822__auto____17489
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__17488.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__17494 = function go(level, node) {
          var node__17492 = cljs.core.tv_ensure_editable.call(null, this__17488.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__17492, n & 31, val);
            return node__17492
          }else {
            var subidx__17493 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__17492, subidx__17493, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__17492, subidx__17493)));
            return node__17492
          }
        }.call(null, this__17488.shift, this__17488.root);
        this__17488.root = new_root__17494;
        return tcoll
      }
    }else {
      if(n === this__17488.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__17488.cnt)].join(""));
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
  var this__17495 = this;
  if(this__17495.root.edit) {
    if(this__17495.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__17495.cnt) {
        this__17495.cnt = 0;
        return tcoll
      }else {
        if((this__17495.cnt - 1 & 31) > 0) {
          this__17495.cnt = this__17495.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__17496 = cljs.core.editable_array_for.call(null, tcoll, this__17495.cnt - 2);
            var new_root__17498 = function() {
              var nr__17497 = cljs.core.tv_pop_tail.call(null, tcoll, this__17495.shift, this__17495.root);
              if(!(nr__17497 == null)) {
                return nr__17497
              }else {
                return new cljs.core.VectorNode(this__17495.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____17499 = 5 < this__17495.shift;
              if(and__3822__auto____17499) {
                return cljs.core.pv_aget.call(null, new_root__17498, 1) == null
              }else {
                return and__3822__auto____17499
              }
            }()) {
              var new_root__17500 = cljs.core.tv_ensure_editable.call(null, this__17495.root.edit, cljs.core.pv_aget.call(null, new_root__17498, 0));
              this__17495.root = new_root__17500;
              this__17495.shift = this__17495.shift - 5;
              this__17495.cnt = this__17495.cnt - 1;
              this__17495.tail = new_tail__17496;
              return tcoll
            }else {
              this__17495.root = new_root__17498;
              this__17495.cnt = this__17495.cnt - 1;
              this__17495.tail = new_tail__17496;
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
  var this__17501 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__17502 = this;
  if(this__17502.root.edit) {
    if(this__17502.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__17502.tail[this__17502.cnt & 31] = o;
      this__17502.cnt = this__17502.cnt + 1;
      return tcoll
    }else {
      var tail_node__17503 = new cljs.core.VectorNode(this__17502.root.edit, this__17502.tail);
      var new_tail__17504 = cljs.core.make_array.call(null, 32);
      new_tail__17504[0] = o;
      this__17502.tail = new_tail__17504;
      if(this__17502.cnt >>> 5 > 1 << this__17502.shift) {
        var new_root_array__17505 = cljs.core.make_array.call(null, 32);
        var new_shift__17506 = this__17502.shift + 5;
        new_root_array__17505[0] = this__17502.root;
        new_root_array__17505[1] = cljs.core.new_path.call(null, this__17502.root.edit, this__17502.shift, tail_node__17503);
        this__17502.root = new cljs.core.VectorNode(this__17502.root.edit, new_root_array__17505);
        this__17502.shift = new_shift__17506;
        this__17502.cnt = this__17502.cnt + 1;
        return tcoll
      }else {
        var new_root__17507 = cljs.core.tv_push_tail.call(null, tcoll, this__17502.shift, this__17502.root, tail_node__17503);
        this__17502.root = new_root__17507;
        this__17502.cnt = this__17502.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__17508 = this;
  if(this__17508.root.edit) {
    this__17508.root.edit = null;
    var len__17509 = this__17508.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__17510 = cljs.core.make_array.call(null, len__17509);
    cljs.core.array_copy.call(null, this__17508.tail, 0, trimmed_tail__17510, 0, len__17509);
    return new cljs.core.PersistentVector(null, this__17508.cnt, this__17508.shift, this__17508.root, trimmed_tail__17510, null)
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
  var this__17512 = this;
  var h__2192__auto____17513 = this__17512.__hash;
  if(!(h__2192__auto____17513 == null)) {
    return h__2192__auto____17513
  }else {
    var h__2192__auto____17514 = cljs.core.hash_coll.call(null, coll);
    this__17512.__hash = h__2192__auto____17514;
    return h__2192__auto____17514
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17515 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__17516 = this;
  var this__17517 = this;
  return cljs.core.pr_str.call(null, this__17517)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17518 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17519 = this;
  return cljs.core._first.call(null, this__17519.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17520 = this;
  var temp__3971__auto____17521 = cljs.core.next.call(null, this__17520.front);
  if(temp__3971__auto____17521) {
    var f1__17522 = temp__3971__auto____17521;
    return new cljs.core.PersistentQueueSeq(this__17520.meta, f1__17522, this__17520.rear, null)
  }else {
    if(this__17520.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__17520.meta, this__17520.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17523 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17524 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__17524.front, this__17524.rear, this__17524.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17525 = this;
  return this__17525.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17526 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17526.meta)
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
  var this__17527 = this;
  var h__2192__auto____17528 = this__17527.__hash;
  if(!(h__2192__auto____17528 == null)) {
    return h__2192__auto____17528
  }else {
    var h__2192__auto____17529 = cljs.core.hash_coll.call(null, coll);
    this__17527.__hash = h__2192__auto____17529;
    return h__2192__auto____17529
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17530 = this;
  if(cljs.core.truth_(this__17530.front)) {
    return new cljs.core.PersistentQueue(this__17530.meta, this__17530.count + 1, this__17530.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____17531 = this__17530.rear;
      if(cljs.core.truth_(or__3824__auto____17531)) {
        return or__3824__auto____17531
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__17530.meta, this__17530.count + 1, cljs.core.conj.call(null, this__17530.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__17532 = this;
  var this__17533 = this;
  return cljs.core.pr_str.call(null, this__17533)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17534 = this;
  var rear__17535 = cljs.core.seq.call(null, this__17534.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____17536 = this__17534.front;
    if(cljs.core.truth_(or__3824__auto____17536)) {
      return or__3824__auto____17536
    }else {
      return rear__17535
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__17534.front, cljs.core.seq.call(null, rear__17535), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17537 = this;
  return this__17537.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__17538 = this;
  return cljs.core._first.call(null, this__17538.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__17539 = this;
  if(cljs.core.truth_(this__17539.front)) {
    var temp__3971__auto____17540 = cljs.core.next.call(null, this__17539.front);
    if(temp__3971__auto____17540) {
      var f1__17541 = temp__3971__auto____17540;
      return new cljs.core.PersistentQueue(this__17539.meta, this__17539.count - 1, f1__17541, this__17539.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__17539.meta, this__17539.count - 1, cljs.core.seq.call(null, this__17539.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17542 = this;
  return cljs.core.first.call(null, this__17542.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17543 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17544 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17545 = this;
  return new cljs.core.PersistentQueue(meta, this__17545.count, this__17545.front, this__17545.rear, this__17545.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17546 = this;
  return this__17546.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17547 = this;
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
  var this__17548 = this;
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
  var len__17551 = array.length;
  var i__17552 = 0;
  while(true) {
    if(i__17552 < len__17551) {
      if(k === array[i__17552]) {
        return i__17552
      }else {
        var G__17553 = i__17552 + incr;
        i__17552 = G__17553;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__17556 = cljs.core.hash.call(null, a);
  var b__17557 = cljs.core.hash.call(null, b);
  if(a__17556 < b__17557) {
    return-1
  }else {
    if(a__17556 > b__17557) {
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
  var ks__17565 = m.keys;
  var len__17566 = ks__17565.length;
  var so__17567 = m.strobj;
  var out__17568 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__17569 = 0;
  var out__17570 = cljs.core.transient$.call(null, out__17568);
  while(true) {
    if(i__17569 < len__17566) {
      var k__17571 = ks__17565[i__17569];
      var G__17572 = i__17569 + 1;
      var G__17573 = cljs.core.assoc_BANG_.call(null, out__17570, k__17571, so__17567[k__17571]);
      i__17569 = G__17572;
      out__17570 = G__17573;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__17570, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__17579 = {};
  var l__17580 = ks.length;
  var i__17581 = 0;
  while(true) {
    if(i__17581 < l__17580) {
      var k__17582 = ks[i__17581];
      new_obj__17579[k__17582] = obj[k__17582];
      var G__17583 = i__17581 + 1;
      i__17581 = G__17583;
      continue
    }else {
    }
    break
  }
  return new_obj__17579
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
  var this__17586 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17587 = this;
  var h__2192__auto____17588 = this__17587.__hash;
  if(!(h__2192__auto____17588 == null)) {
    return h__2192__auto____17588
  }else {
    var h__2192__auto____17589 = cljs.core.hash_imap.call(null, coll);
    this__17587.__hash = h__2192__auto____17589;
    return h__2192__auto____17589
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17590 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17591 = this;
  if(function() {
    var and__3822__auto____17592 = goog.isString(k);
    if(and__3822__auto____17592) {
      return!(cljs.core.scan_array.call(null, 1, k, this__17591.keys) == null)
    }else {
      return and__3822__auto____17592
    }
  }()) {
    return this__17591.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17593 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____17594 = this__17593.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____17594) {
        return or__3824__auto____17594
      }else {
        return this__17593.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__17593.keys) == null)) {
        var new_strobj__17595 = cljs.core.obj_clone.call(null, this__17593.strobj, this__17593.keys);
        new_strobj__17595[k] = v;
        return new cljs.core.ObjMap(this__17593.meta, this__17593.keys, new_strobj__17595, this__17593.update_count + 1, null)
      }else {
        var new_strobj__17596 = cljs.core.obj_clone.call(null, this__17593.strobj, this__17593.keys);
        var new_keys__17597 = this__17593.keys.slice();
        new_strobj__17596[k] = v;
        new_keys__17597.push(k);
        return new cljs.core.ObjMap(this__17593.meta, new_keys__17597, new_strobj__17596, this__17593.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__17598 = this;
  if(function() {
    var and__3822__auto____17599 = goog.isString(k);
    if(and__3822__auto____17599) {
      return!(cljs.core.scan_array.call(null, 1, k, this__17598.keys) == null)
    }else {
      return and__3822__auto____17599
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__17621 = null;
  var G__17621__2 = function(this_sym17600, k) {
    var this__17602 = this;
    var this_sym17600__17603 = this;
    var coll__17604 = this_sym17600__17603;
    return coll__17604.cljs$core$ILookup$_lookup$arity$2(coll__17604, k)
  };
  var G__17621__3 = function(this_sym17601, k, not_found) {
    var this__17602 = this;
    var this_sym17601__17605 = this;
    var coll__17606 = this_sym17601__17605;
    return coll__17606.cljs$core$ILookup$_lookup$arity$3(coll__17606, k, not_found)
  };
  G__17621 = function(this_sym17601, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17621__2.call(this, this_sym17601, k);
      case 3:
        return G__17621__3.call(this, this_sym17601, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17621
}();
cljs.core.ObjMap.prototype.apply = function(this_sym17584, args17585) {
  var this__17607 = this;
  return this_sym17584.call.apply(this_sym17584, [this_sym17584].concat(args17585.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__17608 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__17609 = this;
  var this__17610 = this;
  return cljs.core.pr_str.call(null, this__17610)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17611 = this;
  if(this__17611.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__17574_SHARP_) {
      return cljs.core.vector.call(null, p1__17574_SHARP_, this__17611.strobj[p1__17574_SHARP_])
    }, this__17611.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17612 = this;
  return this__17612.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17613 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17614 = this;
  return new cljs.core.ObjMap(meta, this__17614.keys, this__17614.strobj, this__17614.update_count, this__17614.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17615 = this;
  return this__17615.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17616 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__17616.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__17617 = this;
  if(function() {
    var and__3822__auto____17618 = goog.isString(k);
    if(and__3822__auto____17618) {
      return!(cljs.core.scan_array.call(null, 1, k, this__17617.keys) == null)
    }else {
      return and__3822__auto____17618
    }
  }()) {
    var new_keys__17619 = this__17617.keys.slice();
    var new_strobj__17620 = cljs.core.obj_clone.call(null, this__17617.strobj, this__17617.keys);
    new_keys__17619.splice(cljs.core.scan_array.call(null, 1, k, new_keys__17619), 1);
    cljs.core.js_delete.call(null, new_strobj__17620, k);
    return new cljs.core.ObjMap(this__17617.meta, new_keys__17619, new_strobj__17620, this__17617.update_count + 1, null)
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
  var this__17625 = this;
  var h__2192__auto____17626 = this__17625.__hash;
  if(!(h__2192__auto____17626 == null)) {
    return h__2192__auto____17626
  }else {
    var h__2192__auto____17627 = cljs.core.hash_imap.call(null, coll);
    this__17625.__hash = h__2192__auto____17627;
    return h__2192__auto____17627
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17628 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17629 = this;
  var bucket__17630 = this__17629.hashobj[cljs.core.hash.call(null, k)];
  var i__17631 = cljs.core.truth_(bucket__17630) ? cljs.core.scan_array.call(null, 2, k, bucket__17630) : null;
  if(cljs.core.truth_(i__17631)) {
    return bucket__17630[i__17631 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17632 = this;
  var h__17633 = cljs.core.hash.call(null, k);
  var bucket__17634 = this__17632.hashobj[h__17633];
  if(cljs.core.truth_(bucket__17634)) {
    var new_bucket__17635 = bucket__17634.slice();
    var new_hashobj__17636 = goog.object.clone(this__17632.hashobj);
    new_hashobj__17636[h__17633] = new_bucket__17635;
    var temp__3971__auto____17637 = cljs.core.scan_array.call(null, 2, k, new_bucket__17635);
    if(cljs.core.truth_(temp__3971__auto____17637)) {
      var i__17638 = temp__3971__auto____17637;
      new_bucket__17635[i__17638 + 1] = v;
      return new cljs.core.HashMap(this__17632.meta, this__17632.count, new_hashobj__17636, null)
    }else {
      new_bucket__17635.push(k, v);
      return new cljs.core.HashMap(this__17632.meta, this__17632.count + 1, new_hashobj__17636, null)
    }
  }else {
    var new_hashobj__17639 = goog.object.clone(this__17632.hashobj);
    new_hashobj__17639[h__17633] = [k, v];
    return new cljs.core.HashMap(this__17632.meta, this__17632.count + 1, new_hashobj__17639, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__17640 = this;
  var bucket__17641 = this__17640.hashobj[cljs.core.hash.call(null, k)];
  var i__17642 = cljs.core.truth_(bucket__17641) ? cljs.core.scan_array.call(null, 2, k, bucket__17641) : null;
  if(cljs.core.truth_(i__17642)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__17667 = null;
  var G__17667__2 = function(this_sym17643, k) {
    var this__17645 = this;
    var this_sym17643__17646 = this;
    var coll__17647 = this_sym17643__17646;
    return coll__17647.cljs$core$ILookup$_lookup$arity$2(coll__17647, k)
  };
  var G__17667__3 = function(this_sym17644, k, not_found) {
    var this__17645 = this;
    var this_sym17644__17648 = this;
    var coll__17649 = this_sym17644__17648;
    return coll__17649.cljs$core$ILookup$_lookup$arity$3(coll__17649, k, not_found)
  };
  G__17667 = function(this_sym17644, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17667__2.call(this, this_sym17644, k);
      case 3:
        return G__17667__3.call(this, this_sym17644, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17667
}();
cljs.core.HashMap.prototype.apply = function(this_sym17623, args17624) {
  var this__17650 = this;
  return this_sym17623.call.apply(this_sym17623, [this_sym17623].concat(args17624.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__17651 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__17652 = this;
  var this__17653 = this;
  return cljs.core.pr_str.call(null, this__17653)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17654 = this;
  if(this__17654.count > 0) {
    var hashes__17655 = cljs.core.js_keys.call(null, this__17654.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__17622_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__17654.hashobj[p1__17622_SHARP_]))
    }, hashes__17655)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17656 = this;
  return this__17656.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17657 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17658 = this;
  return new cljs.core.HashMap(meta, this__17658.count, this__17658.hashobj, this__17658.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17659 = this;
  return this__17659.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17660 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__17660.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__17661 = this;
  var h__17662 = cljs.core.hash.call(null, k);
  var bucket__17663 = this__17661.hashobj[h__17662];
  var i__17664 = cljs.core.truth_(bucket__17663) ? cljs.core.scan_array.call(null, 2, k, bucket__17663) : null;
  if(cljs.core.not.call(null, i__17664)) {
    return coll
  }else {
    var new_hashobj__17665 = goog.object.clone(this__17661.hashobj);
    if(3 > bucket__17663.length) {
      cljs.core.js_delete.call(null, new_hashobj__17665, h__17662)
    }else {
      var new_bucket__17666 = bucket__17663.slice();
      new_bucket__17666.splice(i__17664, 2);
      new_hashobj__17665[h__17662] = new_bucket__17666
    }
    return new cljs.core.HashMap(this__17661.meta, this__17661.count - 1, new_hashobj__17665, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__17668 = ks.length;
  var i__17669 = 0;
  var out__17670 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__17669 < len__17668) {
      var G__17671 = i__17669 + 1;
      var G__17672 = cljs.core.assoc.call(null, out__17670, ks[i__17669], vs[i__17669]);
      i__17669 = G__17671;
      out__17670 = G__17672;
      continue
    }else {
      return out__17670
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__17676 = m.arr;
  var len__17677 = arr__17676.length;
  var i__17678 = 0;
  while(true) {
    if(len__17677 <= i__17678) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__17676[i__17678], k)) {
        return i__17678
      }else {
        if("\ufdd0'else") {
          var G__17679 = i__17678 + 2;
          i__17678 = G__17679;
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
  var this__17682 = this;
  return new cljs.core.TransientArrayMap({}, this__17682.arr.length, this__17682.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17683 = this;
  var h__2192__auto____17684 = this__17683.__hash;
  if(!(h__2192__auto____17684 == null)) {
    return h__2192__auto____17684
  }else {
    var h__2192__auto____17685 = cljs.core.hash_imap.call(null, coll);
    this__17683.__hash = h__2192__auto____17685;
    return h__2192__auto____17685
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17686 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17687 = this;
  var idx__17688 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__17688 === -1) {
    return not_found
  }else {
    return this__17687.arr[idx__17688 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17689 = this;
  var idx__17690 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__17690 === -1) {
    if(this__17689.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__17689.meta, this__17689.cnt + 1, function() {
        var G__17691__17692 = this__17689.arr.slice();
        G__17691__17692.push(k);
        G__17691__17692.push(v);
        return G__17691__17692
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__17689.arr[idx__17690 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__17689.meta, this__17689.cnt, function() {
          var G__17693__17694 = this__17689.arr.slice();
          G__17693__17694[idx__17690 + 1] = v;
          return G__17693__17694
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__17695 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__17727 = null;
  var G__17727__2 = function(this_sym17696, k) {
    var this__17698 = this;
    var this_sym17696__17699 = this;
    var coll__17700 = this_sym17696__17699;
    return coll__17700.cljs$core$ILookup$_lookup$arity$2(coll__17700, k)
  };
  var G__17727__3 = function(this_sym17697, k, not_found) {
    var this__17698 = this;
    var this_sym17697__17701 = this;
    var coll__17702 = this_sym17697__17701;
    return coll__17702.cljs$core$ILookup$_lookup$arity$3(coll__17702, k, not_found)
  };
  G__17727 = function(this_sym17697, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17727__2.call(this, this_sym17697, k);
      case 3:
        return G__17727__3.call(this, this_sym17697, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17727
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym17680, args17681) {
  var this__17703 = this;
  return this_sym17680.call.apply(this_sym17680, [this_sym17680].concat(args17681.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__17704 = this;
  var len__17705 = this__17704.arr.length;
  var i__17706 = 0;
  var init__17707 = init;
  while(true) {
    if(i__17706 < len__17705) {
      var init__17708 = f.call(null, init__17707, this__17704.arr[i__17706], this__17704.arr[i__17706 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__17708)) {
        return cljs.core.deref.call(null, init__17708)
      }else {
        var G__17728 = i__17706 + 2;
        var G__17729 = init__17708;
        i__17706 = G__17728;
        init__17707 = G__17729;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__17709 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__17710 = this;
  var this__17711 = this;
  return cljs.core.pr_str.call(null, this__17711)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17712 = this;
  if(this__17712.cnt > 0) {
    var len__17713 = this__17712.arr.length;
    var array_map_seq__17714 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__17713) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__17712.arr[i], this__17712.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__17714.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17715 = this;
  return this__17715.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17716 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17717 = this;
  return new cljs.core.PersistentArrayMap(meta, this__17717.cnt, this__17717.arr, this__17717.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17718 = this;
  return this__17718.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17719 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__17719.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__17720 = this;
  var idx__17721 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__17721 >= 0) {
    var len__17722 = this__17720.arr.length;
    var new_len__17723 = len__17722 - 2;
    if(new_len__17723 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__17724 = cljs.core.make_array.call(null, new_len__17723);
      var s__17725 = 0;
      var d__17726 = 0;
      while(true) {
        if(s__17725 >= len__17722) {
          return new cljs.core.PersistentArrayMap(this__17720.meta, this__17720.cnt - 1, new_arr__17724, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__17720.arr[s__17725])) {
            var G__17730 = s__17725 + 2;
            var G__17731 = d__17726;
            s__17725 = G__17730;
            d__17726 = G__17731;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__17724[d__17726] = this__17720.arr[s__17725];
              new_arr__17724[d__17726 + 1] = this__17720.arr[s__17725 + 1];
              var G__17732 = s__17725 + 2;
              var G__17733 = d__17726 + 2;
              s__17725 = G__17732;
              d__17726 = G__17733;
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
  var len__17734 = cljs.core.count.call(null, ks);
  var i__17735 = 0;
  var out__17736 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__17735 < len__17734) {
      var G__17737 = i__17735 + 1;
      var G__17738 = cljs.core.assoc_BANG_.call(null, out__17736, ks[i__17735], vs[i__17735]);
      i__17735 = G__17737;
      out__17736 = G__17738;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__17736)
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
  var this__17739 = this;
  if(cljs.core.truth_(this__17739.editable_QMARK_)) {
    var idx__17740 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__17740 >= 0) {
      this__17739.arr[idx__17740] = this__17739.arr[this__17739.len - 2];
      this__17739.arr[idx__17740 + 1] = this__17739.arr[this__17739.len - 1];
      var G__17741__17742 = this__17739.arr;
      G__17741__17742.pop();
      G__17741__17742.pop();
      G__17741__17742;
      this__17739.len = this__17739.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__17743 = this;
  if(cljs.core.truth_(this__17743.editable_QMARK_)) {
    var idx__17744 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__17744 === -1) {
      if(this__17743.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__17743.len = this__17743.len + 2;
        this__17743.arr.push(key);
        this__17743.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__17743.len, this__17743.arr), key, val)
      }
    }else {
      if(val === this__17743.arr[idx__17744 + 1]) {
        return tcoll
      }else {
        this__17743.arr[idx__17744 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__17745 = this;
  if(cljs.core.truth_(this__17745.editable_QMARK_)) {
    if(function() {
      var G__17746__17747 = o;
      if(G__17746__17747) {
        if(function() {
          var or__3824__auto____17748 = G__17746__17747.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____17748) {
            return or__3824__auto____17748
          }else {
            return G__17746__17747.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__17746__17747.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__17746__17747)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__17746__17747)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__17749 = cljs.core.seq.call(null, o);
      var tcoll__17750 = tcoll;
      while(true) {
        var temp__3971__auto____17751 = cljs.core.first.call(null, es__17749);
        if(cljs.core.truth_(temp__3971__auto____17751)) {
          var e__17752 = temp__3971__auto____17751;
          var G__17758 = cljs.core.next.call(null, es__17749);
          var G__17759 = tcoll__17750.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__17750, cljs.core.key.call(null, e__17752), cljs.core.val.call(null, e__17752));
          es__17749 = G__17758;
          tcoll__17750 = G__17759;
          continue
        }else {
          return tcoll__17750
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__17753 = this;
  if(cljs.core.truth_(this__17753.editable_QMARK_)) {
    this__17753.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__17753.len, 2), this__17753.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__17754 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__17755 = this;
  if(cljs.core.truth_(this__17755.editable_QMARK_)) {
    var idx__17756 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__17756 === -1) {
      return not_found
    }else {
      return this__17755.arr[idx__17756 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__17757 = this;
  if(cljs.core.truth_(this__17757.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__17757.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__17762 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__17763 = 0;
  while(true) {
    if(i__17763 < len) {
      var G__17764 = cljs.core.assoc_BANG_.call(null, out__17762, arr[i__17763], arr[i__17763 + 1]);
      var G__17765 = i__17763 + 2;
      out__17762 = G__17764;
      i__17763 = G__17765;
      continue
    }else {
      return out__17762
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
    var G__17770__17771 = arr.slice();
    G__17770__17771[i] = a;
    return G__17770__17771
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__17772__17773 = arr.slice();
    G__17772__17773[i] = a;
    G__17772__17773[j] = b;
    return G__17772__17773
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
  var new_arr__17775 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__17775, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__17775, 2 * i, new_arr__17775.length - 2 * i);
  return new_arr__17775
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
    var editable__17778 = inode.ensure_editable(edit);
    editable__17778.arr[i] = a;
    return editable__17778
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__17779 = inode.ensure_editable(edit);
    editable__17779.arr[i] = a;
    editable__17779.arr[j] = b;
    return editable__17779
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
  var len__17786 = arr.length;
  var i__17787 = 0;
  var init__17788 = init;
  while(true) {
    if(i__17787 < len__17786) {
      var init__17791 = function() {
        var k__17789 = arr[i__17787];
        if(!(k__17789 == null)) {
          return f.call(null, init__17788, k__17789, arr[i__17787 + 1])
        }else {
          var node__17790 = arr[i__17787 + 1];
          if(!(node__17790 == null)) {
            return node__17790.kv_reduce(f, init__17788)
          }else {
            return init__17788
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__17791)) {
        return cljs.core.deref.call(null, init__17791)
      }else {
        var G__17792 = i__17787 + 2;
        var G__17793 = init__17791;
        i__17787 = G__17792;
        init__17788 = G__17793;
        continue
      }
    }else {
      return init__17788
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
  var this__17794 = this;
  var inode__17795 = this;
  if(this__17794.bitmap === bit) {
    return null
  }else {
    var editable__17796 = inode__17795.ensure_editable(e);
    var earr__17797 = editable__17796.arr;
    var len__17798 = earr__17797.length;
    editable__17796.bitmap = bit ^ editable__17796.bitmap;
    cljs.core.array_copy.call(null, earr__17797, 2 * (i + 1), earr__17797, 2 * i, len__17798 - 2 * (i + 1));
    earr__17797[len__17798 - 2] = null;
    earr__17797[len__17798 - 1] = null;
    return editable__17796
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__17799 = this;
  var inode__17800 = this;
  var bit__17801 = 1 << (hash >>> shift & 31);
  var idx__17802 = cljs.core.bitmap_indexed_node_index.call(null, this__17799.bitmap, bit__17801);
  if((this__17799.bitmap & bit__17801) === 0) {
    var n__17803 = cljs.core.bit_count.call(null, this__17799.bitmap);
    if(2 * n__17803 < this__17799.arr.length) {
      var editable__17804 = inode__17800.ensure_editable(edit);
      var earr__17805 = editable__17804.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__17805, 2 * idx__17802, earr__17805, 2 * (idx__17802 + 1), 2 * (n__17803 - idx__17802));
      earr__17805[2 * idx__17802] = key;
      earr__17805[2 * idx__17802 + 1] = val;
      editable__17804.bitmap = editable__17804.bitmap | bit__17801;
      return editable__17804
    }else {
      if(n__17803 >= 16) {
        var nodes__17806 = cljs.core.make_array.call(null, 32);
        var jdx__17807 = hash >>> shift & 31;
        nodes__17806[jdx__17807] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__17808 = 0;
        var j__17809 = 0;
        while(true) {
          if(i__17808 < 32) {
            if((this__17799.bitmap >>> i__17808 & 1) === 0) {
              var G__17862 = i__17808 + 1;
              var G__17863 = j__17809;
              i__17808 = G__17862;
              j__17809 = G__17863;
              continue
            }else {
              nodes__17806[i__17808] = !(this__17799.arr[j__17809] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__17799.arr[j__17809]), this__17799.arr[j__17809], this__17799.arr[j__17809 + 1], added_leaf_QMARK_) : this__17799.arr[j__17809 + 1];
              var G__17864 = i__17808 + 1;
              var G__17865 = j__17809 + 2;
              i__17808 = G__17864;
              j__17809 = G__17865;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__17803 + 1, nodes__17806)
      }else {
        if("\ufdd0'else") {
          var new_arr__17810 = cljs.core.make_array.call(null, 2 * (n__17803 + 4));
          cljs.core.array_copy.call(null, this__17799.arr, 0, new_arr__17810, 0, 2 * idx__17802);
          new_arr__17810[2 * idx__17802] = key;
          new_arr__17810[2 * idx__17802 + 1] = val;
          cljs.core.array_copy.call(null, this__17799.arr, 2 * idx__17802, new_arr__17810, 2 * (idx__17802 + 1), 2 * (n__17803 - idx__17802));
          added_leaf_QMARK_.val = true;
          var editable__17811 = inode__17800.ensure_editable(edit);
          editable__17811.arr = new_arr__17810;
          editable__17811.bitmap = editable__17811.bitmap | bit__17801;
          return editable__17811
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__17812 = this__17799.arr[2 * idx__17802];
    var val_or_node__17813 = this__17799.arr[2 * idx__17802 + 1];
    if(key_or_nil__17812 == null) {
      var n__17814 = val_or_node__17813.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__17814 === val_or_node__17813) {
        return inode__17800
      }else {
        return cljs.core.edit_and_set.call(null, inode__17800, edit, 2 * idx__17802 + 1, n__17814)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17812)) {
        if(val === val_or_node__17813) {
          return inode__17800
        }else {
          return cljs.core.edit_and_set.call(null, inode__17800, edit, 2 * idx__17802 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__17800, edit, 2 * idx__17802, null, 2 * idx__17802 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__17812, val_or_node__17813, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__17815 = this;
  var inode__17816 = this;
  return cljs.core.create_inode_seq.call(null, this__17815.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17817 = this;
  var inode__17818 = this;
  var bit__17819 = 1 << (hash >>> shift & 31);
  if((this__17817.bitmap & bit__17819) === 0) {
    return inode__17818
  }else {
    var idx__17820 = cljs.core.bitmap_indexed_node_index.call(null, this__17817.bitmap, bit__17819);
    var key_or_nil__17821 = this__17817.arr[2 * idx__17820];
    var val_or_node__17822 = this__17817.arr[2 * idx__17820 + 1];
    if(key_or_nil__17821 == null) {
      var n__17823 = val_or_node__17822.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__17823 === val_or_node__17822) {
        return inode__17818
      }else {
        if(!(n__17823 == null)) {
          return cljs.core.edit_and_set.call(null, inode__17818, edit, 2 * idx__17820 + 1, n__17823)
        }else {
          if(this__17817.bitmap === bit__17819) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__17818.edit_and_remove_pair(edit, bit__17819, idx__17820)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17821)) {
        removed_leaf_QMARK_[0] = true;
        return inode__17818.edit_and_remove_pair(edit, bit__17819, idx__17820)
      }else {
        if("\ufdd0'else") {
          return inode__17818
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__17824 = this;
  var inode__17825 = this;
  if(e === this__17824.edit) {
    return inode__17825
  }else {
    var n__17826 = cljs.core.bit_count.call(null, this__17824.bitmap);
    var new_arr__17827 = cljs.core.make_array.call(null, n__17826 < 0 ? 4 : 2 * (n__17826 + 1));
    cljs.core.array_copy.call(null, this__17824.arr, 0, new_arr__17827, 0, 2 * n__17826);
    return new cljs.core.BitmapIndexedNode(e, this__17824.bitmap, new_arr__17827)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__17828 = this;
  var inode__17829 = this;
  return cljs.core.inode_kv_reduce.call(null, this__17828.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17830 = this;
  var inode__17831 = this;
  var bit__17832 = 1 << (hash >>> shift & 31);
  if((this__17830.bitmap & bit__17832) === 0) {
    return not_found
  }else {
    var idx__17833 = cljs.core.bitmap_indexed_node_index.call(null, this__17830.bitmap, bit__17832);
    var key_or_nil__17834 = this__17830.arr[2 * idx__17833];
    var val_or_node__17835 = this__17830.arr[2 * idx__17833 + 1];
    if(key_or_nil__17834 == null) {
      return val_or_node__17835.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17834)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__17834, val_or_node__17835], true)
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
  var this__17836 = this;
  var inode__17837 = this;
  var bit__17838 = 1 << (hash >>> shift & 31);
  if((this__17836.bitmap & bit__17838) === 0) {
    return inode__17837
  }else {
    var idx__17839 = cljs.core.bitmap_indexed_node_index.call(null, this__17836.bitmap, bit__17838);
    var key_or_nil__17840 = this__17836.arr[2 * idx__17839];
    var val_or_node__17841 = this__17836.arr[2 * idx__17839 + 1];
    if(key_or_nil__17840 == null) {
      var n__17842 = val_or_node__17841.inode_without(shift + 5, hash, key);
      if(n__17842 === val_or_node__17841) {
        return inode__17837
      }else {
        if(!(n__17842 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__17836.bitmap, cljs.core.clone_and_set.call(null, this__17836.arr, 2 * idx__17839 + 1, n__17842))
        }else {
          if(this__17836.bitmap === bit__17838) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__17836.bitmap ^ bit__17838, cljs.core.remove_pair.call(null, this__17836.arr, idx__17839))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17840)) {
        return new cljs.core.BitmapIndexedNode(null, this__17836.bitmap ^ bit__17838, cljs.core.remove_pair.call(null, this__17836.arr, idx__17839))
      }else {
        if("\ufdd0'else") {
          return inode__17837
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__17843 = this;
  var inode__17844 = this;
  var bit__17845 = 1 << (hash >>> shift & 31);
  var idx__17846 = cljs.core.bitmap_indexed_node_index.call(null, this__17843.bitmap, bit__17845);
  if((this__17843.bitmap & bit__17845) === 0) {
    var n__17847 = cljs.core.bit_count.call(null, this__17843.bitmap);
    if(n__17847 >= 16) {
      var nodes__17848 = cljs.core.make_array.call(null, 32);
      var jdx__17849 = hash >>> shift & 31;
      nodes__17848[jdx__17849] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__17850 = 0;
      var j__17851 = 0;
      while(true) {
        if(i__17850 < 32) {
          if((this__17843.bitmap >>> i__17850 & 1) === 0) {
            var G__17866 = i__17850 + 1;
            var G__17867 = j__17851;
            i__17850 = G__17866;
            j__17851 = G__17867;
            continue
          }else {
            nodes__17848[i__17850] = !(this__17843.arr[j__17851] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__17843.arr[j__17851]), this__17843.arr[j__17851], this__17843.arr[j__17851 + 1], added_leaf_QMARK_) : this__17843.arr[j__17851 + 1];
            var G__17868 = i__17850 + 1;
            var G__17869 = j__17851 + 2;
            i__17850 = G__17868;
            j__17851 = G__17869;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__17847 + 1, nodes__17848)
    }else {
      var new_arr__17852 = cljs.core.make_array.call(null, 2 * (n__17847 + 1));
      cljs.core.array_copy.call(null, this__17843.arr, 0, new_arr__17852, 0, 2 * idx__17846);
      new_arr__17852[2 * idx__17846] = key;
      new_arr__17852[2 * idx__17846 + 1] = val;
      cljs.core.array_copy.call(null, this__17843.arr, 2 * idx__17846, new_arr__17852, 2 * (idx__17846 + 1), 2 * (n__17847 - idx__17846));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__17843.bitmap | bit__17845, new_arr__17852)
    }
  }else {
    var key_or_nil__17853 = this__17843.arr[2 * idx__17846];
    var val_or_node__17854 = this__17843.arr[2 * idx__17846 + 1];
    if(key_or_nil__17853 == null) {
      var n__17855 = val_or_node__17854.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__17855 === val_or_node__17854) {
        return inode__17844
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__17843.bitmap, cljs.core.clone_and_set.call(null, this__17843.arr, 2 * idx__17846 + 1, n__17855))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17853)) {
        if(val === val_or_node__17854) {
          return inode__17844
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__17843.bitmap, cljs.core.clone_and_set.call(null, this__17843.arr, 2 * idx__17846 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__17843.bitmap, cljs.core.clone_and_set.call(null, this__17843.arr, 2 * idx__17846, null, 2 * idx__17846 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__17853, val_or_node__17854, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__17856 = this;
  var inode__17857 = this;
  var bit__17858 = 1 << (hash >>> shift & 31);
  if((this__17856.bitmap & bit__17858) === 0) {
    return not_found
  }else {
    var idx__17859 = cljs.core.bitmap_indexed_node_index.call(null, this__17856.bitmap, bit__17858);
    var key_or_nil__17860 = this__17856.arr[2 * idx__17859];
    var val_or_node__17861 = this__17856.arr[2 * idx__17859 + 1];
    if(key_or_nil__17860 == null) {
      return val_or_node__17861.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17860)) {
        return val_or_node__17861
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
  var arr__17877 = array_node.arr;
  var len__17878 = 2 * (array_node.cnt - 1);
  var new_arr__17879 = cljs.core.make_array.call(null, len__17878);
  var i__17880 = 0;
  var j__17881 = 1;
  var bitmap__17882 = 0;
  while(true) {
    if(i__17880 < len__17878) {
      if(function() {
        var and__3822__auto____17883 = !(i__17880 === idx);
        if(and__3822__auto____17883) {
          return!(arr__17877[i__17880] == null)
        }else {
          return and__3822__auto____17883
        }
      }()) {
        new_arr__17879[j__17881] = arr__17877[i__17880];
        var G__17884 = i__17880 + 1;
        var G__17885 = j__17881 + 2;
        var G__17886 = bitmap__17882 | 1 << i__17880;
        i__17880 = G__17884;
        j__17881 = G__17885;
        bitmap__17882 = G__17886;
        continue
      }else {
        var G__17887 = i__17880 + 1;
        var G__17888 = j__17881;
        var G__17889 = bitmap__17882;
        i__17880 = G__17887;
        j__17881 = G__17888;
        bitmap__17882 = G__17889;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__17882, new_arr__17879)
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
  var this__17890 = this;
  var inode__17891 = this;
  var idx__17892 = hash >>> shift & 31;
  var node__17893 = this__17890.arr[idx__17892];
  if(node__17893 == null) {
    var editable__17894 = cljs.core.edit_and_set.call(null, inode__17891, edit, idx__17892, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__17894.cnt = editable__17894.cnt + 1;
    return editable__17894
  }else {
    var n__17895 = node__17893.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__17895 === node__17893) {
      return inode__17891
    }else {
      return cljs.core.edit_and_set.call(null, inode__17891, edit, idx__17892, n__17895)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__17896 = this;
  var inode__17897 = this;
  return cljs.core.create_array_node_seq.call(null, this__17896.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17898 = this;
  var inode__17899 = this;
  var idx__17900 = hash >>> shift & 31;
  var node__17901 = this__17898.arr[idx__17900];
  if(node__17901 == null) {
    return inode__17899
  }else {
    var n__17902 = node__17901.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__17902 === node__17901) {
      return inode__17899
    }else {
      if(n__17902 == null) {
        if(this__17898.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__17899, edit, idx__17900)
        }else {
          var editable__17903 = cljs.core.edit_and_set.call(null, inode__17899, edit, idx__17900, n__17902);
          editable__17903.cnt = editable__17903.cnt - 1;
          return editable__17903
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__17899, edit, idx__17900, n__17902)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__17904 = this;
  var inode__17905 = this;
  if(e === this__17904.edit) {
    return inode__17905
  }else {
    return new cljs.core.ArrayNode(e, this__17904.cnt, this__17904.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__17906 = this;
  var inode__17907 = this;
  var len__17908 = this__17906.arr.length;
  var i__17909 = 0;
  var init__17910 = init;
  while(true) {
    if(i__17909 < len__17908) {
      var node__17911 = this__17906.arr[i__17909];
      if(!(node__17911 == null)) {
        var init__17912 = node__17911.kv_reduce(f, init__17910);
        if(cljs.core.reduced_QMARK_.call(null, init__17912)) {
          return cljs.core.deref.call(null, init__17912)
        }else {
          var G__17931 = i__17909 + 1;
          var G__17932 = init__17912;
          i__17909 = G__17931;
          init__17910 = G__17932;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__17910
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17913 = this;
  var inode__17914 = this;
  var idx__17915 = hash >>> shift & 31;
  var node__17916 = this__17913.arr[idx__17915];
  if(!(node__17916 == null)) {
    return node__17916.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__17917 = this;
  var inode__17918 = this;
  var idx__17919 = hash >>> shift & 31;
  var node__17920 = this__17917.arr[idx__17919];
  if(!(node__17920 == null)) {
    var n__17921 = node__17920.inode_without(shift + 5, hash, key);
    if(n__17921 === node__17920) {
      return inode__17918
    }else {
      if(n__17921 == null) {
        if(this__17917.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__17918, null, idx__17919)
        }else {
          return new cljs.core.ArrayNode(null, this__17917.cnt - 1, cljs.core.clone_and_set.call(null, this__17917.arr, idx__17919, n__17921))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__17917.cnt, cljs.core.clone_and_set.call(null, this__17917.arr, idx__17919, n__17921))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__17918
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__17922 = this;
  var inode__17923 = this;
  var idx__17924 = hash >>> shift & 31;
  var node__17925 = this__17922.arr[idx__17924];
  if(node__17925 == null) {
    return new cljs.core.ArrayNode(null, this__17922.cnt + 1, cljs.core.clone_and_set.call(null, this__17922.arr, idx__17924, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__17926 = node__17925.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__17926 === node__17925) {
      return inode__17923
    }else {
      return new cljs.core.ArrayNode(null, this__17922.cnt, cljs.core.clone_and_set.call(null, this__17922.arr, idx__17924, n__17926))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__17927 = this;
  var inode__17928 = this;
  var idx__17929 = hash >>> shift & 31;
  var node__17930 = this__17927.arr[idx__17929];
  if(!(node__17930 == null)) {
    return node__17930.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__17935 = 2 * cnt;
  var i__17936 = 0;
  while(true) {
    if(i__17936 < lim__17935) {
      if(cljs.core.key_test.call(null, key, arr[i__17936])) {
        return i__17936
      }else {
        var G__17937 = i__17936 + 2;
        i__17936 = G__17937;
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
  var this__17938 = this;
  var inode__17939 = this;
  if(hash === this__17938.collision_hash) {
    var idx__17940 = cljs.core.hash_collision_node_find_index.call(null, this__17938.arr, this__17938.cnt, key);
    if(idx__17940 === -1) {
      if(this__17938.arr.length > 2 * this__17938.cnt) {
        var editable__17941 = cljs.core.edit_and_set.call(null, inode__17939, edit, 2 * this__17938.cnt, key, 2 * this__17938.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__17941.cnt = editable__17941.cnt + 1;
        return editable__17941
      }else {
        var len__17942 = this__17938.arr.length;
        var new_arr__17943 = cljs.core.make_array.call(null, len__17942 + 2);
        cljs.core.array_copy.call(null, this__17938.arr, 0, new_arr__17943, 0, len__17942);
        new_arr__17943[len__17942] = key;
        new_arr__17943[len__17942 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__17939.ensure_editable_array(edit, this__17938.cnt + 1, new_arr__17943)
      }
    }else {
      if(this__17938.arr[idx__17940 + 1] === val) {
        return inode__17939
      }else {
        return cljs.core.edit_and_set.call(null, inode__17939, edit, idx__17940 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__17938.collision_hash >>> shift & 31), [null, inode__17939, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__17944 = this;
  var inode__17945 = this;
  return cljs.core.create_inode_seq.call(null, this__17944.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17946 = this;
  var inode__17947 = this;
  var idx__17948 = cljs.core.hash_collision_node_find_index.call(null, this__17946.arr, this__17946.cnt, key);
  if(idx__17948 === -1) {
    return inode__17947
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__17946.cnt === 1) {
      return null
    }else {
      var editable__17949 = inode__17947.ensure_editable(edit);
      var earr__17950 = editable__17949.arr;
      earr__17950[idx__17948] = earr__17950[2 * this__17946.cnt - 2];
      earr__17950[idx__17948 + 1] = earr__17950[2 * this__17946.cnt - 1];
      earr__17950[2 * this__17946.cnt - 1] = null;
      earr__17950[2 * this__17946.cnt - 2] = null;
      editable__17949.cnt = editable__17949.cnt - 1;
      return editable__17949
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__17951 = this;
  var inode__17952 = this;
  if(e === this__17951.edit) {
    return inode__17952
  }else {
    var new_arr__17953 = cljs.core.make_array.call(null, 2 * (this__17951.cnt + 1));
    cljs.core.array_copy.call(null, this__17951.arr, 0, new_arr__17953, 0, 2 * this__17951.cnt);
    return new cljs.core.HashCollisionNode(e, this__17951.collision_hash, this__17951.cnt, new_arr__17953)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__17954 = this;
  var inode__17955 = this;
  return cljs.core.inode_kv_reduce.call(null, this__17954.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17956 = this;
  var inode__17957 = this;
  var idx__17958 = cljs.core.hash_collision_node_find_index.call(null, this__17956.arr, this__17956.cnt, key);
  if(idx__17958 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__17956.arr[idx__17958])) {
      return cljs.core.PersistentVector.fromArray([this__17956.arr[idx__17958], this__17956.arr[idx__17958 + 1]], true)
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
  var this__17959 = this;
  var inode__17960 = this;
  var idx__17961 = cljs.core.hash_collision_node_find_index.call(null, this__17959.arr, this__17959.cnt, key);
  if(idx__17961 === -1) {
    return inode__17960
  }else {
    if(this__17959.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__17959.collision_hash, this__17959.cnt - 1, cljs.core.remove_pair.call(null, this__17959.arr, cljs.core.quot.call(null, idx__17961, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__17962 = this;
  var inode__17963 = this;
  if(hash === this__17962.collision_hash) {
    var idx__17964 = cljs.core.hash_collision_node_find_index.call(null, this__17962.arr, this__17962.cnt, key);
    if(idx__17964 === -1) {
      var len__17965 = this__17962.arr.length;
      var new_arr__17966 = cljs.core.make_array.call(null, len__17965 + 2);
      cljs.core.array_copy.call(null, this__17962.arr, 0, new_arr__17966, 0, len__17965);
      new_arr__17966[len__17965] = key;
      new_arr__17966[len__17965 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__17962.collision_hash, this__17962.cnt + 1, new_arr__17966)
    }else {
      if(cljs.core._EQ_.call(null, this__17962.arr[idx__17964], val)) {
        return inode__17963
      }else {
        return new cljs.core.HashCollisionNode(null, this__17962.collision_hash, this__17962.cnt, cljs.core.clone_and_set.call(null, this__17962.arr, idx__17964 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__17962.collision_hash >>> shift & 31), [null, inode__17963])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__17967 = this;
  var inode__17968 = this;
  var idx__17969 = cljs.core.hash_collision_node_find_index.call(null, this__17967.arr, this__17967.cnt, key);
  if(idx__17969 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__17967.arr[idx__17969])) {
      return this__17967.arr[idx__17969 + 1]
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
  var this__17970 = this;
  var inode__17971 = this;
  if(e === this__17970.edit) {
    this__17970.arr = array;
    this__17970.cnt = count;
    return inode__17971
  }else {
    return new cljs.core.HashCollisionNode(this__17970.edit, this__17970.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__17976 = cljs.core.hash.call(null, key1);
    if(key1hash__17976 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__17976, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___17977 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__17976, key1, val1, added_leaf_QMARK___17977).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___17977)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__17978 = cljs.core.hash.call(null, key1);
    if(key1hash__17978 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__17978, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___17979 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__17978, key1, val1, added_leaf_QMARK___17979).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___17979)
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
  var this__17980 = this;
  var h__2192__auto____17981 = this__17980.__hash;
  if(!(h__2192__auto____17981 == null)) {
    return h__2192__auto____17981
  }else {
    var h__2192__auto____17982 = cljs.core.hash_coll.call(null, coll);
    this__17980.__hash = h__2192__auto____17982;
    return h__2192__auto____17982
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17983 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__17984 = this;
  var this__17985 = this;
  return cljs.core.pr_str.call(null, this__17985)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__17986 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17987 = this;
  if(this__17987.s == null) {
    return cljs.core.PersistentVector.fromArray([this__17987.nodes[this__17987.i], this__17987.nodes[this__17987.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__17987.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17988 = this;
  if(this__17988.s == null) {
    return cljs.core.create_inode_seq.call(null, this__17988.nodes, this__17988.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__17988.nodes, this__17988.i, cljs.core.next.call(null, this__17988.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17989 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17990 = this;
  return new cljs.core.NodeSeq(meta, this__17990.nodes, this__17990.i, this__17990.s, this__17990.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17991 = this;
  return this__17991.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17992 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17992.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__17999 = nodes.length;
      var j__18000 = i;
      while(true) {
        if(j__18000 < len__17999) {
          if(!(nodes[j__18000] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__18000, null, null)
          }else {
            var temp__3971__auto____18001 = nodes[j__18000 + 1];
            if(cljs.core.truth_(temp__3971__auto____18001)) {
              var node__18002 = temp__3971__auto____18001;
              var temp__3971__auto____18003 = node__18002.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____18003)) {
                var node_seq__18004 = temp__3971__auto____18003;
                return new cljs.core.NodeSeq(null, nodes, j__18000 + 2, node_seq__18004, null)
              }else {
                var G__18005 = j__18000 + 2;
                j__18000 = G__18005;
                continue
              }
            }else {
              var G__18006 = j__18000 + 2;
              j__18000 = G__18006;
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
  var this__18007 = this;
  var h__2192__auto____18008 = this__18007.__hash;
  if(!(h__2192__auto____18008 == null)) {
    return h__2192__auto____18008
  }else {
    var h__2192__auto____18009 = cljs.core.hash_coll.call(null, coll);
    this__18007.__hash = h__2192__auto____18009;
    return h__2192__auto____18009
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18010 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__18011 = this;
  var this__18012 = this;
  return cljs.core.pr_str.call(null, this__18012)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__18013 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__18014 = this;
  return cljs.core.first.call(null, this__18014.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__18015 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__18015.nodes, this__18015.i, cljs.core.next.call(null, this__18015.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18016 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18017 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__18017.nodes, this__18017.i, this__18017.s, this__18017.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18018 = this;
  return this__18018.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18019 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__18019.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__18026 = nodes.length;
      var j__18027 = i;
      while(true) {
        if(j__18027 < len__18026) {
          var temp__3971__auto____18028 = nodes[j__18027];
          if(cljs.core.truth_(temp__3971__auto____18028)) {
            var nj__18029 = temp__3971__auto____18028;
            var temp__3971__auto____18030 = nj__18029.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____18030)) {
              var ns__18031 = temp__3971__auto____18030;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__18027 + 1, ns__18031, null)
            }else {
              var G__18032 = j__18027 + 1;
              j__18027 = G__18032;
              continue
            }
          }else {
            var G__18033 = j__18027 + 1;
            j__18027 = G__18033;
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
  var this__18036 = this;
  return new cljs.core.TransientHashMap({}, this__18036.root, this__18036.cnt, this__18036.has_nil_QMARK_, this__18036.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__18037 = this;
  var h__2192__auto____18038 = this__18037.__hash;
  if(!(h__2192__auto____18038 == null)) {
    return h__2192__auto____18038
  }else {
    var h__2192__auto____18039 = cljs.core.hash_imap.call(null, coll);
    this__18037.__hash = h__2192__auto____18039;
    return h__2192__auto____18039
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__18040 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__18041 = this;
  if(k == null) {
    if(this__18041.has_nil_QMARK_) {
      return this__18041.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__18041.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__18041.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__18042 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____18043 = this__18042.has_nil_QMARK_;
      if(and__3822__auto____18043) {
        return v === this__18042.nil_val
      }else {
        return and__3822__auto____18043
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__18042.meta, this__18042.has_nil_QMARK_ ? this__18042.cnt : this__18042.cnt + 1, this__18042.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___18044 = new cljs.core.Box(false);
    var new_root__18045 = (this__18042.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__18042.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___18044);
    if(new_root__18045 === this__18042.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__18042.meta, added_leaf_QMARK___18044.val ? this__18042.cnt + 1 : this__18042.cnt, new_root__18045, this__18042.has_nil_QMARK_, this__18042.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__18046 = this;
  if(k == null) {
    return this__18046.has_nil_QMARK_
  }else {
    if(this__18046.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__18046.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__18069 = null;
  var G__18069__2 = function(this_sym18047, k) {
    var this__18049 = this;
    var this_sym18047__18050 = this;
    var coll__18051 = this_sym18047__18050;
    return coll__18051.cljs$core$ILookup$_lookup$arity$2(coll__18051, k)
  };
  var G__18069__3 = function(this_sym18048, k, not_found) {
    var this__18049 = this;
    var this_sym18048__18052 = this;
    var coll__18053 = this_sym18048__18052;
    return coll__18053.cljs$core$ILookup$_lookup$arity$3(coll__18053, k, not_found)
  };
  G__18069 = function(this_sym18048, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18069__2.call(this, this_sym18048, k);
      case 3:
        return G__18069__3.call(this, this_sym18048, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18069
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym18034, args18035) {
  var this__18054 = this;
  return this_sym18034.call.apply(this_sym18034, [this_sym18034].concat(args18035.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__18055 = this;
  var init__18056 = this__18055.has_nil_QMARK_ ? f.call(null, init, null, this__18055.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__18056)) {
    return cljs.core.deref.call(null, init__18056)
  }else {
    if(!(this__18055.root == null)) {
      return this__18055.root.kv_reduce(f, init__18056)
    }else {
      if("\ufdd0'else") {
        return init__18056
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__18057 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__18058 = this;
  var this__18059 = this;
  return cljs.core.pr_str.call(null, this__18059)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__18060 = this;
  if(this__18060.cnt > 0) {
    var s__18061 = !(this__18060.root == null) ? this__18060.root.inode_seq() : null;
    if(this__18060.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__18060.nil_val], true), s__18061)
    }else {
      return s__18061
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18062 = this;
  return this__18062.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18063 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18064 = this;
  return new cljs.core.PersistentHashMap(meta, this__18064.cnt, this__18064.root, this__18064.has_nil_QMARK_, this__18064.nil_val, this__18064.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18065 = this;
  return this__18065.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18066 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__18066.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__18067 = this;
  if(k == null) {
    if(this__18067.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__18067.meta, this__18067.cnt - 1, this__18067.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__18067.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__18068 = this__18067.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__18068 === this__18067.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__18067.meta, this__18067.cnt - 1, new_root__18068, this__18067.has_nil_QMARK_, this__18067.nil_val, null)
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
  var len__18070 = ks.length;
  var i__18071 = 0;
  var out__18072 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__18071 < len__18070) {
      var G__18073 = i__18071 + 1;
      var G__18074 = cljs.core.assoc_BANG_.call(null, out__18072, ks[i__18071], vs[i__18071]);
      i__18071 = G__18073;
      out__18072 = G__18074;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__18072)
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
  var this__18075 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__18076 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__18077 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__18078 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__18079 = this;
  if(k == null) {
    if(this__18079.has_nil_QMARK_) {
      return this__18079.nil_val
    }else {
      return null
    }
  }else {
    if(this__18079.root == null) {
      return null
    }else {
      return this__18079.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__18080 = this;
  if(k == null) {
    if(this__18080.has_nil_QMARK_) {
      return this__18080.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__18080.root == null) {
      return not_found
    }else {
      return this__18080.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18081 = this;
  if(this__18081.edit) {
    return this__18081.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__18082 = this;
  var tcoll__18083 = this;
  if(this__18082.edit) {
    if(function() {
      var G__18084__18085 = o;
      if(G__18084__18085) {
        if(function() {
          var or__3824__auto____18086 = G__18084__18085.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____18086) {
            return or__3824__auto____18086
          }else {
            return G__18084__18085.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__18084__18085.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__18084__18085)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__18084__18085)
      }
    }()) {
      return tcoll__18083.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__18087 = cljs.core.seq.call(null, o);
      var tcoll__18088 = tcoll__18083;
      while(true) {
        var temp__3971__auto____18089 = cljs.core.first.call(null, es__18087);
        if(cljs.core.truth_(temp__3971__auto____18089)) {
          var e__18090 = temp__3971__auto____18089;
          var G__18101 = cljs.core.next.call(null, es__18087);
          var G__18102 = tcoll__18088.assoc_BANG_(cljs.core.key.call(null, e__18090), cljs.core.val.call(null, e__18090));
          es__18087 = G__18101;
          tcoll__18088 = G__18102;
          continue
        }else {
          return tcoll__18088
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__18091 = this;
  var tcoll__18092 = this;
  if(this__18091.edit) {
    if(k == null) {
      if(this__18091.nil_val === v) {
      }else {
        this__18091.nil_val = v
      }
      if(this__18091.has_nil_QMARK_) {
      }else {
        this__18091.count = this__18091.count + 1;
        this__18091.has_nil_QMARK_ = true
      }
      return tcoll__18092
    }else {
      var added_leaf_QMARK___18093 = new cljs.core.Box(false);
      var node__18094 = (this__18091.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__18091.root).inode_assoc_BANG_(this__18091.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___18093);
      if(node__18094 === this__18091.root) {
      }else {
        this__18091.root = node__18094
      }
      if(added_leaf_QMARK___18093.val) {
        this__18091.count = this__18091.count + 1
      }else {
      }
      return tcoll__18092
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__18095 = this;
  var tcoll__18096 = this;
  if(this__18095.edit) {
    if(k == null) {
      if(this__18095.has_nil_QMARK_) {
        this__18095.has_nil_QMARK_ = false;
        this__18095.nil_val = null;
        this__18095.count = this__18095.count - 1;
        return tcoll__18096
      }else {
        return tcoll__18096
      }
    }else {
      if(this__18095.root == null) {
        return tcoll__18096
      }else {
        var removed_leaf_QMARK___18097 = new cljs.core.Box(false);
        var node__18098 = this__18095.root.inode_without_BANG_(this__18095.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___18097);
        if(node__18098 === this__18095.root) {
        }else {
          this__18095.root = node__18098
        }
        if(cljs.core.truth_(removed_leaf_QMARK___18097[0])) {
          this__18095.count = this__18095.count - 1
        }else {
        }
        return tcoll__18096
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__18099 = this;
  var tcoll__18100 = this;
  if(this__18099.edit) {
    this__18099.edit = null;
    return new cljs.core.PersistentHashMap(null, this__18099.count, this__18099.root, this__18099.has_nil_QMARK_, this__18099.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__18105 = node;
  var stack__18106 = stack;
  while(true) {
    if(!(t__18105 == null)) {
      var G__18107 = ascending_QMARK_ ? t__18105.left : t__18105.right;
      var G__18108 = cljs.core.conj.call(null, stack__18106, t__18105);
      t__18105 = G__18107;
      stack__18106 = G__18108;
      continue
    }else {
      return stack__18106
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
  var this__18109 = this;
  var h__2192__auto____18110 = this__18109.__hash;
  if(!(h__2192__auto____18110 == null)) {
    return h__2192__auto____18110
  }else {
    var h__2192__auto____18111 = cljs.core.hash_coll.call(null, coll);
    this__18109.__hash = h__2192__auto____18111;
    return h__2192__auto____18111
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18112 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__18113 = this;
  var this__18114 = this;
  return cljs.core.pr_str.call(null, this__18114)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__18115 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18116 = this;
  if(this__18116.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__18116.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__18117 = this;
  return cljs.core.peek.call(null, this__18117.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__18118 = this;
  var t__18119 = cljs.core.first.call(null, this__18118.stack);
  var next_stack__18120 = cljs.core.tree_map_seq_push.call(null, this__18118.ascending_QMARK_ ? t__18119.right : t__18119.left, cljs.core.next.call(null, this__18118.stack), this__18118.ascending_QMARK_);
  if(!(next_stack__18120 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__18120, this__18118.ascending_QMARK_, this__18118.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18121 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18122 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__18122.stack, this__18122.ascending_QMARK_, this__18122.cnt, this__18122.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18123 = this;
  return this__18123.meta
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
        var and__3822__auto____18125 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____18125) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____18125
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
        var and__3822__auto____18127 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____18127) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____18127
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
  var init__18131 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__18131)) {
    return cljs.core.deref.call(null, init__18131)
  }else {
    var init__18132 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__18131) : init__18131;
    if(cljs.core.reduced_QMARK_.call(null, init__18132)) {
      return cljs.core.deref.call(null, init__18132)
    }else {
      var init__18133 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__18132) : init__18132;
      if(cljs.core.reduced_QMARK_.call(null, init__18133)) {
        return cljs.core.deref.call(null, init__18133)
      }else {
        return init__18133
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
  var this__18136 = this;
  var h__2192__auto____18137 = this__18136.__hash;
  if(!(h__2192__auto____18137 == null)) {
    return h__2192__auto____18137
  }else {
    var h__2192__auto____18138 = cljs.core.hash_coll.call(null, coll);
    this__18136.__hash = h__2192__auto____18138;
    return h__2192__auto____18138
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__18139 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__18140 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__18141 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__18141.key, this__18141.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__18189 = null;
  var G__18189__2 = function(this_sym18142, k) {
    var this__18144 = this;
    var this_sym18142__18145 = this;
    var node__18146 = this_sym18142__18145;
    return node__18146.cljs$core$ILookup$_lookup$arity$2(node__18146, k)
  };
  var G__18189__3 = function(this_sym18143, k, not_found) {
    var this__18144 = this;
    var this_sym18143__18147 = this;
    var node__18148 = this_sym18143__18147;
    return node__18148.cljs$core$ILookup$_lookup$arity$3(node__18148, k, not_found)
  };
  G__18189 = function(this_sym18143, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18189__2.call(this, this_sym18143, k);
      case 3:
        return G__18189__3.call(this, this_sym18143, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18189
}();
cljs.core.BlackNode.prototype.apply = function(this_sym18134, args18135) {
  var this__18149 = this;
  return this_sym18134.call.apply(this_sym18134, [this_sym18134].concat(args18135.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__18150 = this;
  return cljs.core.PersistentVector.fromArray([this__18150.key, this__18150.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__18151 = this;
  return this__18151.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__18152 = this;
  return this__18152.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__18153 = this;
  var node__18154 = this;
  return ins.balance_right(node__18154)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__18155 = this;
  var node__18156 = this;
  return new cljs.core.RedNode(this__18155.key, this__18155.val, this__18155.left, this__18155.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__18157 = this;
  var node__18158 = this;
  return cljs.core.balance_right_del.call(null, this__18157.key, this__18157.val, this__18157.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__18159 = this;
  var node__18160 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__18161 = this;
  var node__18162 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__18162, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__18163 = this;
  var node__18164 = this;
  return cljs.core.balance_left_del.call(null, this__18163.key, this__18163.val, del, this__18163.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__18165 = this;
  var node__18166 = this;
  return ins.balance_left(node__18166)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__18167 = this;
  var node__18168 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__18168, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__18190 = null;
  var G__18190__0 = function() {
    var this__18169 = this;
    var this__18171 = this;
    return cljs.core.pr_str.call(null, this__18171)
  };
  G__18190 = function() {
    switch(arguments.length) {
      case 0:
        return G__18190__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18190
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__18172 = this;
  var node__18173 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__18173, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__18174 = this;
  var node__18175 = this;
  return node__18175
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__18176 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__18177 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__18178 = this;
  return cljs.core.list.call(null, this__18178.key, this__18178.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__18179 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__18180 = this;
  return this__18180.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__18181 = this;
  return cljs.core.PersistentVector.fromArray([this__18181.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__18182 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__18182.key, this__18182.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18183 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__18184 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__18184.key, this__18184.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__18185 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__18186 = this;
  if(n === 0) {
    return this__18186.key
  }else {
    if(n === 1) {
      return this__18186.val
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
  var this__18187 = this;
  if(n === 0) {
    return this__18187.key
  }else {
    if(n === 1) {
      return this__18187.val
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
  var this__18188 = this;
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
  var this__18193 = this;
  var h__2192__auto____18194 = this__18193.__hash;
  if(!(h__2192__auto____18194 == null)) {
    return h__2192__auto____18194
  }else {
    var h__2192__auto____18195 = cljs.core.hash_coll.call(null, coll);
    this__18193.__hash = h__2192__auto____18195;
    return h__2192__auto____18195
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__18196 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__18197 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__18198 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__18198.key, this__18198.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__18246 = null;
  var G__18246__2 = function(this_sym18199, k) {
    var this__18201 = this;
    var this_sym18199__18202 = this;
    var node__18203 = this_sym18199__18202;
    return node__18203.cljs$core$ILookup$_lookup$arity$2(node__18203, k)
  };
  var G__18246__3 = function(this_sym18200, k, not_found) {
    var this__18201 = this;
    var this_sym18200__18204 = this;
    var node__18205 = this_sym18200__18204;
    return node__18205.cljs$core$ILookup$_lookup$arity$3(node__18205, k, not_found)
  };
  G__18246 = function(this_sym18200, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18246__2.call(this, this_sym18200, k);
      case 3:
        return G__18246__3.call(this, this_sym18200, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18246
}();
cljs.core.RedNode.prototype.apply = function(this_sym18191, args18192) {
  var this__18206 = this;
  return this_sym18191.call.apply(this_sym18191, [this_sym18191].concat(args18192.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__18207 = this;
  return cljs.core.PersistentVector.fromArray([this__18207.key, this__18207.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__18208 = this;
  return this__18208.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__18209 = this;
  return this__18209.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__18210 = this;
  var node__18211 = this;
  return new cljs.core.RedNode(this__18210.key, this__18210.val, this__18210.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__18212 = this;
  var node__18213 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__18214 = this;
  var node__18215 = this;
  return new cljs.core.RedNode(this__18214.key, this__18214.val, this__18214.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__18216 = this;
  var node__18217 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__18218 = this;
  var node__18219 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__18219, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__18220 = this;
  var node__18221 = this;
  return new cljs.core.RedNode(this__18220.key, this__18220.val, del, this__18220.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__18222 = this;
  var node__18223 = this;
  return new cljs.core.RedNode(this__18222.key, this__18222.val, ins, this__18222.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__18224 = this;
  var node__18225 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__18224.left)) {
    return new cljs.core.RedNode(this__18224.key, this__18224.val, this__18224.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__18224.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__18224.right)) {
      return new cljs.core.RedNode(this__18224.right.key, this__18224.right.val, new cljs.core.BlackNode(this__18224.key, this__18224.val, this__18224.left, this__18224.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__18224.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__18225, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__18247 = null;
  var G__18247__0 = function() {
    var this__18226 = this;
    var this__18228 = this;
    return cljs.core.pr_str.call(null, this__18228)
  };
  G__18247 = function() {
    switch(arguments.length) {
      case 0:
        return G__18247__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18247
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__18229 = this;
  var node__18230 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__18229.right)) {
    return new cljs.core.RedNode(this__18229.key, this__18229.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__18229.left, null), this__18229.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__18229.left)) {
      return new cljs.core.RedNode(this__18229.left.key, this__18229.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__18229.left.left, null), new cljs.core.BlackNode(this__18229.key, this__18229.val, this__18229.left.right, this__18229.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__18230, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__18231 = this;
  var node__18232 = this;
  return new cljs.core.BlackNode(this__18231.key, this__18231.val, this__18231.left, this__18231.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__18233 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__18234 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__18235 = this;
  return cljs.core.list.call(null, this__18235.key, this__18235.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__18236 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__18237 = this;
  return this__18237.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__18238 = this;
  return cljs.core.PersistentVector.fromArray([this__18238.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__18239 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__18239.key, this__18239.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18240 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__18241 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__18241.key, this__18241.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__18242 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__18243 = this;
  if(n === 0) {
    return this__18243.key
  }else {
    if(n === 1) {
      return this__18243.val
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
  var this__18244 = this;
  if(n === 0) {
    return this__18244.key
  }else {
    if(n === 1) {
      return this__18244.val
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
  var this__18245 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__18251 = comp.call(null, k, tree.key);
    if(c__18251 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__18251 < 0) {
        var ins__18252 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__18252 == null)) {
          return tree.add_left(ins__18252)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__18253 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__18253 == null)) {
            return tree.add_right(ins__18253)
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
          var app__18256 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__18256)) {
            return new cljs.core.RedNode(app__18256.key, app__18256.val, new cljs.core.RedNode(left.key, left.val, left.left, app__18256.left, null), new cljs.core.RedNode(right.key, right.val, app__18256.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__18256, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__18257 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__18257)) {
              return new cljs.core.RedNode(app__18257.key, app__18257.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__18257.left, null), new cljs.core.BlackNode(right.key, right.val, app__18257.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__18257, right.right, null))
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
    var c__18263 = comp.call(null, k, tree.key);
    if(c__18263 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__18263 < 0) {
        var del__18264 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____18265 = !(del__18264 == null);
          if(or__3824__auto____18265) {
            return or__3824__auto____18265
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__18264, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__18264, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__18266 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____18267 = !(del__18266 == null);
            if(or__3824__auto____18267) {
              return or__3824__auto____18267
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__18266)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__18266, null)
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
  var tk__18270 = tree.key;
  var c__18271 = comp.call(null, k, tk__18270);
  if(c__18271 === 0) {
    return tree.replace(tk__18270, v, tree.left, tree.right)
  }else {
    if(c__18271 < 0) {
      return tree.replace(tk__18270, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__18270, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__18274 = this;
  var h__2192__auto____18275 = this__18274.__hash;
  if(!(h__2192__auto____18275 == null)) {
    return h__2192__auto____18275
  }else {
    var h__2192__auto____18276 = cljs.core.hash_imap.call(null, coll);
    this__18274.__hash = h__2192__auto____18276;
    return h__2192__auto____18276
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__18277 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__18278 = this;
  var n__18279 = coll.entry_at(k);
  if(!(n__18279 == null)) {
    return n__18279.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__18280 = this;
  var found__18281 = [null];
  var t__18282 = cljs.core.tree_map_add.call(null, this__18280.comp, this__18280.tree, k, v, found__18281);
  if(t__18282 == null) {
    var found_node__18283 = cljs.core.nth.call(null, found__18281, 0);
    if(cljs.core._EQ_.call(null, v, found_node__18283.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__18280.comp, cljs.core.tree_map_replace.call(null, this__18280.comp, this__18280.tree, k, v), this__18280.cnt, this__18280.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__18280.comp, t__18282.blacken(), this__18280.cnt + 1, this__18280.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__18284 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__18318 = null;
  var G__18318__2 = function(this_sym18285, k) {
    var this__18287 = this;
    var this_sym18285__18288 = this;
    var coll__18289 = this_sym18285__18288;
    return coll__18289.cljs$core$ILookup$_lookup$arity$2(coll__18289, k)
  };
  var G__18318__3 = function(this_sym18286, k, not_found) {
    var this__18287 = this;
    var this_sym18286__18290 = this;
    var coll__18291 = this_sym18286__18290;
    return coll__18291.cljs$core$ILookup$_lookup$arity$3(coll__18291, k, not_found)
  };
  G__18318 = function(this_sym18286, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18318__2.call(this, this_sym18286, k);
      case 3:
        return G__18318__3.call(this, this_sym18286, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18318
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym18272, args18273) {
  var this__18292 = this;
  return this_sym18272.call.apply(this_sym18272, [this_sym18272].concat(args18273.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__18293 = this;
  if(!(this__18293.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__18293.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__18294 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__18295 = this;
  if(this__18295.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__18295.tree, false, this__18295.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__18296 = this;
  var this__18297 = this;
  return cljs.core.pr_str.call(null, this__18297)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__18298 = this;
  var coll__18299 = this;
  var t__18300 = this__18298.tree;
  while(true) {
    if(!(t__18300 == null)) {
      var c__18301 = this__18298.comp.call(null, k, t__18300.key);
      if(c__18301 === 0) {
        return t__18300
      }else {
        if(c__18301 < 0) {
          var G__18319 = t__18300.left;
          t__18300 = G__18319;
          continue
        }else {
          if("\ufdd0'else") {
            var G__18320 = t__18300.right;
            t__18300 = G__18320;
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
  var this__18302 = this;
  if(this__18302.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__18302.tree, ascending_QMARK_, this__18302.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__18303 = this;
  if(this__18303.cnt > 0) {
    var stack__18304 = null;
    var t__18305 = this__18303.tree;
    while(true) {
      if(!(t__18305 == null)) {
        var c__18306 = this__18303.comp.call(null, k, t__18305.key);
        if(c__18306 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__18304, t__18305), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__18306 < 0) {
              var G__18321 = cljs.core.conj.call(null, stack__18304, t__18305);
              var G__18322 = t__18305.left;
              stack__18304 = G__18321;
              t__18305 = G__18322;
              continue
            }else {
              var G__18323 = stack__18304;
              var G__18324 = t__18305.right;
              stack__18304 = G__18323;
              t__18305 = G__18324;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__18306 > 0) {
                var G__18325 = cljs.core.conj.call(null, stack__18304, t__18305);
                var G__18326 = t__18305.right;
                stack__18304 = G__18325;
                t__18305 = G__18326;
                continue
              }else {
                var G__18327 = stack__18304;
                var G__18328 = t__18305.left;
                stack__18304 = G__18327;
                t__18305 = G__18328;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__18304 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__18304, ascending_QMARK_, -1, null)
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
  var this__18307 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__18308 = this;
  return this__18308.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__18309 = this;
  if(this__18309.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__18309.tree, true, this__18309.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18310 = this;
  return this__18310.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18311 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18312 = this;
  return new cljs.core.PersistentTreeMap(this__18312.comp, this__18312.tree, this__18312.cnt, meta, this__18312.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18313 = this;
  return this__18313.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18314 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__18314.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__18315 = this;
  var found__18316 = [null];
  var t__18317 = cljs.core.tree_map_remove.call(null, this__18315.comp, this__18315.tree, k, found__18316);
  if(t__18317 == null) {
    if(cljs.core.nth.call(null, found__18316, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__18315.comp, null, 0, this__18315.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__18315.comp, t__18317.blacken(), this__18315.cnt - 1, this__18315.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__18331 = cljs.core.seq.call(null, keyvals);
    var out__18332 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__18331) {
        var G__18333 = cljs.core.nnext.call(null, in__18331);
        var G__18334 = cljs.core.assoc_BANG_.call(null, out__18332, cljs.core.first.call(null, in__18331), cljs.core.second.call(null, in__18331));
        in__18331 = G__18333;
        out__18332 = G__18334;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__18332)
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
  hash_map.cljs$lang$applyTo = function(arglist__18335) {
    var keyvals = cljs.core.seq(arglist__18335);
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
  array_map.cljs$lang$applyTo = function(arglist__18336) {
    var keyvals = cljs.core.seq(arglist__18336);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__18340 = [];
    var obj__18341 = {};
    var kvs__18342 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__18342) {
        ks__18340.push(cljs.core.first.call(null, kvs__18342));
        obj__18341[cljs.core.first.call(null, kvs__18342)] = cljs.core.second.call(null, kvs__18342);
        var G__18343 = cljs.core.nnext.call(null, kvs__18342);
        kvs__18342 = G__18343;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__18340, obj__18341)
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
  obj_map.cljs$lang$applyTo = function(arglist__18344) {
    var keyvals = cljs.core.seq(arglist__18344);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__18347 = cljs.core.seq.call(null, keyvals);
    var out__18348 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__18347) {
        var G__18349 = cljs.core.nnext.call(null, in__18347);
        var G__18350 = cljs.core.assoc.call(null, out__18348, cljs.core.first.call(null, in__18347), cljs.core.second.call(null, in__18347));
        in__18347 = G__18349;
        out__18348 = G__18350;
        continue
      }else {
        return out__18348
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
  sorted_map.cljs$lang$applyTo = function(arglist__18351) {
    var keyvals = cljs.core.seq(arglist__18351);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__18354 = cljs.core.seq.call(null, keyvals);
    var out__18355 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__18354) {
        var G__18356 = cljs.core.nnext.call(null, in__18354);
        var G__18357 = cljs.core.assoc.call(null, out__18355, cljs.core.first.call(null, in__18354), cljs.core.second.call(null, in__18354));
        in__18354 = G__18356;
        out__18355 = G__18357;
        continue
      }else {
        return out__18355
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__18358) {
    var comparator = cljs.core.first(arglist__18358);
    var keyvals = cljs.core.rest(arglist__18358);
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
      return cljs.core.reduce.call(null, function(p1__18359_SHARP_, p2__18360_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____18362 = p1__18359_SHARP_;
          if(cljs.core.truth_(or__3824__auto____18362)) {
            return or__3824__auto____18362
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__18360_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__18363) {
    var maps = cljs.core.seq(arglist__18363);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__18371 = function(m, e) {
        var k__18369 = cljs.core.first.call(null, e);
        var v__18370 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__18369)) {
          return cljs.core.assoc.call(null, m, k__18369, f.call(null, cljs.core._lookup.call(null, m, k__18369, null), v__18370))
        }else {
          return cljs.core.assoc.call(null, m, k__18369, v__18370)
        }
      };
      var merge2__18373 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__18371, function() {
          var or__3824__auto____18372 = m1;
          if(cljs.core.truth_(or__3824__auto____18372)) {
            return or__3824__auto____18372
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__18373, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__18374) {
    var f = cljs.core.first(arglist__18374);
    var maps = cljs.core.rest(arglist__18374);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__18379 = cljs.core.ObjMap.EMPTY;
  var keys__18380 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__18380) {
      var key__18381 = cljs.core.first.call(null, keys__18380);
      var entry__18382 = cljs.core._lookup.call(null, map, key__18381, "\ufdd0'cljs.core/not-found");
      var G__18383 = cljs.core.not_EQ_.call(null, entry__18382, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__18379, key__18381, entry__18382) : ret__18379;
      var G__18384 = cljs.core.next.call(null, keys__18380);
      ret__18379 = G__18383;
      keys__18380 = G__18384;
      continue
    }else {
      return ret__18379
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
  var this__18388 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__18388.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__18389 = this;
  var h__2192__auto____18390 = this__18389.__hash;
  if(!(h__2192__auto____18390 == null)) {
    return h__2192__auto____18390
  }else {
    var h__2192__auto____18391 = cljs.core.hash_iset.call(null, coll);
    this__18389.__hash = h__2192__auto____18391;
    return h__2192__auto____18391
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__18392 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__18393 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__18393.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__18414 = null;
  var G__18414__2 = function(this_sym18394, k) {
    var this__18396 = this;
    var this_sym18394__18397 = this;
    var coll__18398 = this_sym18394__18397;
    return coll__18398.cljs$core$ILookup$_lookup$arity$2(coll__18398, k)
  };
  var G__18414__3 = function(this_sym18395, k, not_found) {
    var this__18396 = this;
    var this_sym18395__18399 = this;
    var coll__18400 = this_sym18395__18399;
    return coll__18400.cljs$core$ILookup$_lookup$arity$3(coll__18400, k, not_found)
  };
  G__18414 = function(this_sym18395, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18414__2.call(this, this_sym18395, k);
      case 3:
        return G__18414__3.call(this, this_sym18395, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18414
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym18386, args18387) {
  var this__18401 = this;
  return this_sym18386.call.apply(this_sym18386, [this_sym18386].concat(args18387.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18402 = this;
  return new cljs.core.PersistentHashSet(this__18402.meta, cljs.core.assoc.call(null, this__18402.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__18403 = this;
  var this__18404 = this;
  return cljs.core.pr_str.call(null, this__18404)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__18405 = this;
  return cljs.core.keys.call(null, this__18405.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__18406 = this;
  return new cljs.core.PersistentHashSet(this__18406.meta, cljs.core.dissoc.call(null, this__18406.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18407 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18408 = this;
  var and__3822__auto____18409 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____18409) {
    var and__3822__auto____18410 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____18410) {
      return cljs.core.every_QMARK_.call(null, function(p1__18385_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__18385_SHARP_)
      }, other)
    }else {
      return and__3822__auto____18410
    }
  }else {
    return and__3822__auto____18409
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18411 = this;
  return new cljs.core.PersistentHashSet(meta, this__18411.hash_map, this__18411.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18412 = this;
  return this__18412.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18413 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__18413.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__18415 = cljs.core.count.call(null, items);
  var i__18416 = 0;
  var out__18417 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__18416 < len__18415) {
      var G__18418 = i__18416 + 1;
      var G__18419 = cljs.core.conj_BANG_.call(null, out__18417, items[i__18416]);
      i__18416 = G__18418;
      out__18417 = G__18419;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__18417)
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
  var G__18437 = null;
  var G__18437__2 = function(this_sym18423, k) {
    var this__18425 = this;
    var this_sym18423__18426 = this;
    var tcoll__18427 = this_sym18423__18426;
    if(cljs.core._lookup.call(null, this__18425.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__18437__3 = function(this_sym18424, k, not_found) {
    var this__18425 = this;
    var this_sym18424__18428 = this;
    var tcoll__18429 = this_sym18424__18428;
    if(cljs.core._lookup.call(null, this__18425.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__18437 = function(this_sym18424, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18437__2.call(this, this_sym18424, k);
      case 3:
        return G__18437__3.call(this, this_sym18424, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18437
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym18421, args18422) {
  var this__18430 = this;
  return this_sym18421.call.apply(this_sym18421, [this_sym18421].concat(args18422.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__18431 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__18432 = this;
  if(cljs.core._lookup.call(null, this__18432.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__18433 = this;
  return cljs.core.count.call(null, this__18433.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__18434 = this;
  this__18434.transient_map = cljs.core.dissoc_BANG_.call(null, this__18434.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__18435 = this;
  this__18435.transient_map = cljs.core.assoc_BANG_.call(null, this__18435.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__18436 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__18436.transient_map), null)
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
  var this__18440 = this;
  var h__2192__auto____18441 = this__18440.__hash;
  if(!(h__2192__auto____18441 == null)) {
    return h__2192__auto____18441
  }else {
    var h__2192__auto____18442 = cljs.core.hash_iset.call(null, coll);
    this__18440.__hash = h__2192__auto____18442;
    return h__2192__auto____18442
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__18443 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__18444 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__18444.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__18470 = null;
  var G__18470__2 = function(this_sym18445, k) {
    var this__18447 = this;
    var this_sym18445__18448 = this;
    var coll__18449 = this_sym18445__18448;
    return coll__18449.cljs$core$ILookup$_lookup$arity$2(coll__18449, k)
  };
  var G__18470__3 = function(this_sym18446, k, not_found) {
    var this__18447 = this;
    var this_sym18446__18450 = this;
    var coll__18451 = this_sym18446__18450;
    return coll__18451.cljs$core$ILookup$_lookup$arity$3(coll__18451, k, not_found)
  };
  G__18470 = function(this_sym18446, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18470__2.call(this, this_sym18446, k);
      case 3:
        return G__18470__3.call(this, this_sym18446, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18470
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym18438, args18439) {
  var this__18452 = this;
  return this_sym18438.call.apply(this_sym18438, [this_sym18438].concat(args18439.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18453 = this;
  return new cljs.core.PersistentTreeSet(this__18453.meta, cljs.core.assoc.call(null, this__18453.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__18454 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__18454.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__18455 = this;
  var this__18456 = this;
  return cljs.core.pr_str.call(null, this__18456)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__18457 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__18457.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__18458 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__18458.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__18459 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__18460 = this;
  return cljs.core._comparator.call(null, this__18460.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__18461 = this;
  return cljs.core.keys.call(null, this__18461.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__18462 = this;
  return new cljs.core.PersistentTreeSet(this__18462.meta, cljs.core.dissoc.call(null, this__18462.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18463 = this;
  return cljs.core.count.call(null, this__18463.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18464 = this;
  var and__3822__auto____18465 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____18465) {
    var and__3822__auto____18466 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____18466) {
      return cljs.core.every_QMARK_.call(null, function(p1__18420_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__18420_SHARP_)
      }, other)
    }else {
      return and__3822__auto____18466
    }
  }else {
    return and__3822__auto____18465
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18467 = this;
  return new cljs.core.PersistentTreeSet(meta, this__18467.tree_map, this__18467.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18468 = this;
  return this__18468.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18469 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__18469.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__18475__delegate = function(keys) {
      var in__18473 = cljs.core.seq.call(null, keys);
      var out__18474 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__18473)) {
          var G__18476 = cljs.core.next.call(null, in__18473);
          var G__18477 = cljs.core.conj_BANG_.call(null, out__18474, cljs.core.first.call(null, in__18473));
          in__18473 = G__18476;
          out__18474 = G__18477;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__18474)
        }
        break
      }
    };
    var G__18475 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__18475__delegate.call(this, keys)
    };
    G__18475.cljs$lang$maxFixedArity = 0;
    G__18475.cljs$lang$applyTo = function(arglist__18478) {
      var keys = cljs.core.seq(arglist__18478);
      return G__18475__delegate(keys)
    };
    G__18475.cljs$lang$arity$variadic = G__18475__delegate;
    return G__18475
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
  sorted_set.cljs$lang$applyTo = function(arglist__18479) {
    var keys = cljs.core.seq(arglist__18479);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__18481) {
    var comparator = cljs.core.first(arglist__18481);
    var keys = cljs.core.rest(arglist__18481);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__18487 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____18488 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____18488)) {
        var e__18489 = temp__3971__auto____18488;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__18489))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__18487, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__18480_SHARP_) {
      var temp__3971__auto____18490 = cljs.core.find.call(null, smap, p1__18480_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____18490)) {
        var e__18491 = temp__3971__auto____18490;
        return cljs.core.second.call(null, e__18491)
      }else {
        return p1__18480_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__18521 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__18514, seen) {
        while(true) {
          var vec__18515__18516 = p__18514;
          var f__18517 = cljs.core.nth.call(null, vec__18515__18516, 0, null);
          var xs__18518 = vec__18515__18516;
          var temp__3974__auto____18519 = cljs.core.seq.call(null, xs__18518);
          if(temp__3974__auto____18519) {
            var s__18520 = temp__3974__auto____18519;
            if(cljs.core.contains_QMARK_.call(null, seen, f__18517)) {
              var G__18522 = cljs.core.rest.call(null, s__18520);
              var G__18523 = seen;
              p__18514 = G__18522;
              seen = G__18523;
              continue
            }else {
              return cljs.core.cons.call(null, f__18517, step.call(null, cljs.core.rest.call(null, s__18520), cljs.core.conj.call(null, seen, f__18517)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__18521.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__18526 = cljs.core.PersistentVector.EMPTY;
  var s__18527 = s;
  while(true) {
    if(cljs.core.next.call(null, s__18527)) {
      var G__18528 = cljs.core.conj.call(null, ret__18526, cljs.core.first.call(null, s__18527));
      var G__18529 = cljs.core.next.call(null, s__18527);
      ret__18526 = G__18528;
      s__18527 = G__18529;
      continue
    }else {
      return cljs.core.seq.call(null, ret__18526)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____18532 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____18532) {
        return or__3824__auto____18532
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__18533 = x.lastIndexOf("/");
      if(i__18533 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__18533 + 1)
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
    var or__3824__auto____18536 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____18536) {
      return or__3824__auto____18536
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__18537 = x.lastIndexOf("/");
    if(i__18537 > -1) {
      return cljs.core.subs.call(null, x, 2, i__18537)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__18544 = cljs.core.ObjMap.EMPTY;
  var ks__18545 = cljs.core.seq.call(null, keys);
  var vs__18546 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____18547 = ks__18545;
      if(and__3822__auto____18547) {
        return vs__18546
      }else {
        return and__3822__auto____18547
      }
    }()) {
      var G__18548 = cljs.core.assoc.call(null, map__18544, cljs.core.first.call(null, ks__18545), cljs.core.first.call(null, vs__18546));
      var G__18549 = cljs.core.next.call(null, ks__18545);
      var G__18550 = cljs.core.next.call(null, vs__18546);
      map__18544 = G__18548;
      ks__18545 = G__18549;
      vs__18546 = G__18550;
      continue
    }else {
      return map__18544
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
    var G__18553__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__18538_SHARP_, p2__18539_SHARP_) {
        return max_key.call(null, k, p1__18538_SHARP_, p2__18539_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__18553 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__18553__delegate.call(this, k, x, y, more)
    };
    G__18553.cljs$lang$maxFixedArity = 3;
    G__18553.cljs$lang$applyTo = function(arglist__18554) {
      var k = cljs.core.first(arglist__18554);
      var x = cljs.core.first(cljs.core.next(arglist__18554));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18554)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18554)));
      return G__18553__delegate(k, x, y, more)
    };
    G__18553.cljs$lang$arity$variadic = G__18553__delegate;
    return G__18553
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
    var G__18555__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__18551_SHARP_, p2__18552_SHARP_) {
        return min_key.call(null, k, p1__18551_SHARP_, p2__18552_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__18555 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__18555__delegate.call(this, k, x, y, more)
    };
    G__18555.cljs$lang$maxFixedArity = 3;
    G__18555.cljs$lang$applyTo = function(arglist__18556) {
      var k = cljs.core.first(arglist__18556);
      var x = cljs.core.first(cljs.core.next(arglist__18556));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18556)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18556)));
      return G__18555__delegate(k, x, y, more)
    };
    G__18555.cljs$lang$arity$variadic = G__18555__delegate;
    return G__18555
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
      var temp__3974__auto____18559 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____18559) {
        var s__18560 = temp__3974__auto____18559;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__18560), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__18560)))
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
    var temp__3974__auto____18563 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____18563) {
      var s__18564 = temp__3974__auto____18563;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__18564)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__18564), take_while.call(null, pred, cljs.core.rest.call(null, s__18564)))
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
    var comp__18566 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__18566.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__18578 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____18579 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____18579)) {
        var vec__18580__18581 = temp__3974__auto____18579;
        var e__18582 = cljs.core.nth.call(null, vec__18580__18581, 0, null);
        var s__18583 = vec__18580__18581;
        if(cljs.core.truth_(include__18578.call(null, e__18582))) {
          return s__18583
        }else {
          return cljs.core.next.call(null, s__18583)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__18578, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____18584 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____18584)) {
      var vec__18585__18586 = temp__3974__auto____18584;
      var e__18587 = cljs.core.nth.call(null, vec__18585__18586, 0, null);
      var s__18588 = vec__18585__18586;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__18587)) ? s__18588 : cljs.core.next.call(null, s__18588))
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
    var include__18600 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____18601 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____18601)) {
        var vec__18602__18603 = temp__3974__auto____18601;
        var e__18604 = cljs.core.nth.call(null, vec__18602__18603, 0, null);
        var s__18605 = vec__18602__18603;
        if(cljs.core.truth_(include__18600.call(null, e__18604))) {
          return s__18605
        }else {
          return cljs.core.next.call(null, s__18605)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__18600, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____18606 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____18606)) {
      var vec__18607__18608 = temp__3974__auto____18606;
      var e__18609 = cljs.core.nth.call(null, vec__18607__18608, 0, null);
      var s__18610 = vec__18607__18608;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__18609)) ? s__18610 : cljs.core.next.call(null, s__18610))
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
  var this__18611 = this;
  var h__2192__auto____18612 = this__18611.__hash;
  if(!(h__2192__auto____18612 == null)) {
    return h__2192__auto____18612
  }else {
    var h__2192__auto____18613 = cljs.core.hash_coll.call(null, rng);
    this__18611.__hash = h__2192__auto____18613;
    return h__2192__auto____18613
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__18614 = this;
  if(this__18614.step > 0) {
    if(this__18614.start + this__18614.step < this__18614.end) {
      return new cljs.core.Range(this__18614.meta, this__18614.start + this__18614.step, this__18614.end, this__18614.step, null)
    }else {
      return null
    }
  }else {
    if(this__18614.start + this__18614.step > this__18614.end) {
      return new cljs.core.Range(this__18614.meta, this__18614.start + this__18614.step, this__18614.end, this__18614.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__18615 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__18616 = this;
  var this__18617 = this;
  return cljs.core.pr_str.call(null, this__18617)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__18618 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__18619 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__18620 = this;
  if(this__18620.step > 0) {
    if(this__18620.start < this__18620.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__18620.start > this__18620.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__18621 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__18621.end - this__18621.start) / this__18621.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__18622 = this;
  return this__18622.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__18623 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__18623.meta, this__18623.start + this__18623.step, this__18623.end, this__18623.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__18624 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__18625 = this;
  return new cljs.core.Range(meta, this__18625.start, this__18625.end, this__18625.step, this__18625.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__18626 = this;
  return this__18626.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__18627 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__18627.start + n * this__18627.step
  }else {
    if(function() {
      var and__3822__auto____18628 = this__18627.start > this__18627.end;
      if(and__3822__auto____18628) {
        return this__18627.step === 0
      }else {
        return and__3822__auto____18628
      }
    }()) {
      return this__18627.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__18629 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__18629.start + n * this__18629.step
  }else {
    if(function() {
      var and__3822__auto____18630 = this__18629.start > this__18629.end;
      if(and__3822__auto____18630) {
        return this__18629.step === 0
      }else {
        return and__3822__auto____18630
      }
    }()) {
      return this__18629.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__18631 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__18631.meta)
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
    var temp__3974__auto____18634 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____18634) {
      var s__18635 = temp__3974__auto____18634;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__18635), take_nth.call(null, n, cljs.core.drop.call(null, n, s__18635)))
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
    var temp__3974__auto____18642 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____18642) {
      var s__18643 = temp__3974__auto____18642;
      var fst__18644 = cljs.core.first.call(null, s__18643);
      var fv__18645 = f.call(null, fst__18644);
      var run__18646 = cljs.core.cons.call(null, fst__18644, cljs.core.take_while.call(null, function(p1__18636_SHARP_) {
        return cljs.core._EQ_.call(null, fv__18645, f.call(null, p1__18636_SHARP_))
      }, cljs.core.next.call(null, s__18643)));
      return cljs.core.cons.call(null, run__18646, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__18646), s__18643))))
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
      var temp__3971__auto____18661 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____18661) {
        var s__18662 = temp__3971__auto____18661;
        return reductions.call(null, f, cljs.core.first.call(null, s__18662), cljs.core.rest.call(null, s__18662))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____18663 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____18663) {
        var s__18664 = temp__3974__auto____18663;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__18664)), cljs.core.rest.call(null, s__18664))
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
      var G__18667 = null;
      var G__18667__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__18667__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__18667__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__18667__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__18667__4 = function() {
        var G__18668__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__18668 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__18668__delegate.call(this, x, y, z, args)
        };
        G__18668.cljs$lang$maxFixedArity = 3;
        G__18668.cljs$lang$applyTo = function(arglist__18669) {
          var x = cljs.core.first(arglist__18669);
          var y = cljs.core.first(cljs.core.next(arglist__18669));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18669)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18669)));
          return G__18668__delegate(x, y, z, args)
        };
        G__18668.cljs$lang$arity$variadic = G__18668__delegate;
        return G__18668
      }();
      G__18667 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__18667__0.call(this);
          case 1:
            return G__18667__1.call(this, x);
          case 2:
            return G__18667__2.call(this, x, y);
          case 3:
            return G__18667__3.call(this, x, y, z);
          default:
            return G__18667__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__18667.cljs$lang$maxFixedArity = 3;
      G__18667.cljs$lang$applyTo = G__18667__4.cljs$lang$applyTo;
      return G__18667
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__18670 = null;
      var G__18670__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__18670__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__18670__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__18670__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__18670__4 = function() {
        var G__18671__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__18671 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__18671__delegate.call(this, x, y, z, args)
        };
        G__18671.cljs$lang$maxFixedArity = 3;
        G__18671.cljs$lang$applyTo = function(arglist__18672) {
          var x = cljs.core.first(arglist__18672);
          var y = cljs.core.first(cljs.core.next(arglist__18672));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18672)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18672)));
          return G__18671__delegate(x, y, z, args)
        };
        G__18671.cljs$lang$arity$variadic = G__18671__delegate;
        return G__18671
      }();
      G__18670 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__18670__0.call(this);
          case 1:
            return G__18670__1.call(this, x);
          case 2:
            return G__18670__2.call(this, x, y);
          case 3:
            return G__18670__3.call(this, x, y, z);
          default:
            return G__18670__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__18670.cljs$lang$maxFixedArity = 3;
      G__18670.cljs$lang$applyTo = G__18670__4.cljs$lang$applyTo;
      return G__18670
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__18673 = null;
      var G__18673__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__18673__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__18673__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__18673__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__18673__4 = function() {
        var G__18674__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__18674 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__18674__delegate.call(this, x, y, z, args)
        };
        G__18674.cljs$lang$maxFixedArity = 3;
        G__18674.cljs$lang$applyTo = function(arglist__18675) {
          var x = cljs.core.first(arglist__18675);
          var y = cljs.core.first(cljs.core.next(arglist__18675));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18675)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18675)));
          return G__18674__delegate(x, y, z, args)
        };
        G__18674.cljs$lang$arity$variadic = G__18674__delegate;
        return G__18674
      }();
      G__18673 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__18673__0.call(this);
          case 1:
            return G__18673__1.call(this, x);
          case 2:
            return G__18673__2.call(this, x, y);
          case 3:
            return G__18673__3.call(this, x, y, z);
          default:
            return G__18673__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__18673.cljs$lang$maxFixedArity = 3;
      G__18673.cljs$lang$applyTo = G__18673__4.cljs$lang$applyTo;
      return G__18673
    }()
  };
  var juxt__4 = function() {
    var G__18676__delegate = function(f, g, h, fs) {
      var fs__18666 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__18677 = null;
        var G__18677__0 = function() {
          return cljs.core.reduce.call(null, function(p1__18647_SHARP_, p2__18648_SHARP_) {
            return cljs.core.conj.call(null, p1__18647_SHARP_, p2__18648_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__18666)
        };
        var G__18677__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__18649_SHARP_, p2__18650_SHARP_) {
            return cljs.core.conj.call(null, p1__18649_SHARP_, p2__18650_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__18666)
        };
        var G__18677__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__18651_SHARP_, p2__18652_SHARP_) {
            return cljs.core.conj.call(null, p1__18651_SHARP_, p2__18652_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__18666)
        };
        var G__18677__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__18653_SHARP_, p2__18654_SHARP_) {
            return cljs.core.conj.call(null, p1__18653_SHARP_, p2__18654_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__18666)
        };
        var G__18677__4 = function() {
          var G__18678__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__18655_SHARP_, p2__18656_SHARP_) {
              return cljs.core.conj.call(null, p1__18655_SHARP_, cljs.core.apply.call(null, p2__18656_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__18666)
          };
          var G__18678 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__18678__delegate.call(this, x, y, z, args)
          };
          G__18678.cljs$lang$maxFixedArity = 3;
          G__18678.cljs$lang$applyTo = function(arglist__18679) {
            var x = cljs.core.first(arglist__18679);
            var y = cljs.core.first(cljs.core.next(arglist__18679));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18679)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18679)));
            return G__18678__delegate(x, y, z, args)
          };
          G__18678.cljs$lang$arity$variadic = G__18678__delegate;
          return G__18678
        }();
        G__18677 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__18677__0.call(this);
            case 1:
              return G__18677__1.call(this, x);
            case 2:
              return G__18677__2.call(this, x, y);
            case 3:
              return G__18677__3.call(this, x, y, z);
            default:
              return G__18677__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__18677.cljs$lang$maxFixedArity = 3;
        G__18677.cljs$lang$applyTo = G__18677__4.cljs$lang$applyTo;
        return G__18677
      }()
    };
    var G__18676 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__18676__delegate.call(this, f, g, h, fs)
    };
    G__18676.cljs$lang$maxFixedArity = 3;
    G__18676.cljs$lang$applyTo = function(arglist__18680) {
      var f = cljs.core.first(arglist__18680);
      var g = cljs.core.first(cljs.core.next(arglist__18680));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18680)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18680)));
      return G__18676__delegate(f, g, h, fs)
    };
    G__18676.cljs$lang$arity$variadic = G__18676__delegate;
    return G__18676
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
        var G__18683 = cljs.core.next.call(null, coll);
        coll = G__18683;
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
        var and__3822__auto____18682 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____18682) {
          return n > 0
        }else {
          return and__3822__auto____18682
        }
      }())) {
        var G__18684 = n - 1;
        var G__18685 = cljs.core.next.call(null, coll);
        n = G__18684;
        coll = G__18685;
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
  var matches__18687 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__18687), s)) {
    if(cljs.core.count.call(null, matches__18687) === 1) {
      return cljs.core.first.call(null, matches__18687)
    }else {
      return cljs.core.vec.call(null, matches__18687)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__18689 = re.exec(s);
  if(matches__18689 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__18689) === 1) {
      return cljs.core.first.call(null, matches__18689)
    }else {
      return cljs.core.vec.call(null, matches__18689)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__18694 = cljs.core.re_find.call(null, re, s);
  var match_idx__18695 = s.search(re);
  var match_str__18696 = cljs.core.coll_QMARK_.call(null, match_data__18694) ? cljs.core.first.call(null, match_data__18694) : match_data__18694;
  var post_match__18697 = cljs.core.subs.call(null, s, match_idx__18695 + cljs.core.count.call(null, match_str__18696));
  if(cljs.core.truth_(match_data__18694)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__18694, re_seq.call(null, re, post_match__18697))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__18704__18705 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___18706 = cljs.core.nth.call(null, vec__18704__18705, 0, null);
  var flags__18707 = cljs.core.nth.call(null, vec__18704__18705, 1, null);
  var pattern__18708 = cljs.core.nth.call(null, vec__18704__18705, 2, null);
  return new RegExp(pattern__18708, flags__18707)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__18698_SHARP_) {
    return print_one.call(null, p1__18698_SHARP_, opts)
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
          var and__3822__auto____18718 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____18718)) {
            var and__3822__auto____18722 = function() {
              var G__18719__18720 = obj;
              if(G__18719__18720) {
                if(function() {
                  var or__3824__auto____18721 = G__18719__18720.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____18721) {
                    return or__3824__auto____18721
                  }else {
                    return G__18719__18720.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__18719__18720.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__18719__18720)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__18719__18720)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____18722)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____18722
            }
          }else {
            return and__3822__auto____18718
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____18723 = !(obj == null);
          if(and__3822__auto____18723) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____18723
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__18724__18725 = obj;
          if(G__18724__18725) {
            if(function() {
              var or__3824__auto____18726 = G__18724__18725.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____18726) {
                return or__3824__auto____18726
              }else {
                return G__18724__18725.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__18724__18725.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__18724__18725)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__18724__18725)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__18746 = new goog.string.StringBuffer;
  var G__18747__18748 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__18747__18748) {
    var string__18749 = cljs.core.first.call(null, G__18747__18748);
    var G__18747__18750 = G__18747__18748;
    while(true) {
      sb__18746.append(string__18749);
      var temp__3974__auto____18751 = cljs.core.next.call(null, G__18747__18750);
      if(temp__3974__auto____18751) {
        var G__18747__18752 = temp__3974__auto____18751;
        var G__18765 = cljs.core.first.call(null, G__18747__18752);
        var G__18766 = G__18747__18752;
        string__18749 = G__18765;
        G__18747__18750 = G__18766;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__18753__18754 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__18753__18754) {
    var obj__18755 = cljs.core.first.call(null, G__18753__18754);
    var G__18753__18756 = G__18753__18754;
    while(true) {
      sb__18746.append(" ");
      var G__18757__18758 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__18755, opts));
      if(G__18757__18758) {
        var string__18759 = cljs.core.first.call(null, G__18757__18758);
        var G__18757__18760 = G__18757__18758;
        while(true) {
          sb__18746.append(string__18759);
          var temp__3974__auto____18761 = cljs.core.next.call(null, G__18757__18760);
          if(temp__3974__auto____18761) {
            var G__18757__18762 = temp__3974__auto____18761;
            var G__18767 = cljs.core.first.call(null, G__18757__18762);
            var G__18768 = G__18757__18762;
            string__18759 = G__18767;
            G__18757__18760 = G__18768;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____18763 = cljs.core.next.call(null, G__18753__18756);
      if(temp__3974__auto____18763) {
        var G__18753__18764 = temp__3974__auto____18763;
        var G__18769 = cljs.core.first.call(null, G__18753__18764);
        var G__18770 = G__18753__18764;
        obj__18755 = G__18769;
        G__18753__18756 = G__18770;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__18746
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__18772 = cljs.core.pr_sb.call(null, objs, opts);
  sb__18772.append("\n");
  return[cljs.core.str(sb__18772)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__18791__18792 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__18791__18792) {
    var string__18793 = cljs.core.first.call(null, G__18791__18792);
    var G__18791__18794 = G__18791__18792;
    while(true) {
      cljs.core.string_print.call(null, string__18793);
      var temp__3974__auto____18795 = cljs.core.next.call(null, G__18791__18794);
      if(temp__3974__auto____18795) {
        var G__18791__18796 = temp__3974__auto____18795;
        var G__18809 = cljs.core.first.call(null, G__18791__18796);
        var G__18810 = G__18791__18796;
        string__18793 = G__18809;
        G__18791__18794 = G__18810;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__18797__18798 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__18797__18798) {
    var obj__18799 = cljs.core.first.call(null, G__18797__18798);
    var G__18797__18800 = G__18797__18798;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__18801__18802 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__18799, opts));
      if(G__18801__18802) {
        var string__18803 = cljs.core.first.call(null, G__18801__18802);
        var G__18801__18804 = G__18801__18802;
        while(true) {
          cljs.core.string_print.call(null, string__18803);
          var temp__3974__auto____18805 = cljs.core.next.call(null, G__18801__18804);
          if(temp__3974__auto____18805) {
            var G__18801__18806 = temp__3974__auto____18805;
            var G__18811 = cljs.core.first.call(null, G__18801__18806);
            var G__18812 = G__18801__18806;
            string__18803 = G__18811;
            G__18801__18804 = G__18812;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____18807 = cljs.core.next.call(null, G__18797__18800);
      if(temp__3974__auto____18807) {
        var G__18797__18808 = temp__3974__auto____18807;
        var G__18813 = cljs.core.first.call(null, G__18797__18808);
        var G__18814 = G__18797__18808;
        obj__18799 = G__18813;
        G__18797__18800 = G__18814;
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
  pr_str.cljs$lang$applyTo = function(arglist__18815) {
    var objs = cljs.core.seq(arglist__18815);
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
  prn_str.cljs$lang$applyTo = function(arglist__18816) {
    var objs = cljs.core.seq(arglist__18816);
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
  pr.cljs$lang$applyTo = function(arglist__18817) {
    var objs = cljs.core.seq(arglist__18817);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__18818) {
    var objs = cljs.core.seq(arglist__18818);
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
  print_str.cljs$lang$applyTo = function(arglist__18819) {
    var objs = cljs.core.seq(arglist__18819);
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
  println.cljs$lang$applyTo = function(arglist__18820) {
    var objs = cljs.core.seq(arglist__18820);
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
  println_str.cljs$lang$applyTo = function(arglist__18821) {
    var objs = cljs.core.seq(arglist__18821);
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
  prn.cljs$lang$applyTo = function(arglist__18822) {
    var objs = cljs.core.seq(arglist__18822);
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
  printf.cljs$lang$applyTo = function(arglist__18823) {
    var fmt = cljs.core.first(arglist__18823);
    var args = cljs.core.rest(arglist__18823);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__18824 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18824, "{", ", ", "}", opts, coll)
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
  var pr_pair__18825 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18825, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__18826 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18826, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____18827 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____18827)) {
        var nspc__18828 = temp__3974__auto____18827;
        return[cljs.core.str(nspc__18828), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____18829 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____18829)) {
          var nspc__18830 = temp__3974__auto____18829;
          return[cljs.core.str(nspc__18830), cljs.core.str("/")].join("")
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
  var pr_pair__18831 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18831, "{", ", ", "}", opts, coll)
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
  var normalize__18833 = function(n, len) {
    var ns__18832 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__18832) < len) {
        var G__18835 = [cljs.core.str("0"), cljs.core.str(ns__18832)].join("");
        ns__18832 = G__18835;
        continue
      }else {
        return ns__18832
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__18833.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__18833.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__18833.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__18833.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__18833.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__18833.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__18834 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18834, "{", ", ", "}", opts, coll)
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
  var this__18836 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__18837 = this;
  var G__18838__18839 = cljs.core.seq.call(null, this__18837.watches);
  if(G__18838__18839) {
    var G__18841__18843 = cljs.core.first.call(null, G__18838__18839);
    var vec__18842__18844 = G__18841__18843;
    var key__18845 = cljs.core.nth.call(null, vec__18842__18844, 0, null);
    var f__18846 = cljs.core.nth.call(null, vec__18842__18844, 1, null);
    var G__18838__18847 = G__18838__18839;
    var G__18841__18848 = G__18841__18843;
    var G__18838__18849 = G__18838__18847;
    while(true) {
      var vec__18850__18851 = G__18841__18848;
      var key__18852 = cljs.core.nth.call(null, vec__18850__18851, 0, null);
      var f__18853 = cljs.core.nth.call(null, vec__18850__18851, 1, null);
      var G__18838__18854 = G__18838__18849;
      f__18853.call(null, key__18852, this$, oldval, newval);
      var temp__3974__auto____18855 = cljs.core.next.call(null, G__18838__18854);
      if(temp__3974__auto____18855) {
        var G__18838__18856 = temp__3974__auto____18855;
        var G__18863 = cljs.core.first.call(null, G__18838__18856);
        var G__18864 = G__18838__18856;
        G__18841__18848 = G__18863;
        G__18838__18849 = G__18864;
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
  var this__18857 = this;
  return this$.watches = cljs.core.assoc.call(null, this__18857.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__18858 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__18858.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__18859 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__18859.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__18860 = this;
  return this__18860.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__18861 = this;
  return this__18861.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__18862 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__18876__delegate = function(x, p__18865) {
      var map__18871__18872 = p__18865;
      var map__18871__18873 = cljs.core.seq_QMARK_.call(null, map__18871__18872) ? cljs.core.apply.call(null, cljs.core.hash_map, map__18871__18872) : map__18871__18872;
      var validator__18874 = cljs.core._lookup.call(null, map__18871__18873, "\ufdd0'validator", null);
      var meta__18875 = cljs.core._lookup.call(null, map__18871__18873, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__18875, validator__18874, null)
    };
    var G__18876 = function(x, var_args) {
      var p__18865 = null;
      if(goog.isDef(var_args)) {
        p__18865 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__18876__delegate.call(this, x, p__18865)
    };
    G__18876.cljs$lang$maxFixedArity = 1;
    G__18876.cljs$lang$applyTo = function(arglist__18877) {
      var x = cljs.core.first(arglist__18877);
      var p__18865 = cljs.core.rest(arglist__18877);
      return G__18876__delegate(x, p__18865)
    };
    G__18876.cljs$lang$arity$variadic = G__18876__delegate;
    return G__18876
  }();
  atom = function(x, var_args) {
    var p__18865 = var_args;
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
  var temp__3974__auto____18881 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____18881)) {
    var validate__18882 = temp__3974__auto____18881;
    if(cljs.core.truth_(validate__18882.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__18883 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__18883, new_value);
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
    var G__18884__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__18884 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__18884__delegate.call(this, a, f, x, y, z, more)
    };
    G__18884.cljs$lang$maxFixedArity = 5;
    G__18884.cljs$lang$applyTo = function(arglist__18885) {
      var a = cljs.core.first(arglist__18885);
      var f = cljs.core.first(cljs.core.next(arglist__18885));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18885)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__18885))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__18885)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__18885)))));
      return G__18884__delegate(a, f, x, y, z, more)
    };
    G__18884.cljs$lang$arity$variadic = G__18884__delegate;
    return G__18884
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__18886) {
    var iref = cljs.core.first(arglist__18886);
    var f = cljs.core.first(cljs.core.next(arglist__18886));
    var args = cljs.core.rest(cljs.core.next(arglist__18886));
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
  var this__18887 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__18887.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__18888 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__18888.state, function(p__18889) {
    var map__18890__18891 = p__18889;
    var map__18890__18892 = cljs.core.seq_QMARK_.call(null, map__18890__18891) ? cljs.core.apply.call(null, cljs.core.hash_map, map__18890__18891) : map__18890__18891;
    var curr_state__18893 = map__18890__18892;
    var done__18894 = cljs.core._lookup.call(null, map__18890__18892, "\ufdd0'done", null);
    if(cljs.core.truth_(done__18894)) {
      return curr_state__18893
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__18888.f.call(null)})
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
    var map__18915__18916 = options;
    var map__18915__18917 = cljs.core.seq_QMARK_.call(null, map__18915__18916) ? cljs.core.apply.call(null, cljs.core.hash_map, map__18915__18916) : map__18915__18916;
    var keywordize_keys__18918 = cljs.core._lookup.call(null, map__18915__18917, "\ufdd0'keywordize-keys", null);
    var keyfn__18919 = cljs.core.truth_(keywordize_keys__18918) ? cljs.core.keyword : cljs.core.str;
    var f__18934 = function thisfn(x) {
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
                var iter__2462__auto____18933 = function iter__18927(s__18928) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__18928__18931 = s__18928;
                    while(true) {
                      if(cljs.core.seq.call(null, s__18928__18931)) {
                        var k__18932 = cljs.core.first.call(null, s__18928__18931);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__18919.call(null, k__18932), thisfn.call(null, x[k__18932])], true), iter__18927.call(null, cljs.core.rest.call(null, s__18928__18931)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____18933.call(null, cljs.core.js_keys.call(null, x))
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
    return f__18934.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__18935) {
    var x = cljs.core.first(arglist__18935);
    var options = cljs.core.rest(arglist__18935);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__18940 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__18944__delegate = function(args) {
      var temp__3971__auto____18941 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__18940), args, null);
      if(cljs.core.truth_(temp__3971__auto____18941)) {
        var v__18942 = temp__3971__auto____18941;
        return v__18942
      }else {
        var ret__18943 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__18940, cljs.core.assoc, args, ret__18943);
        return ret__18943
      }
    };
    var G__18944 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__18944__delegate.call(this, args)
    };
    G__18944.cljs$lang$maxFixedArity = 0;
    G__18944.cljs$lang$applyTo = function(arglist__18945) {
      var args = cljs.core.seq(arglist__18945);
      return G__18944__delegate(args)
    };
    G__18944.cljs$lang$arity$variadic = G__18944__delegate;
    return G__18944
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__18947 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__18947)) {
        var G__18948 = ret__18947;
        f = G__18948;
        continue
      }else {
        return ret__18947
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__18949__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__18949 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__18949__delegate.call(this, f, args)
    };
    G__18949.cljs$lang$maxFixedArity = 1;
    G__18949.cljs$lang$applyTo = function(arglist__18950) {
      var f = cljs.core.first(arglist__18950);
      var args = cljs.core.rest(arglist__18950);
      return G__18949__delegate(f, args)
    };
    G__18949.cljs$lang$arity$variadic = G__18949__delegate;
    return G__18949
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
    var k__18952 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__18952, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__18952, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____18961 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____18961) {
      return or__3824__auto____18961
    }else {
      var or__3824__auto____18962 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____18962) {
        return or__3824__auto____18962
      }else {
        var and__3822__auto____18963 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____18963) {
          var and__3822__auto____18964 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____18964) {
            var and__3822__auto____18965 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____18965) {
              var ret__18966 = true;
              var i__18967 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____18968 = cljs.core.not.call(null, ret__18966);
                  if(or__3824__auto____18968) {
                    return or__3824__auto____18968
                  }else {
                    return i__18967 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__18966
                }else {
                  var G__18969 = isa_QMARK_.call(null, h, child.call(null, i__18967), parent.call(null, i__18967));
                  var G__18970 = i__18967 + 1;
                  ret__18966 = G__18969;
                  i__18967 = G__18970;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____18965
            }
          }else {
            return and__3822__auto____18964
          }
        }else {
          return and__3822__auto____18963
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
    var tp__18979 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__18980 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__18981 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__18982 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____18983 = cljs.core.contains_QMARK_.call(null, tp__18979.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__18981.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__18981.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__18979, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__18982.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__18980, parent, ta__18981), "\ufdd0'descendants":tf__18982.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__18981, tag, td__18980)})
    }();
    if(cljs.core.truth_(or__3824__auto____18983)) {
      return or__3824__auto____18983
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
    var parentMap__18988 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__18989 = cljs.core.truth_(parentMap__18988.call(null, tag)) ? cljs.core.disj.call(null, parentMap__18988.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__18990 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__18989)) ? cljs.core.assoc.call(null, parentMap__18988, tag, childsParents__18989) : cljs.core.dissoc.call(null, parentMap__18988, tag);
    var deriv_seq__18991 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__18971_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__18971_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__18971_SHARP_), cljs.core.second.call(null, p1__18971_SHARP_)))
    }, cljs.core.seq.call(null, newParents__18990)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__18988.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__18972_SHARP_, p2__18973_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__18972_SHARP_, p2__18973_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__18991))
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
  var xprefs__18999 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____19001 = cljs.core.truth_(function() {
    var and__3822__auto____19000 = xprefs__18999;
    if(cljs.core.truth_(and__3822__auto____19000)) {
      return xprefs__18999.call(null, y)
    }else {
      return and__3822__auto____19000
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____19001)) {
    return or__3824__auto____19001
  }else {
    var or__3824__auto____19003 = function() {
      var ps__19002 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__19002) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__19002), prefer_table))) {
          }else {
          }
          var G__19006 = cljs.core.rest.call(null, ps__19002);
          ps__19002 = G__19006;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____19003)) {
      return or__3824__auto____19003
    }else {
      var or__3824__auto____19005 = function() {
        var ps__19004 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__19004) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__19004), y, prefer_table))) {
            }else {
            }
            var G__19007 = cljs.core.rest.call(null, ps__19004);
            ps__19004 = G__19007;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____19005)) {
        return or__3824__auto____19005
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____19009 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____19009)) {
    return or__3824__auto____19009
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__19027 = cljs.core.reduce.call(null, function(be, p__19019) {
    var vec__19020__19021 = p__19019;
    var k__19022 = cljs.core.nth.call(null, vec__19020__19021, 0, null);
    var ___19023 = cljs.core.nth.call(null, vec__19020__19021, 1, null);
    var e__19024 = vec__19020__19021;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__19022)) {
      var be2__19026 = cljs.core.truth_(function() {
        var or__3824__auto____19025 = be == null;
        if(or__3824__auto____19025) {
          return or__3824__auto____19025
        }else {
          return cljs.core.dominates.call(null, k__19022, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__19024 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__19026), k__19022, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__19022), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__19026)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__19026
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__19027)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__19027));
      return cljs.core.second.call(null, best_entry__19027)
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
    var and__3822__auto____19032 = mf;
    if(and__3822__auto____19032) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____19032
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____19033 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19034 = cljs.core._reset[goog.typeOf(x__2363__auto____19033)];
      if(or__3824__auto____19034) {
        return or__3824__auto____19034
      }else {
        var or__3824__auto____19035 = cljs.core._reset["_"];
        if(or__3824__auto____19035) {
          return or__3824__auto____19035
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____19040 = mf;
    if(and__3822__auto____19040) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____19040
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____19041 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19042 = cljs.core._add_method[goog.typeOf(x__2363__auto____19041)];
      if(or__3824__auto____19042) {
        return or__3824__auto____19042
      }else {
        var or__3824__auto____19043 = cljs.core._add_method["_"];
        if(or__3824__auto____19043) {
          return or__3824__auto____19043
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____19048 = mf;
    if(and__3822__auto____19048) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____19048
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____19049 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19050 = cljs.core._remove_method[goog.typeOf(x__2363__auto____19049)];
      if(or__3824__auto____19050) {
        return or__3824__auto____19050
      }else {
        var or__3824__auto____19051 = cljs.core._remove_method["_"];
        if(or__3824__auto____19051) {
          return or__3824__auto____19051
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____19056 = mf;
    if(and__3822__auto____19056) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____19056
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____19057 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19058 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____19057)];
      if(or__3824__auto____19058) {
        return or__3824__auto____19058
      }else {
        var or__3824__auto____19059 = cljs.core._prefer_method["_"];
        if(or__3824__auto____19059) {
          return or__3824__auto____19059
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____19064 = mf;
    if(and__3822__auto____19064) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____19064
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____19065 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19066 = cljs.core._get_method[goog.typeOf(x__2363__auto____19065)];
      if(or__3824__auto____19066) {
        return or__3824__auto____19066
      }else {
        var or__3824__auto____19067 = cljs.core._get_method["_"];
        if(or__3824__auto____19067) {
          return or__3824__auto____19067
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____19072 = mf;
    if(and__3822__auto____19072) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____19072
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____19073 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19074 = cljs.core._methods[goog.typeOf(x__2363__auto____19073)];
      if(or__3824__auto____19074) {
        return or__3824__auto____19074
      }else {
        var or__3824__auto____19075 = cljs.core._methods["_"];
        if(or__3824__auto____19075) {
          return or__3824__auto____19075
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____19080 = mf;
    if(and__3822__auto____19080) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____19080
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____19081 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19082 = cljs.core._prefers[goog.typeOf(x__2363__auto____19081)];
      if(or__3824__auto____19082) {
        return or__3824__auto____19082
      }else {
        var or__3824__auto____19083 = cljs.core._prefers["_"];
        if(or__3824__auto____19083) {
          return or__3824__auto____19083
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____19088 = mf;
    if(and__3822__auto____19088) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____19088
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____19089 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19090 = cljs.core._dispatch[goog.typeOf(x__2363__auto____19089)];
      if(or__3824__auto____19090) {
        return or__3824__auto____19090
      }else {
        var or__3824__auto____19091 = cljs.core._dispatch["_"];
        if(or__3824__auto____19091) {
          return or__3824__auto____19091
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__19094 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__19095 = cljs.core._get_method.call(null, mf, dispatch_val__19094);
  if(cljs.core.truth_(target_fn__19095)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__19094)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__19095, args)
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
  var this__19096 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__19097 = this;
  cljs.core.swap_BANG_.call(null, this__19097.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__19097.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__19097.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__19097.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__19098 = this;
  cljs.core.swap_BANG_.call(null, this__19098.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__19098.method_cache, this__19098.method_table, this__19098.cached_hierarchy, this__19098.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__19099 = this;
  cljs.core.swap_BANG_.call(null, this__19099.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__19099.method_cache, this__19099.method_table, this__19099.cached_hierarchy, this__19099.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__19100 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__19100.cached_hierarchy), cljs.core.deref.call(null, this__19100.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__19100.method_cache, this__19100.method_table, this__19100.cached_hierarchy, this__19100.hierarchy)
  }
  var temp__3971__auto____19101 = cljs.core.deref.call(null, this__19100.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____19101)) {
    var target_fn__19102 = temp__3971__auto____19101;
    return target_fn__19102
  }else {
    var temp__3971__auto____19103 = cljs.core.find_and_cache_best_method.call(null, this__19100.name, dispatch_val, this__19100.hierarchy, this__19100.method_table, this__19100.prefer_table, this__19100.method_cache, this__19100.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____19103)) {
      var target_fn__19104 = temp__3971__auto____19103;
      return target_fn__19104
    }else {
      return cljs.core.deref.call(null, this__19100.method_table).call(null, this__19100.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__19105 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__19105.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__19105.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__19105.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__19105.method_cache, this__19105.method_table, this__19105.cached_hierarchy, this__19105.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__19106 = this;
  return cljs.core.deref.call(null, this__19106.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__19107 = this;
  return cljs.core.deref.call(null, this__19107.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__19108 = this;
  return cljs.core.do_dispatch.call(null, mf, this__19108.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__19110__delegate = function(_, args) {
    var self__19109 = this;
    return cljs.core._dispatch.call(null, self__19109, args)
  };
  var G__19110 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__19110__delegate.call(this, _, args)
  };
  G__19110.cljs$lang$maxFixedArity = 1;
  G__19110.cljs$lang$applyTo = function(arglist__19111) {
    var _ = cljs.core.first(arglist__19111);
    var args = cljs.core.rest(arglist__19111);
    return G__19110__delegate(_, args)
  };
  G__19110.cljs$lang$arity$variadic = G__19110__delegate;
  return G__19110
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__19112 = this;
  return cljs.core._dispatch.call(null, self__19112, args)
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
  var this__19113 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_19115, _) {
  var this__19114 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__19114.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__19116 = this;
  var and__3822__auto____19117 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____19117) {
    return this__19116.uuid === other.uuid
  }else {
    return and__3822__auto____19117
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__19118 = this;
  var this__19119 = this;
  return cljs.core.pr_str.call(null, this__19119)
};
cljs.core.UUID;
goog.provide("subpar.paredit");
goog.require("cljs.core");
subpar.paredit.code = "c";
subpar.paredit.cmmnt = ";";
subpar.paredit.string = '"';
subpar.paredit.openers = cljs.core.PersistentHashSet.fromArray(["(", "[", "{"]);
subpar.paredit.closers = cljs.core.PersistentHashSet.fromArray([")", "]", "}"]);
subpar.paredit.opener_QMARK_ = function opener_QMARK_(a) {
  return cljs.core.contains_QMARK_.call(null, subpar.paredit.openers, a)
};
subpar.paredit.closer_QMARK_ = function closer_QMARK_(a) {
  return cljs.core.contains_QMARK_.call(null, subpar.paredit.closers, a)
};
subpar.paredit.whitespace_QMARK_ = function whitespace_QMARK_(x) {
  var or__3824__auto____19122 = cljs.core._EQ_.call(null, x, "\t");
  if(or__3824__auto____19122) {
    return or__3824__auto____19122
  }else {
    var or__3824__auto____19123 = cljs.core._EQ_.call(null, x, " ");
    if(or__3824__auto____19123) {
      return or__3824__auto____19123
    }else {
      return cljs.core._EQ_.call(null, x, "\n")
    }
  }
};
subpar.paredit.get_opening_delimiter_index_with_parse = function get_opening_delimiter_index_with_parse(p, i) {
  return cljs.core.nth.call(null, cljs.core.nth.call(null, (new cljs.core.Keyword("\ufdd0'chars")).call(null, p), i), 1)
};
subpar.paredit.get_closing_delimiter_index_with_parse = function get_closing_delimiter_index_with_parse(p, i) {
  return cljs.core.get_in.call(null, p, cljs.core.PersistentVector.fromArray(["\ufdd0'families", subpar.paredit.get_opening_delimiter_index_with_parse.call(null, p, i), "\ufdd0'closer"], true))
};
subpar.paredit.get_opening_delimiter_index = function get_opening_delimiter_index(s, i) {
  return subpar.paredit.get_opening_delimiter_index_with_parse.call(null, subpar.paredit.parse.call(null, s), i)
};
subpar.paredit.get_closing_delimiter_index = function get_closing_delimiter_index(s, i) {
  return subpar.paredit.get_closing_delimiter_index_with_parse.call(null, subpar.paredit.parse.call(null, s), i)
};
subpar.paredit.get_wrapper = function get_wrapper(p, i) {
  return cljs.core.PersistentVector.fromArray([subpar.paredit.get_opening_delimiter_index_with_parse.call(null, p, i), subpar.paredit.get_closing_delimiter_index_with_parse.call(null, p, i)], true)
};
subpar.paredit.get_mode = function get_mode(p, i) {
  return cljs.core.nth.call(null, cljs.core.nth.call(null, (new cljs.core.Keyword("\ufdd0'chars")).call(null, p), i), 0)
};
subpar.paredit.in_QMARK_ = function in_QMARK_(p, i, mode) {
  var and__3822__auto____19127 = function() {
    var and__3822__auto____19126 = 0 <= i;
    if(and__3822__auto____19126) {
      return i <= cljs.core.count.call(null, (new cljs.core.Keyword("\ufdd0'chars")).call(null, p))
    }else {
      return and__3822__auto____19126
    }
  }();
  if(cljs.core.truth_(and__3822__auto____19127)) {
    return cljs.core._EQ_.call(null, mode, subpar.paredit.get_mode.call(null, p, i))
  }else {
    return and__3822__auto____19127
  }
};
subpar.paredit.in_comment_QMARK_ = function in_comment_QMARK_(p, i) {
  return subpar.paredit.in_QMARK_.call(null, p, i, subpar.paredit.cmmnt)
};
subpar.paredit.in_code_QMARK_ = function in_code_QMARK_(p, i) {
  return subpar.paredit.in_QMARK_.call(null, p, i, subpar.paredit.code)
};
subpar.paredit.in_string_QMARK_ = function in_string_QMARK_(p, i) {
  return subpar.paredit.in_QMARK_.call(null, p, i, subpar.paredit.string)
};
subpar.paredit.in_string = function in_string(s, i) {
  return subpar.paredit.in_string_QMARK_.call(null, subpar.paredit.parse.call(null, s), i)
};
subpar.paredit.n_str_QMARK_ = cljs.core.complement.call(null, subpar.paredit.in_string_QMARK_);
subpar.paredit.get_all_siblings = function get_all_siblings(i, p) {
  return cljs.core.get_in.call(null, p, cljs.core.PersistentVector.fromArray(["\ufdd0'families", subpar.paredit.get_opening_delimiter_index_with_parse.call(null, p, i), "\ufdd0'children"], true))
};
subpar.paredit.get_siblings = function get_siblings(i, transform, predicate, p) {
  return cljs.core.sort.call(null, cljs.core.filter.call(null, predicate, transform.call(null, subpar.paredit.get_all_siblings.call(null, i, p))))
};
subpar.paredit.count_lines = function count_lines(s, i, j) {
  var and__3822__auto____19131 = i;
  if(cljs.core.truth_(and__3822__auto____19131)) {
    var and__3822__auto____19132 = j;
    if(cljs.core.truth_(and__3822__auto____19132)) {
      return cljs.core.count.call(null, cljs.core.filter.call(null, function(p1__19128_SHARP_) {
        return cljs.core._EQ_.call(null, "\n", p1__19128_SHARP_)
      }, cljs.core.drop.call(null, i, cljs.core.drop_last.call(null, cljs.core.count.call(null, s) - j - 1, cljs.core.take.call(null, cljs.core.count.call(null, s), s))))) + 1
    }else {
      return and__3822__auto____19132
    }
  }else {
    return and__3822__auto____19131
  }
};
subpar.paredit.escaped_QMARK_ = function escaped_QMARK_(s, i) {
  return cljs.core.odd_QMARK_.call(null, function() {
    var c__19136 = 0;
    var j__19137 = i - 1;
    while(true) {
      var a__19138 = cljs.core.nth.call(null, s, j__19137, null);
      if(j__19137 < 0) {
        return c__19136
      }else {
        if(a__19138 == null) {
          return c__19136
        }else {
          if(cljs.core.not_EQ_.call(null, "\\", a__19138)) {
            return c__19136
          }else {
            if(true) {
              var G__19139 = c__19136 + 1;
              var G__19140 = j__19137 - 1;
              c__19136 = G__19139;
              j__19137 = G__19140;
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
subpar.paredit.closes_list_QMARK_ = function closes_list_QMARK_(p, i) {
  return cljs.core.some.call(null, cljs.core.PersistentHashSet.fromArray([i]), cljs.core.map.call(null, "\ufdd0'closer", cljs.core.vals.call(null, (new cljs.core.Keyword("\ufdd0'families")).call(null, p))))
};
subpar.paredit.opens_list_QMARK_ = function opens_list_QMARK_(p, i) {
  return cljs.core.some.call(null, cljs.core.PersistentHashSet.fromArray([i]), cljs.core.keys.call(null, (new cljs.core.Keyword("\ufdd0'families")).call(null, p)))
};
subpar.paredit.backward_up_fn = function backward_up_fn(s, i) {
  var vec__19145__19146 = subpar.paredit.get_wrapper.call(null, subpar.paredit.parse.call(null, s), i);
  var o__19147 = cljs.core.nth.call(null, vec__19145__19146, 0, null);
  var c__19148 = cljs.core.nth.call(null, vec__19145__19146, 1, null);
  if(cljs.core._EQ_.call(null, -1, o__19147)) {
    return i
  }else {
    return o__19147
  }
};
subpar.paredit.forward_delete_action = function forward_delete_action(s, i) {
  var p__19153 = subpar.paredit.parse.call(null, s);
  var h__19154 = i - 1;
  var j__19155 = i + 1;
  var c__19156 = cljs.core.nth.call(null, s, i, null);
  if(i >= cljs.core.count.call(null, s)) {
    return 0
  }else {
    if(cljs.core.truth_(subpar.paredit.escaped_QMARK_.call(null, s, i))) {
      return 2
    }else {
      if(cljs.core.truth_(subpar.paredit.escaped_QMARK_.call(null, s, j__19155))) {
        return 3
      }else {
        if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([h__19154, i], true), subpar.paredit.get_wrapper.call(null, p__19153, i))) {
          return 2
        }else {
          if(cljs.core.truth_(subpar.paredit.closes_list_QMARK_.call(null, p__19153, i))) {
            return 0
          }else {
            if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([i, j__19155], true), subpar.paredit.get_wrapper.call(null, p__19153, j__19155))) {
              return 3
            }else {
              if(cljs.core.truth_(subpar.paredit.opens_list_QMARK_.call(null, p__19153, i))) {
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
subpar.paredit.backward_delete_action = function backward_delete_action(s, i) {
  var p__19160 = subpar.paredit.parse.call(null, s);
  var g__19161 = i - 2;
  var h__19162 = i - 1;
  if(i <= 0) {
    return 0
  }else {
    if(cljs.core.truth_(subpar.paredit.escaped_QMARK_.call(null, s, h__19162))) {
      return 3
    }else {
      if(cljs.core.truth_(subpar.paredit.escaped_QMARK_.call(null, s, i))) {
        return 2
      }else {
        if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([g__19161, h__19162], true), subpar.paredit.get_wrapper.call(null, p__19160, h__19162))) {
          return 3
        }else {
          if(cljs.core.truth_(subpar.paredit.closes_list_QMARK_.call(null, p__19160, h__19162))) {
            return 4
          }else {
            if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([h__19162, i], true), subpar.paredit.get_wrapper.call(null, p__19160, i))) {
              return 2
            }else {
              if(cljs.core.truth_(subpar.paredit.opens_list_QMARK_.call(null, p__19160, h__19162))) {
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
subpar.paredit.double_quote_action = function double_quote_action(s, i) {
  var p__19164 = subpar.paredit.parse.call(null, s);
  if(i < 0) {
    return 0
  }else {
    if(i >= cljs.core.count.call(null, s)) {
      return 0
    }else {
      if(cljs.core.truth_(subpar.paredit.in_comment_QMARK_.call(null, p__19164, i))) {
        return 3
      }else {
        if(cljs.core.truth_(subpar.paredit.n_str_QMARK_.call(null, p__19164, i))) {
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
subpar.paredit.close_expression_vals = function close_expression_vals(p, i) {
  var vec__19174__19175 = subpar.paredit.get_wrapper.call(null, p, i);
  var o__19176 = cljs.core.nth.call(null, vec__19174__19175, 0, null);
  var c__19177 = cljs.core.nth.call(null, vec__19174__19175, 1, null);
  if(cljs.core._EQ_.call(null, -1, o__19176)) {
    return cljs.core.PersistentVector.EMPTY
  }else {
    var start__19179 = function() {
      var or__3824__auto____19178 = cljs.core.last.call(null, subpar.paredit.get_siblings.call(null, i, cljs.core.vals, cljs.core.identity, p));
      if(cljs.core.truth_(or__3824__auto____19178)) {
        return or__3824__auto____19178
      }else {
        return o__19176
      }
    }() + 1;
    var delete__19180 = cljs.core.not_EQ_.call(null, start__19179, c__19177);
    var dest__19181 = delete__19180 ? start__19179 + 1 : c__19177 + 1;
    return cljs.core.PersistentVector.fromArray([delete__19180, start__19179, c__19177, dest__19181], true)
  }
};
subpar.paredit.get_start_of_next_list = function get_start_of_next_list(s, i) {
  var p__19185 = subpar.paredit.parse.call(null, s);
  var r__19187 = cljs.core.first.call(null, subpar.paredit.get_siblings.call(null, i, cljs.core.keys, function(p1__19165_SHARP_) {
    var and__3822__auto____19186 = p1__19165_SHARP_ >= i;
    if(and__3822__auto____19186) {
      return cljs.core.get_in.call(null, p__19185, cljs.core.PersistentVector.fromArray(["\ufdd0'families", p1__19165_SHARP_], true))
    }else {
      return and__3822__auto____19186
    }
  }, p__19185));
  if(r__19187 == null) {
    return false
  }else {
    return r__19187
  }
};
subpar.paredit.forward_down_fn = function forward_down_fn(s, i) {
  var r__19190 = subpar.paredit.get_start_of_next_list.call(null, s, i);
  if(cljs.core.truth_(r__19190)) {
    return r__19190 + 1
  }else {
    return i
  }
};
subpar.paredit.backward_fn = function backward_fn(s, i) {
  var p__19196 = subpar.paredit.parse.call(null, s);
  var b__19197 = cljs.core.last.call(null, subpar.paredit.get_siblings.call(null, i, cljs.core.keys, function(p1__19188_SHARP_) {
    return p1__19188_SHARP_ < i
  }, p__19196));
  var o__19198 = subpar.paredit.get_opening_delimiter_index_with_parse.call(null, p__19196, i);
  var or__3824__auto____19199 = b__19197;
  if(cljs.core.truth_(or__3824__auto____19199)) {
    return or__3824__auto____19199
  }else {
    if(o__19198 < 0) {
      return 0
    }else {
      return o__19198
    }
  }
};
subpar.paredit.backward_down_fn = function backward_down_fn(s, i) {
  var p__19204 = subpar.paredit.parse.call(null, s);
  var b__19206 = cljs.core.last.call(null, subpar.paredit.get_siblings.call(null, i, cljs.core.vals, function(p1__19191_SHARP_) {
    var and__3822__auto____19205 = p1__19191_SHARP_ < i;
    if(and__3822__auto____19205) {
      return subpar.paredit.closes_list_QMARK_.call(null, p__19204, p1__19191_SHARP_)
    }else {
      return and__3822__auto____19205
    }
  }, p__19204));
  var or__3824__auto____19207 = b__19206;
  if(cljs.core.truth_(or__3824__auto____19207)) {
    return or__3824__auto____19207
  }else {
    return i
  }
};
subpar.paredit.forward_up_fn = function forward_up_fn(s, i) {
  var p__19216 = subpar.paredit.parse.call(null, s);
  var vec__19215__19217 = subpar.paredit.get_wrapper.call(null, p__19216, i);
  var o__19218 = cljs.core.nth.call(null, vec__19215__19217, 0, null);
  var c__19219 = cljs.core.nth.call(null, vec__19215__19217, 1, null);
  var in_list__19220 = cljs.core.not_EQ_.call(null, -1, o__19218);
  if(in_list__19220) {
    return c__19219 + 1
  }else {
    return i
  }
};
subpar.paredit.forward_fn = function forward_fn(s, i) {
  var p__19226 = subpar.paredit.parse.call(null, s);
  var b__19227 = cljs.core.first.call(null, subpar.paredit.get_siblings.call(null, i, cljs.core.vals, function(p1__19208_SHARP_) {
    return p1__19208_SHARP_ >= i
  }, p__19226));
  var c__19228 = subpar.paredit.get_closing_delimiter_index_with_parse.call(null, p__19226, i);
  var l__19229 = cljs.core.count.call(null, s);
  if(cljs.core.truth_(b__19227)) {
    return b__19227 + 1
  }else {
    if(cljs.core.truth_(c__19228)) {
      return c__19228 + 1 < l__19229 ? c__19228 + 1 : l__19229
    }else {
      if(true) {
        return l__19229
      }else {
        return null
      }
    }
  }
};
subpar.paredit.forward_slurp_vals = function forward_slurp_vals(s, i) {
  var p__19244 = subpar.paredit.parse.call(null, s);
  var vec__19243__19245 = subpar.paredit.get_wrapper.call(null, p__19244, i);
  var o__19246 = cljs.core.nth.call(null, vec__19243__19245, 0, null);
  var c__19247 = cljs.core.nth.call(null, vec__19243__19245, 1, null);
  var in_list__19248 = cljs.core.not_EQ_.call(null, -1, o__19246);
  var a__19250 = function() {
    var and__3822__auto____19249 = in_list__19248;
    if(and__3822__auto____19249) {
      return cljs.core.nth.call(null, s, c__19247, false)
    }else {
      return and__3822__auto____19249
    }
  }();
  var d__19252 = function() {
    var and__3822__auto____19251 = in_list__19248;
    if(and__3822__auto____19251) {
      return cljs.core.first.call(null, subpar.paredit.get_siblings.call(null, o__19246, cljs.core.vals, function(p1__19221_SHARP_) {
        return p1__19221_SHARP_ > c__19247
      }, p__19244))
    }else {
      return and__3822__auto____19251
    }
  }();
  if(cljs.core.truth_(function() {
    var and__3822__auto____19253 = a__19250;
    if(cljs.core.truth_(and__3822__auto____19253)) {
      var and__3822__auto____19254 = c__19247;
      if(cljs.core.truth_(and__3822__auto____19254)) {
        return d__19252
      }else {
        return and__3822__auto____19254
      }
    }else {
      return and__3822__auto____19253
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([a__19250, c__19247, d__19252 + 1, subpar.paredit.count_lines.call(null, s, o__19246, d__19252 + 1)], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
subpar.paredit.backward_slurp_vals = function backward_slurp_vals(s, i) {
  var p__19267 = subpar.paredit.parse.call(null, s);
  var vec__19266__19268 = subpar.paredit.get_wrapper.call(null, p__19267, i);
  var o__19269 = cljs.core.nth.call(null, vec__19266__19268, 0, null);
  var c__19270 = cljs.core.nth.call(null, vec__19266__19268, 1, null);
  var in_list__19271 = cljs.core.not_EQ_.call(null, -1, o__19269);
  var d__19273 = function() {
    var and__3822__auto____19272 = in_list__19271;
    if(and__3822__auto____19272) {
      return cljs.core.last.call(null, subpar.paredit.get_siblings.call(null, o__19269, cljs.core.keys, function(p1__19230_SHARP_) {
        return p1__19230_SHARP_ < o__19269
      }, p__19267))
    }else {
      return and__3822__auto____19272
    }
  }();
  var a__19275 = function() {
    var and__3822__auto____19274 = in_list__19271;
    if(and__3822__auto____19274) {
      return cljs.core.nth.call(null, s, o__19269, false)
    }else {
      return and__3822__auto____19274
    }
  }();
  if(cljs.core.truth_(function() {
    var and__3822__auto____19276 = a__19275;
    if(cljs.core.truth_(and__3822__auto____19276)) {
      return d__19273
    }else {
      return and__3822__auto____19276
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([a__19275, o__19269, d__19273, subpar.paredit.count_lines.call(null, s, d__19273, c__19270)], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
subpar.paredit.forward_barf_vals = function forward_barf_vals(s, i) {
  var p__19292 = subpar.paredit.parse.call(null, s);
  var vec__19291__19293 = subpar.paredit.get_wrapper.call(null, p__19292, i);
  var o__19294 = cljs.core.nth.call(null, vec__19291__19293, 0, null);
  var c__19295 = cljs.core.nth.call(null, vec__19291__19293, 1, null);
  var in_list__19296 = cljs.core.not_EQ_.call(null, -1, o__19294);
  var endings__19298 = function() {
    var and__3822__auto____19297 = in_list__19296;
    if(and__3822__auto____19297) {
      return subpar.paredit.get_siblings.call(null, i, cljs.core.vals, cljs.core.constantly.call(null, true), p__19292)
    }else {
      return and__3822__auto____19297
    }
  }();
  var a__19301 = function() {
    var and__3822__auto____19299 = c__19295;
    if(cljs.core.truth_(and__3822__auto____19299)) {
      var and__3822__auto____19300 = in_list__19296;
      if(and__3822__auto____19300) {
        return cljs.core.nth.call(null, s, c__19295, null)
      }else {
        return and__3822__auto____19300
      }
    }else {
      return and__3822__auto____19299
    }
  }();
  var r__19303 = function() {
    var or__3824__auto____19302 = subpar.paredit.count_lines.call(null, s, o__19294, c__19295);
    if(cljs.core.truth_(or__3824__auto____19302)) {
      return or__3824__auto____19302
    }else {
      return 1
    }
  }();
  var num__19304 = cljs.core.truth_(endings__19298) ? cljs.core.count.call(null, endings__19298) : 0;
  if(num__19304 > 1) {
    return cljs.core.PersistentVector.fromArray([a__19301, c__19295, cljs.core.nth.call(null, endings__19298, num__19304 - 2) + 1, false, r__19303, o__19294], true)
  }else {
    if(cljs.core._EQ_.call(null, num__19304, 1)) {
      return cljs.core.PersistentVector.fromArray([a__19301, c__19295, o__19294 + 1, true, r__19303, o__19294], true)
    }else {
      if(true) {
        return cljs.core.PersistentVector.EMPTY
      }else {
        return null
      }
    }
  }
};
subpar.paredit.backward_barf_vals = function backward_barf_vals(s, i) {
  var p__19320 = subpar.paredit.parse.call(null, s);
  var vec__19319__19321 = subpar.paredit.get_wrapper.call(null, p__19320, i);
  var o__19322 = cljs.core.nth.call(null, vec__19319__19321, 0, null);
  var c__19323 = cljs.core.nth.call(null, vec__19319__19321, 1, null);
  var in_list__19324 = cljs.core.not_EQ_.call(null, -1, o__19322);
  var starts__19326 = function() {
    var and__3822__auto____19325 = in_list__19324;
    if(and__3822__auto____19325) {
      return subpar.paredit.get_siblings.call(null, i, cljs.core.keys, cljs.core.constantly.call(null, true), p__19320)
    }else {
      return and__3822__auto____19325
    }
  }();
  var a__19329 = function() {
    var and__3822__auto____19327 = o__19322;
    if(cljs.core.truth_(and__3822__auto____19327)) {
      var and__3822__auto____19328 = in_list__19324;
      if(and__3822__auto____19328) {
        return cljs.core.nth.call(null, s, o__19322, null)
      }else {
        return and__3822__auto____19328
      }
    }else {
      return and__3822__auto____19327
    }
  }();
  var r__19331 = function() {
    var or__3824__auto____19330 = subpar.paredit.count_lines.call(null, s, o__19322, c__19323);
    if(cljs.core.truth_(or__3824__auto____19330)) {
      return or__3824__auto____19330
    }else {
      return 1
    }
  }();
  var num__19332 = cljs.core.truth_(starts__19326) ? cljs.core.count.call(null, starts__19326) : 0;
  if(num__19332 > 1) {
    return cljs.core.PersistentVector.fromArray([a__19329, o__19322, cljs.core.second.call(null, starts__19326), false, r__19331], true)
  }else {
    if(cljs.core._EQ_.call(null, num__19332, 1)) {
      return cljs.core.PersistentVector.fromArray([a__19329, o__19322, c__19323, true, r__19331], true)
    }else {
      if(true) {
        return cljs.core.PersistentVector.EMPTY
      }else {
        return null
      }
    }
  }
};
subpar.paredit.splice_vals = function splice_vals(s, i) {
  var p__19345 = subpar.paredit.parse.call(null, s);
  var vec__19344__19346 = subpar.paredit.get_wrapper.call(null, p__19345, i);
  var o__19347 = cljs.core.nth.call(null, vec__19344__19346, 0, null);
  var c__19348 = cljs.core.nth.call(null, vec__19344__19346, 1, null);
  var in_list__19349 = cljs.core.not_EQ_.call(null, -1, o__19347);
  if(in_list__19349) {
    var vec__19350__19351 = subpar.paredit.get_wrapper.call(null, p__19345, o__19347);
    var n__19352 = cljs.core.nth.call(null, vec__19350__19351, 0, null);
    var d__19353 = cljs.core.nth.call(null, vec__19350__19351, 1, null);
    var r__19354 = subpar.paredit.count_lines.call(null, s, n__19352, d__19353);
    return cljs.core.PersistentVector.fromArray([o__19347, c__19348, 0 > n__19352 ? 0 : n__19352, r__19354], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
subpar.paredit.splice_delete_backward_vals = function splice_delete_backward_vals(s, i) {
  var p__19367 = subpar.paredit.parse.call(null, s);
  var vec__19366__19368 = subpar.paredit.get_wrapper.call(null, p__19367, i);
  var o__19369 = cljs.core.nth.call(null, vec__19366__19368, 0, null);
  var c__19370 = cljs.core.nth.call(null, vec__19366__19368, 1, null);
  var in_list__19371 = cljs.core.not_EQ_.call(null, -1, o__19369);
  if(in_list__19371) {
    var vec__19372__19373 = subpar.paredit.get_wrapper.call(null, p__19367, o__19369);
    var n__19374 = cljs.core.nth.call(null, vec__19372__19373, 0, null);
    var d__19375 = cljs.core.nth.call(null, vec__19372__19373, 1, null);
    var r__19376 = subpar.paredit.count_lines.call(null, s, n__19374, d__19375);
    return cljs.core.PersistentVector.fromArray([o__19369, o__19369 > i ? o__19369 : i, c__19370, 0 > n__19374 ? 0 : n__19374, r__19376], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
subpar.paredit.splice_delete_forward_vals = function splice_delete_forward_vals(s, i) {
  var p__19389 = subpar.paredit.parse.call(null, s);
  var vec__19388__19390 = subpar.paredit.get_wrapper.call(null, p__19389, i);
  var o__19391 = cljs.core.nth.call(null, vec__19388__19390, 0, null);
  var c__19392 = cljs.core.nth.call(null, vec__19388__19390, 1, null);
  var in_list__19393 = cljs.core.not_EQ_.call(null, -1, o__19391);
  if(in_list__19393) {
    var vec__19394__19395 = subpar.paredit.get_wrapper.call(null, p__19389, o__19391);
    var n__19396 = cljs.core.nth.call(null, vec__19394__19395, 0, null);
    var d__19397 = cljs.core.nth.call(null, vec__19394__19395, 1, null);
    var r__19398 = subpar.paredit.count_lines.call(null, s, n__19396, d__19397);
    return cljs.core.PersistentVector.fromArray([o__19391, i, c__19392 + 1, 0 > n__19396 ? 0 : n__19396, r__19398], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
subpar.paredit.parse = function parse(ss) {
  var s__19437 = [cljs.core.str(ss), cljs.core.str(" ")].join("");
  var i__19438 = 0;
  var mode__19439 = subpar.paredit.code;
  var openings__19440 = cljs.core.list.call(null, -1);
  var start__19441 = -1;
  var t__19442 = cljs.core.PersistentVector.EMPTY;
  var families__19443 = cljs.core.PersistentArrayMap.fromArrays([-1], [cljs.core.ObjMap.fromObject(["\ufdd0'children"], {"\ufdd0'children":cljs.core.ObjMap.EMPTY})]);
  var escaping__19444 = false;
  var in_word__19445 = false;
  while(true) {
    var a__19446 = cljs.core.nth.call(null, s__19437, i__19438, null);
    var j__19447 = i__19438 + 1;
    var o__19448 = cljs.core.peek.call(null, openings__19440);
    if(cljs.core.truth_(function() {
      var and__3822__auto____19449 = a__19446 == null;
      if(and__3822__auto____19449) {
        return in_word__19445
      }else {
        return and__3822__auto____19449
      }
    }())) {
      return cljs.core.ObjMap.fromObject(["\ufdd0'chars", "\ufdd0'families"], {"\ufdd0'chars":t__19442, "\ufdd0'families":cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([-1, "\ufdd0'closer"], true), i__19438 - 1), cljs.core.PersistentVector.fromArray([-1, "\ufdd0'children", start__19441], true), i__19438 - 1)})
    }else {
      if(a__19446 == null) {
        return cljs.core.ObjMap.fromObject(["\ufdd0'chars", "\ufdd0'families"], {"\ufdd0'chars":t__19442, "\ufdd0'families":cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([-1, "\ufdd0'closer"], true), i__19438 - 1)})
      }else {
        if(function() {
          var and__3822__auto____19450 = cljs.core.not_EQ_.call(null, subpar.paredit.cmmnt, mode__19439);
          if(and__3822__auto____19450) {
            var and__3822__auto____19451 = cljs.core._EQ_.call(null, "\\", a__19446);
            if(and__3822__auto____19451) {
              var and__3822__auto____19452 = cljs.core.not.call(null, escaping__19444);
              if(and__3822__auto____19452) {
                return cljs.core.not.call(null, in_word__19445)
              }else {
                return and__3822__auto____19452
              }
            }else {
              return and__3822__auto____19451
            }
          }else {
            return and__3822__auto____19450
          }
        }()) {
          var G__19475 = j__19447;
          var G__19476 = mode__19439;
          var G__19477 = openings__19440;
          var G__19478 = i__19438;
          var G__19479 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
          var G__19480 = cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'children", i__19438], true), j__19447);
          var G__19481 = true;
          var G__19482 = true;
          i__19438 = G__19475;
          mode__19439 = G__19476;
          openings__19440 = G__19477;
          start__19441 = G__19478;
          t__19442 = G__19479;
          families__19443 = G__19480;
          escaping__19444 = G__19481;
          in_word__19445 = G__19482;
          continue
        }else {
          if(function() {
            var and__3822__auto____19453 = cljs.core.not_EQ_.call(null, subpar.paredit.cmmnt, mode__19439);
            if(and__3822__auto____19453) {
              var and__3822__auto____19454 = cljs.core._EQ_.call(null, "\\", a__19446);
              if(and__3822__auto____19454) {
                return cljs.core.not.call(null, escaping__19444)
              }else {
                return and__3822__auto____19454
              }
            }else {
              return and__3822__auto____19453
            }
          }()) {
            var G__19483 = j__19447;
            var G__19484 = mode__19439;
            var G__19485 = openings__19440;
            var G__19486 = i__19438;
            var G__19487 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
            var G__19488 = families__19443;
            var G__19489 = true;
            var G__19490 = true;
            i__19438 = G__19483;
            mode__19439 = G__19484;
            openings__19440 = G__19485;
            start__19441 = G__19486;
            t__19442 = G__19487;
            families__19443 = G__19488;
            escaping__19444 = G__19489;
            in_word__19445 = G__19490;
            continue
          }else {
            if(function() {
              var and__3822__auto____19455 = cljs.core._EQ_.call(null, subpar.paredit.code, mode__19439);
              if(and__3822__auto____19455) {
                var and__3822__auto____19456 = cljs.core._EQ_.call(null, ";", a__19446);
                if(and__3822__auto____19456) {
                  return cljs.core.not.call(null, escaping__19444)
                }else {
                  return and__3822__auto____19456
                }
              }else {
                return and__3822__auto____19455
              }
            }()) {
              var G__19491 = j__19447;
              var G__19492 = subpar.paredit.cmmnt;
              var G__19493 = openings__19440;
              var G__19494 = start__19441;
              var G__19495 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
              var G__19496 = families__19443;
              var G__19497 = false;
              var G__19498 = false;
              i__19438 = G__19491;
              mode__19439 = G__19492;
              openings__19440 = G__19493;
              start__19441 = G__19494;
              t__19442 = G__19495;
              families__19443 = G__19496;
              escaping__19444 = G__19497;
              in_word__19445 = G__19498;
              continue
            }else {
              if(function() {
                var and__3822__auto____19457 = cljs.core._EQ_.call(null, subpar.paredit.cmmnt, mode__19439);
                if(and__3822__auto____19457) {
                  return cljs.core._EQ_.call(null, "\n", a__19446)
                }else {
                  return and__3822__auto____19457
                }
              }()) {
                var G__19499 = j__19447;
                var G__19500 = subpar.paredit.code;
                var G__19501 = openings__19440;
                var G__19502 = start__19441;
                var G__19503 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                var G__19504 = families__19443;
                var G__19505 = false;
                var G__19506 = false;
                i__19438 = G__19499;
                mode__19439 = G__19500;
                openings__19440 = G__19501;
                start__19441 = G__19502;
                t__19442 = G__19503;
                families__19443 = G__19504;
                escaping__19444 = G__19505;
                in_word__19445 = G__19506;
                continue
              }else {
                if(cljs.core._EQ_.call(null, subpar.paredit.cmmnt, mode__19439)) {
                  var G__19507 = j__19447;
                  var G__19508 = subpar.paredit.cmmnt;
                  var G__19509 = openings__19440;
                  var G__19510 = start__19441;
                  var G__19511 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                  var G__19512 = families__19443;
                  var G__19513 = false;
                  var G__19514 = false;
                  i__19438 = G__19507;
                  mode__19439 = G__19508;
                  openings__19440 = G__19509;
                  start__19441 = G__19510;
                  t__19442 = G__19511;
                  families__19443 = G__19512;
                  escaping__19444 = G__19513;
                  in_word__19445 = G__19514;
                  continue
                }else {
                  if(function() {
                    var and__3822__auto____19458 = cljs.core._EQ_.call(null, subpar.paredit.code, mode__19439);
                    if(and__3822__auto____19458) {
                      var and__3822__auto____19459 = cljs.core._EQ_.call(null, '"', a__19446);
                      if(and__3822__auto____19459) {
                        return cljs.core.not.call(null, escaping__19444)
                      }else {
                        return and__3822__auto____19459
                      }
                    }else {
                      return and__3822__auto____19458
                    }
                  }()) {
                    var G__19515 = j__19447;
                    var G__19516 = subpar.paredit.string;
                    var G__19517 = cljs.core.conj.call(null, openings__19440, i__19438);
                    var G__19518 = -1;
                    var G__19519 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                    var G__19520 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([i__19438, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY), cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'children", i__19438], true), j__19447);
                    var G__19521 = false;
                    var G__19522 = false;
                    i__19438 = G__19515;
                    mode__19439 = G__19516;
                    openings__19440 = G__19517;
                    start__19441 = G__19518;
                    t__19442 = G__19519;
                    families__19443 = G__19520;
                    escaping__19444 = G__19521;
                    in_word__19445 = G__19522;
                    continue
                  }else {
                    if(cljs.core.truth_(function() {
                      var and__3822__auto____19460 = cljs.core._EQ_.call(null, subpar.paredit.string, mode__19439);
                      if(and__3822__auto____19460) {
                        var and__3822__auto____19461 = cljs.core._EQ_.call(null, '"', a__19446);
                        if(and__3822__auto____19461) {
                          var and__3822__auto____19462 = cljs.core.not.call(null, escaping__19444);
                          if(and__3822__auto____19462) {
                            return in_word__19445
                          }else {
                            return and__3822__auto____19462
                          }
                        }else {
                          return and__3822__auto____19461
                        }
                      }else {
                        return and__3822__auto____19460
                      }
                    }())) {
                      var G__19523 = j__19447;
                      var G__19524 = subpar.paredit.code;
                      var G__19525 = cljs.core.pop.call(null, openings__19440);
                      var G__19526 = -1;
                      var G__19527 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                      var G__19528 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'closer"], true), i__19438), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__19440), "\ufdd0'children", o__19448], true), i__19438), cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'children", start__19441], true), i__19438 - 1);
                      var G__19529 = false;
                      var G__19530 = false;
                      i__19438 = G__19523;
                      mode__19439 = G__19524;
                      openings__19440 = G__19525;
                      start__19441 = G__19526;
                      t__19442 = G__19527;
                      families__19443 = G__19528;
                      escaping__19444 = G__19529;
                      in_word__19445 = G__19530;
                      continue
                    }else {
                      if(function() {
                        var and__3822__auto____19463 = cljs.core._EQ_.call(null, subpar.paredit.string, mode__19439);
                        if(and__3822__auto____19463) {
                          var and__3822__auto____19464 = cljs.core._EQ_.call(null, '"', a__19446);
                          if(and__3822__auto____19464) {
                            return cljs.core.not.call(null, escaping__19444)
                          }else {
                            return and__3822__auto____19464
                          }
                        }else {
                          return and__3822__auto____19463
                        }
                      }()) {
                        var G__19531 = j__19447;
                        var G__19532 = subpar.paredit.code;
                        var G__19533 = cljs.core.pop.call(null, openings__19440);
                        var G__19534 = -1;
                        var G__19535 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                        var G__19536 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'closer"], true), i__19438), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__19440), "\ufdd0'children", o__19448], true), i__19438);
                        var G__19537 = false;
                        var G__19538 = false;
                        i__19438 = G__19531;
                        mode__19439 = G__19532;
                        openings__19440 = G__19533;
                        start__19441 = G__19534;
                        t__19442 = G__19535;
                        families__19443 = G__19536;
                        escaping__19444 = G__19537;
                        in_word__19445 = G__19538;
                        continue
                      }else {
                        if(function() {
                          var and__3822__auto____19465 = cljs.core._EQ_.call(null, subpar.paredit.string, mode__19439);
                          if(and__3822__auto____19465) {
                            var and__3822__auto____19466 = cljs.core.not.call(null, subpar.paredit.whitespace_QMARK_.call(null, a__19446));
                            if(and__3822__auto____19466) {
                              return cljs.core.not.call(null, in_word__19445)
                            }else {
                              return and__3822__auto____19466
                            }
                          }else {
                            return and__3822__auto____19465
                          }
                        }()) {
                          var G__19539 = j__19447;
                          var G__19540 = subpar.paredit.string;
                          var G__19541 = openings__19440;
                          var G__19542 = i__19438;
                          var G__19543 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                          var G__19544 = cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'children", i__19438], true), i__19438);
                          var G__19545 = false;
                          var G__19546 = true;
                          i__19438 = G__19539;
                          mode__19439 = G__19540;
                          openings__19440 = G__19541;
                          start__19441 = G__19542;
                          t__19442 = G__19543;
                          families__19443 = G__19544;
                          escaping__19444 = G__19545;
                          in_word__19445 = G__19546;
                          continue
                        }else {
                          if(cljs.core.truth_(function() {
                            var and__3822__auto____19467 = cljs.core._EQ_.call(null, subpar.paredit.string, mode__19439);
                            if(and__3822__auto____19467) {
                              var and__3822__auto____19468 = subpar.paredit.whitespace_QMARK_.call(null, a__19446);
                              if(cljs.core.truth_(and__3822__auto____19468)) {
                                return in_word__19445
                              }else {
                                return and__3822__auto____19468
                              }
                            }else {
                              return and__3822__auto____19467
                            }
                          }())) {
                            var G__19547 = j__19447;
                            var G__19548 = subpar.paredit.string;
                            var G__19549 = openings__19440;
                            var G__19550 = -1;
                            var G__19551 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                            var G__19552 = cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'children", start__19441], true), i__19438 - 1);
                            var G__19553 = false;
                            var G__19554 = false;
                            i__19438 = G__19547;
                            mode__19439 = G__19548;
                            openings__19440 = G__19549;
                            start__19441 = G__19550;
                            t__19442 = G__19551;
                            families__19443 = G__19552;
                            escaping__19444 = G__19553;
                            in_word__19445 = G__19554;
                            continue
                          }else {
                            if(cljs.core._EQ_.call(null, subpar.paredit.string, mode__19439)) {
                              var G__19555 = j__19447;
                              var G__19556 = subpar.paredit.string;
                              var G__19557 = openings__19440;
                              var G__19558 = start__19441;
                              var G__19559 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                              var G__19560 = families__19443;
                              var G__19561 = false;
                              var G__19562 = in_word__19445;
                              i__19438 = G__19555;
                              mode__19439 = G__19556;
                              openings__19440 = G__19557;
                              start__19441 = G__19558;
                              t__19442 = G__19559;
                              families__19443 = G__19560;
                              escaping__19444 = G__19561;
                              in_word__19445 = G__19562;
                              continue
                            }else {
                              if(cljs.core.truth_(function() {
                                var and__3822__auto____19469 = subpar.paredit.opener_QMARK_.call(null, a__19446);
                                if(cljs.core.truth_(and__3822__auto____19469)) {
                                  return in_word__19445
                                }else {
                                  return and__3822__auto____19469
                                }
                              }())) {
                                var G__19563 = j__19447;
                                var G__19564 = subpar.paredit.code;
                                var G__19565 = cljs.core.conj.call(null, openings__19440, i__19438);
                                var G__19566 = -1;
                                var G__19567 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                                var G__19568 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'children", start__19441], true), i__19438 - 1), cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'children", i__19438], true), i__19438), cljs.core.PersistentVector.fromArray([i__19438, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY);
                                var G__19569 = false;
                                var G__19570 = false;
                                i__19438 = G__19563;
                                mode__19439 = G__19564;
                                openings__19440 = G__19565;
                                start__19441 = G__19566;
                                t__19442 = G__19567;
                                families__19443 = G__19568;
                                escaping__19444 = G__19569;
                                in_word__19445 = G__19570;
                                continue
                              }else {
                                if(cljs.core.truth_(subpar.paredit.opener_QMARK_.call(null, a__19446))) {
                                  var G__19571 = j__19447;
                                  var G__19572 = subpar.paredit.code;
                                  var G__19573 = cljs.core.conj.call(null, openings__19440, i__19438);
                                  var G__19574 = -1;
                                  var G__19575 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                                  var G__19576 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'children", i__19438], true), i__19438), cljs.core.PersistentVector.fromArray([i__19438, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY);
                                  var G__19577 = false;
                                  var G__19578 = false;
                                  i__19438 = G__19571;
                                  mode__19439 = G__19572;
                                  openings__19440 = G__19573;
                                  start__19441 = G__19574;
                                  t__19442 = G__19575;
                                  families__19443 = G__19576;
                                  escaping__19444 = G__19577;
                                  in_word__19445 = G__19578;
                                  continue
                                }else {
                                  if(cljs.core.truth_(function() {
                                    var and__3822__auto____19470 = subpar.paredit.closer_QMARK_.call(null, a__19446);
                                    if(cljs.core.truth_(and__3822__auto____19470)) {
                                      return in_word__19445
                                    }else {
                                      return and__3822__auto____19470
                                    }
                                  }())) {
                                    var G__19579 = j__19447;
                                    var G__19580 = subpar.paredit.code;
                                    var G__19581 = cljs.core.pop.call(null, openings__19440);
                                    var G__19582 = -1;
                                    var G__19583 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                                    var G__19584 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'children", start__19441], true), i__19438 - 1), cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'closer"], true), i__19438), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__19440), "\ufdd0'children", o__19448], true), i__19438);
                                    var G__19585 = false;
                                    var G__19586 = false;
                                    i__19438 = G__19579;
                                    mode__19439 = G__19580;
                                    openings__19440 = G__19581;
                                    start__19441 = G__19582;
                                    t__19442 = G__19583;
                                    families__19443 = G__19584;
                                    escaping__19444 = G__19585;
                                    in_word__19445 = G__19586;
                                    continue
                                  }else {
                                    if(cljs.core.truth_(subpar.paredit.closer_QMARK_.call(null, a__19446))) {
                                      var G__19587 = j__19447;
                                      var G__19588 = subpar.paredit.code;
                                      var G__19589 = cljs.core.pop.call(null, openings__19440);
                                      var G__19590 = -1;
                                      var G__19591 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                                      var G__19592 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'closer"], true), i__19438), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__19440), "\ufdd0'children", o__19448], true), i__19438);
                                      var G__19593 = false;
                                      var G__19594 = false;
                                      i__19438 = G__19587;
                                      mode__19439 = G__19588;
                                      openings__19440 = G__19589;
                                      start__19441 = G__19590;
                                      t__19442 = G__19591;
                                      families__19443 = G__19592;
                                      escaping__19444 = G__19593;
                                      in_word__19445 = G__19594;
                                      continue
                                    }else {
                                      if(function() {
                                        var and__3822__auto____19471 = cljs.core.not.call(null, subpar.paredit.whitespace_QMARK_.call(null, a__19446));
                                        if(and__3822__auto____19471) {
                                          return cljs.core.not.call(null, in_word__19445)
                                        }else {
                                          return and__3822__auto____19471
                                        }
                                      }()) {
                                        var G__19595 = j__19447;
                                        var G__19596 = subpar.paredit.code;
                                        var G__19597 = openings__19440;
                                        var G__19598 = i__19438;
                                        var G__19599 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                                        var G__19600 = cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'children", i__19438], true), i__19438);
                                        var G__19601 = false;
                                        var G__19602 = true;
                                        i__19438 = G__19595;
                                        mode__19439 = G__19596;
                                        openings__19440 = G__19597;
                                        start__19441 = G__19598;
                                        t__19442 = G__19599;
                                        families__19443 = G__19600;
                                        escaping__19444 = G__19601;
                                        in_word__19445 = G__19602;
                                        continue
                                      }else {
                                        if(cljs.core.truth_(function() {
                                          var and__3822__auto____19472 = subpar.paredit.whitespace_QMARK_.call(null, a__19446);
                                          if(cljs.core.truth_(and__3822__auto____19472)) {
                                            return in_word__19445
                                          }else {
                                            return and__3822__auto____19472
                                          }
                                        }())) {
                                          var G__19603 = j__19447;
                                          var G__19604 = subpar.paredit.code;
                                          var G__19605 = openings__19440;
                                          var G__19606 = -1;
                                          var G__19607 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                                          var G__19608 = cljs.core.assoc_in.call(null, families__19443, cljs.core.PersistentVector.fromArray([o__19448, "\ufdd0'children", start__19441], true), i__19438 - 1);
                                          var G__19609 = false;
                                          var G__19610 = false;
                                          i__19438 = G__19603;
                                          mode__19439 = G__19604;
                                          openings__19440 = G__19605;
                                          start__19441 = G__19606;
                                          t__19442 = G__19607;
                                          families__19443 = G__19608;
                                          escaping__19444 = G__19609;
                                          in_word__19445 = G__19610;
                                          continue
                                        }else {
                                          if(cljs.core.truth_(function() {
                                            var and__3822__auto____19473 = subpar.paredit.whitespace_QMARK_.call(null, a__19446);
                                            if(cljs.core.truth_(and__3822__auto____19473)) {
                                              return cljs.core.not.call(null, in_word__19445)
                                            }else {
                                              return and__3822__auto____19473
                                            }
                                          }())) {
                                            var G__19611 = j__19447;
                                            var G__19612 = subpar.paredit.code;
                                            var G__19613 = openings__19440;
                                            var G__19614 = -1;
                                            var G__19615 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                                            var G__19616 = families__19443;
                                            var G__19617 = false;
                                            var G__19618 = false;
                                            i__19438 = G__19611;
                                            mode__19439 = G__19612;
                                            openings__19440 = G__19613;
                                            start__19441 = G__19614;
                                            t__19442 = G__19615;
                                            families__19443 = G__19616;
                                            escaping__19444 = G__19617;
                                            in_word__19445 = G__19618;
                                            continue
                                          }else {
                                            if(cljs.core.truth_(function() {
                                              var and__3822__auto____19474 = cljs.core.not.call(null, subpar.paredit.whitespace_QMARK_.call(null, a__19446));
                                              if(and__3822__auto____19474) {
                                                return in_word__19445
                                              }else {
                                                return and__3822__auto____19474
                                              }
                                            }())) {
                                              var G__19619 = j__19447;
                                              var G__19620 = subpar.paredit.code;
                                              var G__19621 = openings__19440;
                                              var G__19622 = start__19441;
                                              var G__19623 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray([mode__19439, o__19448], true));
                                              var G__19624 = families__19443;
                                              var G__19625 = false;
                                              var G__19626 = true;
                                              i__19438 = G__19619;
                                              mode__19439 = G__19620;
                                              openings__19440 = G__19621;
                                              start__19441 = G__19622;
                                              t__19442 = G__19623;
                                              families__19443 = G__19624;
                                              escaping__19444 = G__19625;
                                              in_word__19445 = G__19626;
                                              continue
                                            }else {
                                              if("\ufdd0'default") {
                                                var G__19627 = j__19447;
                                                var G__19628 = subpar.paredit.code;
                                                var G__19629 = openings__19440;
                                                var G__19630 = start__19441;
                                                var G__19631 = cljs.core.conj.call(null, t__19442, cljs.core.PersistentVector.fromArray(["?", o__19448], true));
                                                var G__19632 = families__19443;
                                                var G__19633 = escaping__19444;
                                                var G__19634 = in_word__19445;
                                                i__19438 = G__19627;
                                                mode__19439 = G__19628;
                                                openings__19440 = G__19629;
                                                start__19441 = G__19630;
                                                t__19442 = G__19631;
                                                families__19443 = G__19632;
                                                escaping__19444 = G__19633;
                                                in_word__19445 = G__19634;
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
goog.require("subpar.paredit");
goog.require("subpar.paredit");
subpar.test.tests.run = function run() {
  if(cljs.core._EQ_.call(null, 4, subpar.paredit.count_lines.call(null, "\n\n\n\n", 0, 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'count-lines", "\n\n\n\n", 0, 2), cljs.core.hash_map("\ufdd0'line", 22))), cljs.core.hash_map("\ufdd0'line", 22))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.count_lines.call(null, "0\n\n\n\n", 0, 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'count-lines", "0\n\n\n\n", 0, 2), cljs.core.hash_map("\ufdd0'line", 23))), cljs.core.hash_map("\ufdd0'line", 23))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.paredit.count_lines.call(null, "01\n\n\n\n", 0, 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'count-lines", "01\n\n\n\n", 0, 2), cljs.core.hash_map("\ufdd0'line", 24))), cljs.core.hash_map("\ufdd0'line", 24))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.count_lines.call(null, "012\n\n\n\n", 0, 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'count-lines", "012\n\n\n\n", 0, 2), cljs.core.hash_map("\ufdd0'line", 25))), cljs.core.hash_map("\ufdd0'line", 25))))].join(""));
  }
  if(cljs.core._EQ_.call(null, -1, subpar.paredit.get_opening_delimiter_index.call(null, " ()", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", -1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " ()", 0), cljs.core.hash_map("\ufdd0'line", 27))), cljs.core.hash_map("\ufdd0'line", 27))))].join(""));
  }
  if(cljs.core._EQ_.call(null, -1, subpar.paredit.get_opening_delimiter_index.call(null, " ()", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", -1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " ()", 1), cljs.core.hash_map("\ufdd0'line", 28))), cljs.core.hash_map("\ufdd0'line", 28))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.get_opening_delimiter_index.call(null, " ()", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " ()", 2), cljs.core.hash_map("\ufdd0'line", 29))), cljs.core.hash_map("\ufdd0'line", 29))))].join(""));
  }
  if(cljs.core._EQ_.call(null, -1, subpar.paredit.get_opening_delimiter_index.call(null, " ()", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", -1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " ()", 3), cljs.core.hash_map("\ufdd0'line", 30))), cljs.core.hash_map("\ufdd0'line", 30))))].join(""));
  }
  if(cljs.core._EQ_.call(null, -1, subpar.paredit.get_opening_delimiter_index.call(null, " () []", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", -1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " () []", 3), cljs.core.hash_map("\ufdd0'line", 31))), cljs.core.hash_map("\ufdd0'line", 31))))].join(""));
  }
  if(cljs.core._EQ_.call(null, -1, subpar.paredit.get_opening_delimiter_index.call(null, " () []", 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", -1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " () []", 4), cljs.core.hash_map("\ufdd0'line", 32))), cljs.core.hash_map("\ufdd0'line", 32))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.paredit.get_opening_delimiter_index.call(null, " () []", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " () []", 5), cljs.core.hash_map("\ufdd0'line", 33))), cljs.core.hash_map("\ufdd0'line", 33))))].join(""));
  }
  if(cljs.core._EQ_.call(null, -1, subpar.paredit.get_opening_delimiter_index.call(null, " () []", 6))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", -1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " () []", 6), cljs.core.hash_map("\ufdd0'line", 34))), cljs.core.hash_map("\ufdd0'line", 34))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.get_opening_delimiter_index.call(null, " ([a] )", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " ([a] )", 2), cljs.core.hash_map("\ufdd0'line", 35))), cljs.core.hash_map("\ufdd0'line", 35))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.paredit.get_opening_delimiter_index.call(null, " ([a] )", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " ([a] )", 3), cljs.core.hash_map("\ufdd0'line", 36))), cljs.core.hash_map("\ufdd0'line", 36))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.paredit.get_opening_delimiter_index.call(null, "([a]){b}", 6))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", "([a]){b}", 6), cljs.core.hash_map("\ufdd0'line", 37))), cljs.core.hash_map("\ufdd0'line", 37))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.get_opening_delimiter_index.call(null, " (;a\nb)", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-opening-delimiter-index", " (;a\nb)", 5), cljs.core.hash_map("\ufdd0'line", 38))), cljs.core.hash_map("\ufdd0'line", 38))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.get_closing_delimiter_index.call(null, " ()", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " ()", 0), cljs.core.hash_map("\ufdd0'line", 40))), cljs.core.hash_map("\ufdd0'line", 40))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.get_closing_delimiter_index.call(null, " ()", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " ()", 1), cljs.core.hash_map("\ufdd0'line", 41))), cljs.core.hash_map("\ufdd0'line", 41))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.paredit.get_closing_delimiter_index.call(null, " ()", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " ()", 2), cljs.core.hash_map("\ufdd0'line", 42))), cljs.core.hash_map("\ufdd0'line", 42))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.get_closing_delimiter_index.call(null, " ()", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " ()", 3), cljs.core.hash_map("\ufdd0'line", 43))), cljs.core.hash_map("\ufdd0'line", 43))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.paredit.get_closing_delimiter_index.call(null, " () []", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " () []", 3), cljs.core.hash_map("\ufdd0'line", 44))), cljs.core.hash_map("\ufdd0'line", 44))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.paredit.get_closing_delimiter_index.call(null, " () []", 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " () []", 4), cljs.core.hash_map("\ufdd0'line", 45))), cljs.core.hash_map("\ufdd0'line", 45))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.paredit.get_closing_delimiter_index.call(null, " () []", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " () []", 5), cljs.core.hash_map("\ufdd0'line", 46))), cljs.core.hash_map("\ufdd0'line", 46))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.paredit.get_closing_delimiter_index.call(null, " () []", 6))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " () []", 6), cljs.core.hash_map("\ufdd0'line", 47))), cljs.core.hash_map("\ufdd0'line", 47))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.paredit.get_closing_delimiter_index.call(null, " ([a] )", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " ([a] )", 2), cljs.core.hash_map("\ufdd0'line", 48))), cljs.core.hash_map("\ufdd0'line", 48))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.paredit.get_closing_delimiter_index.call(null, " ([a] )", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " ([a] )", 3), cljs.core.hash_map("\ufdd0'line", 49))), cljs.core.hash_map("\ufdd0'line", 49))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 7, subpar.paredit.get_closing_delimiter_index.call(null, "([a]){b}", 6))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 7, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", "([a]){b}", 6), cljs.core.hash_map("\ufdd0'line", 50))), cljs.core.hash_map("\ufdd0'line", 50))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 10, subpar.paredit.get_closing_delimiter_index.call(null, " (;a\nb () )", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 10, cljs.core.with_meta(cljs.core.list("\ufdd1'get-closing-delimiter-index", " (;a\nb () )", 5), cljs.core.hash_map("\ufdd0'line", 51))), cljs.core.hash_map("\ufdd0'line", 51))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.in_comment_QMARK_.call(null, subpar.paredit.parse.call(null, "a;b"), 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-comment?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b"), cljs.core.hash_map("\ufdd0'line", 53)), 0), cljs.core.hash_map("\ufdd0'line", 53))), cljs.core.hash_map("\ufdd0'line", 53))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.in_comment_QMARK_.call(null, subpar.paredit.parse.call(null, "a;b"), 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-comment?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b"), cljs.core.hash_map("\ufdd0'line", 54)), 1), cljs.core.hash_map("\ufdd0'line", 54))), cljs.core.hash_map("\ufdd0'line", 54))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.paredit.in_comment_QMARK_.call(null, subpar.paredit.parse.call(null, "a;b"), 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-comment?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b"), cljs.core.hash_map("\ufdd0'line", 55)), 2), cljs.core.hash_map("\ufdd0'line", 55))), cljs.core.hash_map("\ufdd0'line", 55))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.paredit.in_comment_QMARK_.call(null, subpar.paredit.parse.call(null, "a;b\nc"), 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-comment?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b\nc"), cljs.core.hash_map("\ufdd0'line", 56)), 3), cljs.core.hash_map("\ufdd0'line", 56))), cljs.core.hash_map("\ufdd0'line", 56))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.in_comment_QMARK_.call(null, subpar.paredit.parse.call(null, "a;b\nc"), 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-comment?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b\nc"), cljs.core.hash_map("\ufdd0'line", 57)), 4), cljs.core.hash_map("\ufdd0'line", 57))), cljs.core.hash_map("\ufdd0'line", 57))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.paredit.in_comment_QMARK_.call(null, subpar.paredit.parse.call(null, 'a;"b"'), 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-comment?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a;"b"'), cljs.core.hash_map("\ufdd0'line", 58)), 3), cljs.core.hash_map("\ufdd0'line", 58))), cljs.core.hash_map("\ufdd0'line", 58))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.paredit.in_code_QMARK_.call(null, subpar.paredit.parse.call(null, "a;b"), 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-code?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b"), cljs.core.hash_map("\ufdd0'line", 60)), 0), cljs.core.hash_map("\ufdd0'line", 60))), cljs.core.hash_map("\ufdd0'line", 60))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.paredit.in_code_QMARK_.call(null, subpar.paredit.parse.call(null, "a;b"), 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-code?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b"), cljs.core.hash_map("\ufdd0'line", 61)), 1), cljs.core.hash_map("\ufdd0'line", 61))), cljs.core.hash_map("\ufdd0'line", 61))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.in_code_QMARK_.call(null, subpar.paredit.parse.call(null, "a;b"), 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-code?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b"), cljs.core.hash_map("\ufdd0'line", 62)), 2), cljs.core.hash_map("\ufdd0'line", 62))), cljs.core.hash_map("\ufdd0'line", 62))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.paredit.in_code_QMARK_.call(null, subpar.paredit.parse.call(null, "a;b\nc"), 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-code?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "a;b\nc"), cljs.core.hash_map("\ufdd0'line", 63)), 4), cljs.core.hash_map("\ufdd0'line", 63))), cljs.core.hash_map("\ufdd0'line", 63))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.in_code_QMARK_.call(null, subpar.paredit.parse.call(null, 'a;"b"'), 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-code?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a;"b"'), cljs.core.hash_map("\ufdd0'line", 64)), 3), cljs.core.hash_map("\ufdd0'line", 64))), cljs.core.hash_map("\ufdd0'line", 64))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.in_string_QMARK_.call(null, subpar.paredit.parse.call(null, 'a;"b"'), 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-string?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a;"b"'), cljs.core.hash_map("\ufdd0'line", 66)), 0), cljs.core.hash_map("\ufdd0'line", 66))), cljs.core.hash_map("\ufdd0'line", 66))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.in_string_QMARK_.call(null, subpar.paredit.parse.call(null, 'a;"b"'), 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-string?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a;"b"'), cljs.core.hash_map("\ufdd0'line", 67)), 3), cljs.core.hash_map("\ufdd0'line", 67))), cljs.core.hash_map("\ufdd0'line", 67))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.in_string_QMARK_.call(null, subpar.paredit.parse.call(null, 'a "b"'), 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'in-string?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a "b"'), cljs.core.hash_map("\ufdd0'line", 68)), 2), cljs.core.hash_map("\ufdd0'line", 68))), cljs.core.hash_map("\ufdd0'line", 68))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.paredit.in_string_QMARK_.call(null, subpar.paredit.parse.call(null, 'a "b"'), 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-string?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a "b"'), cljs.core.hash_map("\ufdd0'line", 69)), 3), cljs.core.hash_map("\ufdd0'line", 69))), cljs.core.hash_map("\ufdd0'line", 69))))].join(""));
  }
  if(cljs.core._EQ_.call(null, true, subpar.paredit.in_string_QMARK_.call(null, subpar.paredit.parse.call(null, 'a "b"'), 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", true, cljs.core.with_meta(cljs.core.list("\ufdd1'in-string?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", 'a "b"'), cljs.core.hash_map("\ufdd0'line", 70)), 4), cljs.core.hash_map("\ufdd0'line", 70))), cljs.core.hash_map("\ufdd0'line", 70))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.double_quote_action.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'double-quote-action", "", 0), cljs.core.hash_map("\ufdd0'line", 72))), cljs.core.hash_map("\ufdd0'line", 72))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.double_quote_action.call(null, "  ", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'double-quote-action", "  ", 1), cljs.core.hash_map("\ufdd0'line", 73))), cljs.core.hash_map("\ufdd0'line", 73))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.double_quote_action.call(null, '""', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'double-quote-action", '""', 0), cljs.core.hash_map("\ufdd0'line", 74))), cljs.core.hash_map("\ufdd0'line", 74))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.paredit.double_quote_action.call(null, '""', 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'double-quote-action", '""', 1), cljs.core.hash_map("\ufdd0'line", 75))), cljs.core.hash_map("\ufdd0'line", 75))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.double_quote_action.call(null, '" "', 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'double-quote-action", '" "', 1), cljs.core.hash_map("\ufdd0'line", 76))), cljs.core.hash_map("\ufdd0'line", 76))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.double_quote_action.call(null, '" \\" "', 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'double-quote-action", '" \\" "', 2), cljs.core.hash_map("\ufdd0'line", 77))), cljs.core.hash_map("\ufdd0'line", 77))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.paredit.double_quote_action.call(null, '" \\" "', 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'double-quote-action", '" \\" "', 3), cljs.core.hash_map("\ufdd0'line", 78))), cljs.core.hash_map("\ufdd0'line", 78))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.double_quote_action.call(null, '; " "', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'double-quote-action", '; " "', 0), cljs.core.hash_map("\ufdd0'line", 79))), cljs.core.hash_map("\ufdd0'line", 79))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.double_quote_action.call(null, '; " "', 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'double-quote-action", '; " "', 1), cljs.core.hash_map("\ufdd0'line", 80))), cljs.core.hash_map("\ufdd0'line", 80))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.double_quote_action.call(null, '; " "', 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'double-quote-action", '; " "', 2), cljs.core.hash_map("\ufdd0'line", 81))), cljs.core.hash_map("\ufdd0'line", 81))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.double_quote_action.call(null, '; " "', 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'double-quote-action", '; " "', 3), cljs.core.hash_map("\ufdd0'line", 82))), cljs.core.hash_map("\ufdd0'line", 82))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.double_quote_action.call(null, '; " "', 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'double-quote-action", '; " "', 4), cljs.core.hash_map("\ufdd0'line", 83))), cljs.core.hash_map("\ufdd0'line", 83))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.get_start_of_next_list.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "", 0), cljs.core.hash_map("\ufdd0'line", 85))), cljs.core.hash_map("\ufdd0'line", 85))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.get_start_of_next_list.call(null, " ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", " ", 0), cljs.core.hash_map("\ufdd0'line", 86))), cljs.core.hash_map("\ufdd0'line", 86))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.get_start_of_next_list.call(null, "()  ", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "()  ", 2), cljs.core.hash_map("\ufdd0'line", 87))), cljs.core.hash_map("\ufdd0'line", 87))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.get_start_of_next_list.call(null, "()", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "()", 1), cljs.core.hash_map("\ufdd0'line", 88))), cljs.core.hash_map("\ufdd0'line", 88))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.get_start_of_next_list.call(null, "() ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "() ", 0), cljs.core.hash_map("\ufdd0'line", 89))), cljs.core.hash_map("\ufdd0'line", 89))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.get_start_of_next_list.call(null, ";()", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ";()", 0), cljs.core.hash_map("\ufdd0'line", 90))), cljs.core.hash_map("\ufdd0'line", 90))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.get_start_of_next_list.call(null, ";[]", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ";[]", 0), cljs.core.hash_map("\ufdd0'line", 91))), cljs.core.hash_map("\ufdd0'line", 91))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.get_start_of_next_list.call(null, ";{}", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ";{}", 0), cljs.core.hash_map("\ufdd0'line", 92))), cljs.core.hash_map("\ufdd0'line", 92))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.get_start_of_next_list.call(null, ';""', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ';""', 0), cljs.core.hash_map("\ufdd0'line", 93))), cljs.core.hash_map("\ufdd0'line", 93))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.get_start_of_next_list.call(null, " () ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", " () ", 0), cljs.core.hash_map("\ufdd0'line", 94))), cljs.core.hash_map("\ufdd0'line", 94))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.get_start_of_next_list.call(null, " [] ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", " [] ", 0), cljs.core.hash_map("\ufdd0'line", 95))), cljs.core.hash_map("\ufdd0'line", 95))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.get_start_of_next_list.call(null, " {} ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", " {} ", 0), cljs.core.hash_map("\ufdd0'line", 96))), cljs.core.hash_map("\ufdd0'line", 96))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.get_start_of_next_list.call(null, ' "" ', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ' "" ', 0), cljs.core.hash_map("\ufdd0'line", 97))), cljs.core.hash_map("\ufdd0'line", 97))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.get_start_of_next_list.call(null, ';""', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ';""', 0), cljs.core.hash_map("\ufdd0'line", 98))), cljs.core.hash_map("\ufdd0'line", 98))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.get_start_of_next_list.call(null, ';""', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", ';""', 0), cljs.core.hash_map("\ufdd0'line", 99))), cljs.core.hash_map("\ufdd0'line", 99))))].join(""));
  }
  if(cljs.core._EQ_.call(null, false, subpar.paredit.get_start_of_next_list.call(null, "();a\n()", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", false, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "();a\n()", 1), cljs.core.hash_map("\ufdd0'line", 100))), cljs.core.hash_map("\ufdd0'line", 100))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.paredit.get_start_of_next_list.call(null, "();a\n()", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "();a\n()", 2), cljs.core.hash_map("\ufdd0'line", 101))), cljs.core.hash_map("\ufdd0'line", 101))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.paredit.get_start_of_next_list.call(null, "( [] [])", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "( [] [])", 1), cljs.core.hash_map("\ufdd0'line", 102))), cljs.core.hash_map("\ufdd0'line", 102))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.paredit.get_start_of_next_list.call(null, "(aaa []())", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'get-start-of-next-list", "(aaa []())", 1), cljs.core.hash_map("\ufdd0'line", 103))), cljs.core.hash_map("\ufdd0'line", 103))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.backward_up_fn.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up-fn", "", 0), cljs.core.hash_map("\ufdd0'line", 105))), cljs.core.hash_map("\ufdd0'line", 105))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.backward_up_fn.call(null, " ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up-fn", " ", 0), cljs.core.hash_map("\ufdd0'line", 106))), cljs.core.hash_map("\ufdd0'line", 106))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.backward_up_fn.call(null, " ", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up-fn", " ", 1), cljs.core.hash_map("\ufdd0'line", 107))), cljs.core.hash_map("\ufdd0'line", 107))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.backward_up_fn.call(null, " ( )", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up-fn", " ( )", 2), cljs.core.hash_map("\ufdd0'line", 108))), cljs.core.hash_map("\ufdd0'line", 108))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.backward_up_fn.call(null, " ()", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up-fn", " ()", 3), cljs.core.hash_map("\ufdd0'line", 109))), cljs.core.hash_map("\ufdd0'line", 109))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.paredit.backward_up_fn.call(null, " ()\n;\n", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up-fn", " ()\n;\n", 5), cljs.core.hash_map("\ufdd0'line", 110))), cljs.core.hash_map("\ufdd0'line", 110))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.backward_up_fn.call(null, " ( [ ])", 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up-fn", " ( [ ])", 4), cljs.core.hash_map("\ufdd0'line", 111))), cljs.core.hash_map("\ufdd0'line", 111))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.backward_up_fn.call(null, " ( [ asdf])", 7))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up-fn", " ( [ asdf])", 7), cljs.core.hash_map("\ufdd0'line", 112))), cljs.core.hash_map("\ufdd0'line", 112))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.backward_up_fn.call(null, " ( [ asdf])", 9))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up-fn", " ( [ asdf])", 9), cljs.core.hash_map("\ufdd0'line", 113))), cljs.core.hash_map("\ufdd0'line", 113))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.backward_up_fn.call(null, " ( [ asdf])", 10))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up-fn", " ( [ asdf])", 10), cljs.core.hash_map("\ufdd0'line", 114))), cljs.core.hash_map("\ufdd0'line", 114))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 11, subpar.paredit.backward_up_fn.call(null, " ( [ asdf])", 11))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 11, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up-fn", " ( [ asdf])", 11), cljs.core.hash_map("\ufdd0'line", 115))), cljs.core.hash_map("\ufdd0'line", 115))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 13, subpar.paredit.backward_up_fn.call(null, " ( [ asdf])  ", 13))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 13, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-up-fn", " ( [ asdf])  ", 13), cljs.core.hash_map("\ufdd0'line", 116))), cljs.core.hash_map("\ufdd0'line", 116))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.forward_fn.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", "", 0), cljs.core.hash_map("\ufdd0'line", 118))), cljs.core.hash_map("\ufdd0'line", 118))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.forward_fn.call(null, " ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", " ", 0), cljs.core.hash_map("\ufdd0'line", 119))), cljs.core.hash_map("\ufdd0'line", 119))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.forward_fn.call(null, " ()", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", " ()", 0), cljs.core.hash_map("\ufdd0'line", 120))), cljs.core.hash_map("\ufdd0'line", 120))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.forward_fn.call(null, "\n()", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", "\n()", 0), cljs.core.hash_map("\ufdd0'line", 121))), cljs.core.hash_map("\ufdd0'line", 121))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 11, subpar.paredit.forward_fn.call(null, " (asdf (a))", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 11, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", " (asdf (a))", 0), cljs.core.hash_map("\ufdd0'line", 122))), cljs.core.hash_map("\ufdd0'line", 122))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 11, subpar.paredit.forward_fn.call(null, " (asdf (a))", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 11, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", " (asdf (a))", 1), cljs.core.hash_map("\ufdd0'line", 123))), cljs.core.hash_map("\ufdd0'line", 123))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.paredit.forward_fn.call(null, " (asdf (a))", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", " (asdf (a))", 2), cljs.core.hash_map("\ufdd0'line", 124))), cljs.core.hash_map("\ufdd0'line", 124))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.paredit.forward_fn.call(null, " (asdf (a))", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", " (asdf (a))", 3), cljs.core.hash_map("\ufdd0'line", 125))), cljs.core.hash_map("\ufdd0'line", 125))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 10, subpar.paredit.forward_fn.call(null, " (asdf (a))", 6))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 10, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", " (asdf (a))", 6), cljs.core.hash_map("\ufdd0'line", 126))), cljs.core.hash_map("\ufdd0'line", 126))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.paredit.forward_fn.call(null, "((ab ) )", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", "((ab ) )", 1), cljs.core.hash_map("\ufdd0'line", 127))), cljs.core.hash_map("\ufdd0'line", 127))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.paredit.forward_fn.call(null, "((ab ) )", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", "((ab ) )", 2), cljs.core.hash_map("\ufdd0'line", 128))), cljs.core.hash_map("\ufdd0'line", 128))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 6, subpar.paredit.forward_fn.call(null, "((ab ) )", 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 6, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", "((ab ) )", 4), cljs.core.hash_map("\ufdd0'line", 129))), cljs.core.hash_map("\ufdd0'line", 129))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 13, subpar.paredit.forward_fn.call(null, ";a\n[asdf {a}]", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 13, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", ";a\n[asdf {a}]", 0), cljs.core.hash_map("\ufdd0'line", 130))), cljs.core.hash_map("\ufdd0'line", 130))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.paredit.forward_fn.call(null, " asdf ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", " asdf ", 0), cljs.core.hash_map("\ufdd0'line", 131))), cljs.core.hash_map("\ufdd0'line", 131))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 5, subpar.paredit.forward_fn.call(null, " asdf ", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 5, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", " asdf ", 2), cljs.core.hash_map("\ufdd0'line", 132))), cljs.core.hash_map("\ufdd0'line", 132))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 9, subpar.paredit.forward_fn.call(null, "( a ;b\n c)", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 9, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", "( a ;b\n c)", 3), cljs.core.hash_map("\ufdd0'line", 133))), cljs.core.hash_map("\ufdd0'line", 133))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.paredit.forward_fn.call(null, '"\\n"', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-fn", '"\\n"', 0), cljs.core.hash_map("\ufdd0'line", 134))), cljs.core.hash_map("\ufdd0'line", 134))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([")", 1, 4, 1], true), subpar.paredit.forward_slurp_vals.call(null, "() a", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([")", 1, 4, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp-vals", "() a", 1), cljs.core.hash_map("\ufdd0'line", 136))), cljs.core.hash_map("\ufdd0'line", 136))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([")", 1, 6, 1], true), subpar.paredit.forward_slurp_vals.call(null, "() (a)", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([")", 1, 6, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp-vals", "() (a)", 1), cljs.core.hash_map("\ufdd0'line", 137))), cljs.core.hash_map("\ufdd0'line", 137))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([")", 1, 8, 1], true), subpar.paredit.forward_slurp_vals.call(null, "() (a b)", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([")", 1, 8, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp-vals", "() (a b)", 1), cljs.core.hash_map("\ufdd0'line", 138))), cljs.core.hash_map("\ufdd0'line", 138))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([")", 1, 10, 2], true), subpar.paredit.forward_slurp_vals.call(null, "();c\n(a b)", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([")", 1, 10, 2]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp-vals", "();c\n(a b)", 1), cljs.core.hash_map("\ufdd0'line", 139))), cljs.core.hash_map("\ufdd0'line", 139))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.EMPTY, subpar.paredit.forward_slurp_vals.call(null, "() ", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp-vals", "() ", 2), cljs.core.hash_map("\ufdd0'line", 140))), cljs.core.hash_map("\ufdd0'line", 140))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.EMPTY, subpar.paredit.forward_slurp_vals.call(null, " () ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp-vals", " () ", 0), cljs.core.hash_map("\ufdd0'line", 141))), cljs.core.hash_map("\ufdd0'line", 141))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([")", 1, 8, 1], true), subpar.paredit.forward_slurp_vals.call(null, '() "a b"', 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([")", 1, 8, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp-vals", '() "a b"', 1), cljs.core.hash_map("\ufdd0'line", 142))), cljs.core.hash_map("\ufdd0'line", 142))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.EMPTY, subpar.paredit.forward_slurp_vals.call(null, '({a "b"} c)', 6))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp-vals", '({a "b"} c)', 6), cljs.core.hash_map("\ufdd0'line", 143))), cljs.core.hash_map("\ufdd0'line", 143))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([")", 4, 7, 1], true), subpar.paredit.forward_slurp_vals.call(null, "(abc) a", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([")", 4, 7, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-slurp-vals", "(abc) a", 2), cljs.core.hash_map("\ufdd0'line", 144))), cljs.core.hash_map("\ufdd0'line", 144))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray(["(", 3, 1, 1], true), subpar.paredit.backward_slurp_vals.call(null, " a () ", 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec(["(", 3, 1, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp-vals", " a () ", 4), cljs.core.hash_map("\ufdd0'line", 146))), cljs.core.hash_map("\ufdd0'line", 146))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray(["(", 2, 0, 1], true), subpar.paredit.backward_slurp_vals.call(null, "a () ", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec(["(", 2, 0, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp-vals", "a () ", 3), cljs.core.hash_map("\ufdd0'line", 147))), cljs.core.hash_map("\ufdd0'line", 147))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.EMPTY, subpar.paredit.backward_slurp_vals.call(null, "a () ", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp-vals", "a () ", 2), cljs.core.hash_map("\ufdd0'line", 148))), cljs.core.hash_map("\ufdd0'line", 148))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray(["(", 6, 1, 1], true), subpar.paredit.backward_slurp_vals.call(null, " [ab] (c d) ", 9))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec(["(", 6, 1, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp-vals", " [ab] (c d) ", 9), cljs.core.hash_map("\ufdd0'line", 149))), cljs.core.hash_map("\ufdd0'line", 149))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray(["(", 6, 1, 1], true), subpar.paredit.backward_slurp_vals.call(null, " {ab} (c d) ", 8))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec(["(", 6, 1, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp-vals", " {ab} (c d) ", 8), cljs.core.hash_map("\ufdd0'line", 150))), cljs.core.hash_map("\ufdd0'line", 150))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray(["(", 7, 1, 1], true), subpar.paredit.backward_slurp_vals.call(null, " (a b) (c d) ", 8))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec(["(", 7, 1, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp-vals", " (a b) (c d) ", 8), cljs.core.hash_map("\ufdd0'line", 151))), cljs.core.hash_map("\ufdd0'line", 151))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray(["(", 7, 1, 1], true), subpar.paredit.backward_slurp_vals.call(null, ' "a b" (c d) ', 8))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec(["(", 7, 1, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp-vals", ' "a b" (c d) ', 8), cljs.core.hash_map("\ufdd0'line", 152))), cljs.core.hash_map("\ufdd0'line", 152))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.EMPTY, subpar.paredit.backward_slurp_vals.call(null, "(a [{}])", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-slurp-vals", "(a [{}])", 5), cljs.core.hash_map("\ufdd0'line", 153))), cljs.core.hash_map("\ufdd0'line", 153))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.forward_delete_action.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", "", 0), cljs.core.hash_map("\ufdd0'line", 155))), cljs.core.hash_map("\ufdd0'line", 155))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.forward_delete_action.call(null, "a", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", "a", 1), cljs.core.hash_map("\ufdd0'line", 156))), cljs.core.hash_map("\ufdd0'line", 156))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.forward_delete_action.call(null, "a", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", "a", 0), cljs.core.hash_map("\ufdd0'line", 157))), cljs.core.hash_map("\ufdd0'line", 157))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.forward_delete_action.call(null, "[]", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", "[]", 0), cljs.core.hash_map("\ufdd0'line", 158))), cljs.core.hash_map("\ufdd0'line", 158))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.paredit.forward_delete_action.call(null, "[]", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", "[]", 1), cljs.core.hash_map("\ufdd0'line", 159))), cljs.core.hash_map("\ufdd0'line", 159))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.forward_delete_action.call(null, "[a]", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", "[a]", 2), cljs.core.hash_map("\ufdd0'line", 160))), cljs.core.hash_map("\ufdd0'line", 160))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.forward_delete_action.call(null, "[ ]", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", "[ ]", 2), cljs.core.hash_map("\ufdd0'line", 161))), cljs.core.hash_map("\ufdd0'line", 161))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.paredit.forward_delete_action.call(null, "( )", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", "( )", 0), cljs.core.hash_map("\ufdd0'line", 162))), cljs.core.hash_map("\ufdd0'line", 162))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.paredit.forward_delete_action.call(null, "(a)", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", "(a)", 0), cljs.core.hash_map("\ufdd0'line", 163))), cljs.core.hash_map("\ufdd0'line", 163))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.paredit.forward_delete_action.call(null, '"a"', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", '"a"', 0), cljs.core.hash_map("\ufdd0'line", 164))), cljs.core.hash_map("\ufdd0'line", 164))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.forward_delete_action.call(null, '""', 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", '""', 0), cljs.core.hash_map("\ufdd0'line", 165))), cljs.core.hash_map("\ufdd0'line", 165))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.forward_delete_action.call(null, '" "', 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", '" "', 2), cljs.core.hash_map("\ufdd0'line", 166))), cljs.core.hash_map("\ufdd0'line", 166))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.forward_delete_action.call(null, "\\a", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", "\\a", 0), cljs.core.hash_map("\ufdd0'line", 167))), cljs.core.hash_map("\ufdd0'line", 167))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.paredit.forward_delete_action.call(null, "\\a", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", "\\a", 1), cljs.core.hash_map("\ufdd0'line", 168))), cljs.core.hash_map("\ufdd0'line", 168))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.forward_delete_action.call(null, '"\\a"', 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", '"\\a"', 1), cljs.core.hash_map("\ufdd0'line", 169))), cljs.core.hash_map("\ufdd0'line", 169))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.paredit.forward_delete_action.call(null, '"\\a"', 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'forward-delete-action", '"\\a"', 2), cljs.core.hash_map("\ufdd0'line", 170))), cljs.core.hash_map("\ufdd0'line", 170))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.backward_delete_action.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete-action", "", 0), cljs.core.hash_map("\ufdd0'line", 172))), cljs.core.hash_map("\ufdd0'line", 172))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.backward_delete_action.call(null, " ", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete-action", " ", 0), cljs.core.hash_map("\ufdd0'line", 173))), cljs.core.hash_map("\ufdd0'line", 173))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 1, subpar.paredit.backward_delete_action.call(null, " ", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 1, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete-action", " ", 1), cljs.core.hash_map("\ufdd0'line", 174))), cljs.core.hash_map("\ufdd0'line", 174))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 0, subpar.paredit.backward_delete_action.call(null, "( )", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 0, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete-action", "( )", 1), cljs.core.hash_map("\ufdd0'line", 175))), cljs.core.hash_map("\ufdd0'line", 175))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.paredit.backward_delete_action.call(null, "( )", 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete-action", "( )", 3), cljs.core.hash_map("\ufdd0'line", 176))), cljs.core.hash_map("\ufdd0'line", 176))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.backward_delete_action.call(null, "()", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete-action", "()", 2), cljs.core.hash_map("\ufdd0'line", 177))), cljs.core.hash_map("\ufdd0'line", 177))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 4, subpar.paredit.backward_delete_action.call(null, "(asdf)", 6))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 4, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete-action", "(asdf)", 6), cljs.core.hash_map("\ufdd0'line", 178))), cljs.core.hash_map("\ufdd0'line", 178))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.paredit.backward_delete_action.call(null, "\\a", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete-action", "\\a", 1), cljs.core.hash_map("\ufdd0'line", 179))), cljs.core.hash_map("\ufdd0'line", 179))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.backward_delete_action.call(null, "\\a", 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete-action", "\\a", 2), cljs.core.hash_map("\ufdd0'line", 180))), cljs.core.hash_map("\ufdd0'line", 180))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.paredit.backward_delete_action.call(null, '""', 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete-action", '""', 1), cljs.core.hash_map("\ufdd0'line", 181))), cljs.core.hash_map("\ufdd0'line", 181))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.backward_delete_action.call(null, '""', 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete-action", '""', 2), cljs.core.hash_map("\ufdd0'line", 182))), cljs.core.hash_map("\ufdd0'line", 182))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 2, subpar.paredit.backward_delete_action.call(null, '"\\"', 2))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 2, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete-action", '"\\"', 2), cljs.core.hash_map("\ufdd0'line", 183))), cljs.core.hash_map("\ufdd0'line", 183))))].join(""));
  }
  if(cljs.core._EQ_.call(null, 3, subpar.paredit.backward_delete_action.call(null, '"\\"', 3))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", 3, cljs.core.with_meta(cljs.core.list("\ufdd1'backward-delete-action", '"\\"', 3), cljs.core.hash_map("\ufdd0'line", 184))), cljs.core.hash_map("\ufdd0'line", 184))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.EMPTY, subpar.paredit.backward_barf_vals.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf-vals", "", 0), cljs.core.hash_map("\ufdd0'line", 186))), cljs.core.hash_map("\ufdd0'line", 186))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.EMPTY, subpar.paredit.backward_barf_vals.call(null, "()", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf-vals", "()", 1), cljs.core.hash_map("\ufdd0'line", 187))), cljs.core.hash_map("\ufdd0'line", 187))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray(["(", 0, 2, true, 1], true), subpar.paredit.backward_barf_vals.call(null, "(a)", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec(["(", 0, 2, true, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf-vals", "(a)", 1), cljs.core.hash_map("\ufdd0'line", 188))), cljs.core.hash_map("\ufdd0'line", 188))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray(["(", 0, 3, false, 1], true), subpar.paredit.backward_barf_vals.call(null, "(a b)", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec(["(", 0, 3, false, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf-vals", "(a b)", 1), cljs.core.hash_map("\ufdd0'line", 189))), cljs.core.hash_map("\ufdd0'line", 189))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray(["(", 0, 3, false, 2], true), subpar.paredit.backward_barf_vals.call(null, "(a\nb)", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec(["(", 0, 3, false, 2]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf-vals", "(a\nb)", 1), cljs.core.hash_map("\ufdd0'line", 190))), cljs.core.hash_map("\ufdd0'line", 190))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.EMPTY, subpar.paredit.backward_barf_vals.call(null, "(a b)", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf-vals", "(a b)", 5), cljs.core.hash_map("\ufdd0'line", 191))), cljs.core.hash_map("\ufdd0'line", 191))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.EMPTY, subpar.paredit.backward_barf_vals.call(null, "(a b) ", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf-vals", "(a b) ", 5), cljs.core.hash_map("\ufdd0'line", 192))), cljs.core.hash_map("\ufdd0'line", 192))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray(["[", 3, 5, true, 1], true), subpar.paredit.backward_barf_vals.call(null, "(a [b]) ", 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec(["[", 3, 5, true, 1]), cljs.core.with_meta(cljs.core.list("\ufdd1'backward-barf-vals", "(a [b]) ", 4), cljs.core.hash_map("\ufdd0'line", 193))), cljs.core.hash_map("\ufdd0'line", 193))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.EMPTY, subpar.paredit.forward_barf_vals.call(null, "", 0))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf-vals", "", 0), cljs.core.hash_map("\ufdd0'line", 195))), cljs.core.hash_map("\ufdd0'line", 195))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.EMPTY, subpar.paredit.forward_barf_vals.call(null, "()", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf-vals", "()", 1), cljs.core.hash_map("\ufdd0'line", 196))), cljs.core.hash_map("\ufdd0'line", 196))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([")", 2, 1, true, 1, 0], true), subpar.paredit.forward_barf_vals.call(null, "(a)", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([")", 2, 1, true, 1, 0]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf-vals", "(a)", 1), cljs.core.hash_map("\ufdd0'line", 197))), cljs.core.hash_map("\ufdd0'line", 197))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([")", 4, 2, false, 1, 0], true), subpar.paredit.forward_barf_vals.call(null, "(a b)", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([")", 4, 2, false, 1, 0]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf-vals", "(a b)", 1), cljs.core.hash_map("\ufdd0'line", 198))), cljs.core.hash_map("\ufdd0'line", 198))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([")", 4, 2, false, 2, 0], true), subpar.paredit.forward_barf_vals.call(null, "(a\nb)", 1))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([")", 4, 2, false, 2, 0]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf-vals", "(a\nb)", 1), cljs.core.hash_map("\ufdd0'line", 199))), cljs.core.hash_map("\ufdd0'line", 199))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.EMPTY, subpar.paredit.forward_barf_vals.call(null, "(a b)", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf-vals", "(a b)", 5), cljs.core.hash_map("\ufdd0'line", 200))), cljs.core.hash_map("\ufdd0'line", 200))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.EMPTY, subpar.paredit.forward_barf_vals.call(null, "(a b) ", 5))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf-vals", "(a b) ", 5), cljs.core.hash_map("\ufdd0'line", 201))), cljs.core.hash_map("\ufdd0'line", 201))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray(["]", 5, 4, true, 1, 3], true), subpar.paredit.forward_barf_vals.call(null, "(a [b]) ", 4))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec(["]", 5, 4, true, 1, 3]), cljs.core.with_meta(cljs.core.list("\ufdd1'forward-barf-vals", "(a [b]) ", 4), cljs.core.hash_map("\ufdd0'line", 202))), cljs.core.hash_map("\ufdd0'line", 202))))].join(""));
  }
  if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([true, 1, 4, 2], true), subpar.paredit.close_expression_vals.call(null, subpar.paredit.parse.call(null, "[   ]"), 1))) {
    return null
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", cljs.core.vec([true, 1, 4, 2]), cljs.core.with_meta(cljs.core.list("\ufdd1'close-expression-vals", cljs.core.with_meta(cljs.core.list("\ufdd1'parse", "[   ]"), cljs.core.hash_map("\ufdd0'line", 204)), 1), cljs.core.hash_map("\ufdd0'line", 204))), cljs.core.hash_map("\ufdd0'line", 204))))].join(""));
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
