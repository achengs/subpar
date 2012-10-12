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
  var x__7011 = x == null ? null : x;
  if(p[goog.typeOf(x__7011)]) {
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
    var G__7012__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__7012 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7012__delegate.call(this, array, i, idxs)
    };
    G__7012.cljs$lang$maxFixedArity = 2;
    G__7012.cljs$lang$applyTo = function(arglist__7013) {
      var array = cljs.core.first(arglist__7013);
      var i = cljs.core.first(cljs.core.next(arglist__7013));
      var idxs = cljs.core.rest(cljs.core.next(arglist__7013));
      return G__7012__delegate(array, i, idxs)
    };
    G__7012.cljs$lang$arity$variadic = G__7012__delegate;
    return G__7012
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
      var and__3822__auto____7098 = this$;
      if(and__3822__auto____7098) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____7098
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____7099 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7100 = cljs.core._invoke[goog.typeOf(x__2363__auto____7099)];
        if(or__3824__auto____7100) {
          return or__3824__auto____7100
        }else {
          var or__3824__auto____7101 = cljs.core._invoke["_"];
          if(or__3824__auto____7101) {
            return or__3824__auto____7101
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____7102 = this$;
      if(and__3822__auto____7102) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____7102
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____7103 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7104 = cljs.core._invoke[goog.typeOf(x__2363__auto____7103)];
        if(or__3824__auto____7104) {
          return or__3824__auto____7104
        }else {
          var or__3824__auto____7105 = cljs.core._invoke["_"];
          if(or__3824__auto____7105) {
            return or__3824__auto____7105
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____7106 = this$;
      if(and__3822__auto____7106) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____7106
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____7107 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7108 = cljs.core._invoke[goog.typeOf(x__2363__auto____7107)];
        if(or__3824__auto____7108) {
          return or__3824__auto____7108
        }else {
          var or__3824__auto____7109 = cljs.core._invoke["_"];
          if(or__3824__auto____7109) {
            return or__3824__auto____7109
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____7110 = this$;
      if(and__3822__auto____7110) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____7110
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____7111 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7112 = cljs.core._invoke[goog.typeOf(x__2363__auto____7111)];
        if(or__3824__auto____7112) {
          return or__3824__auto____7112
        }else {
          var or__3824__auto____7113 = cljs.core._invoke["_"];
          if(or__3824__auto____7113) {
            return or__3824__auto____7113
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____7114 = this$;
      if(and__3822__auto____7114) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____7114
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____7115 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7116 = cljs.core._invoke[goog.typeOf(x__2363__auto____7115)];
        if(or__3824__auto____7116) {
          return or__3824__auto____7116
        }else {
          var or__3824__auto____7117 = cljs.core._invoke["_"];
          if(or__3824__auto____7117) {
            return or__3824__auto____7117
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____7118 = this$;
      if(and__3822__auto____7118) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____7118
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____7119 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7120 = cljs.core._invoke[goog.typeOf(x__2363__auto____7119)];
        if(or__3824__auto____7120) {
          return or__3824__auto____7120
        }else {
          var or__3824__auto____7121 = cljs.core._invoke["_"];
          if(or__3824__auto____7121) {
            return or__3824__auto____7121
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____7122 = this$;
      if(and__3822__auto____7122) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____7122
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____7123 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7124 = cljs.core._invoke[goog.typeOf(x__2363__auto____7123)];
        if(or__3824__auto____7124) {
          return or__3824__auto____7124
        }else {
          var or__3824__auto____7125 = cljs.core._invoke["_"];
          if(or__3824__auto____7125) {
            return or__3824__auto____7125
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____7126 = this$;
      if(and__3822__auto____7126) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____7126
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____7127 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7128 = cljs.core._invoke[goog.typeOf(x__2363__auto____7127)];
        if(or__3824__auto____7128) {
          return or__3824__auto____7128
        }else {
          var or__3824__auto____7129 = cljs.core._invoke["_"];
          if(or__3824__auto____7129) {
            return or__3824__auto____7129
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____7130 = this$;
      if(and__3822__auto____7130) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____7130
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____7131 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7132 = cljs.core._invoke[goog.typeOf(x__2363__auto____7131)];
        if(or__3824__auto____7132) {
          return or__3824__auto____7132
        }else {
          var or__3824__auto____7133 = cljs.core._invoke["_"];
          if(or__3824__auto____7133) {
            return or__3824__auto____7133
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____7134 = this$;
      if(and__3822__auto____7134) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____7134
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____7135 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7136 = cljs.core._invoke[goog.typeOf(x__2363__auto____7135)];
        if(or__3824__auto____7136) {
          return or__3824__auto____7136
        }else {
          var or__3824__auto____7137 = cljs.core._invoke["_"];
          if(or__3824__auto____7137) {
            return or__3824__auto____7137
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____7138 = this$;
      if(and__3822__auto____7138) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____7138
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____7139 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7140 = cljs.core._invoke[goog.typeOf(x__2363__auto____7139)];
        if(or__3824__auto____7140) {
          return or__3824__auto____7140
        }else {
          var or__3824__auto____7141 = cljs.core._invoke["_"];
          if(or__3824__auto____7141) {
            return or__3824__auto____7141
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____7142 = this$;
      if(and__3822__auto____7142) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____7142
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____7143 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7144 = cljs.core._invoke[goog.typeOf(x__2363__auto____7143)];
        if(or__3824__auto____7144) {
          return or__3824__auto____7144
        }else {
          var or__3824__auto____7145 = cljs.core._invoke["_"];
          if(or__3824__auto____7145) {
            return or__3824__auto____7145
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____7146 = this$;
      if(and__3822__auto____7146) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____7146
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____7147 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7148 = cljs.core._invoke[goog.typeOf(x__2363__auto____7147)];
        if(or__3824__auto____7148) {
          return or__3824__auto____7148
        }else {
          var or__3824__auto____7149 = cljs.core._invoke["_"];
          if(or__3824__auto____7149) {
            return or__3824__auto____7149
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____7150 = this$;
      if(and__3822__auto____7150) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____7150
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____7151 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7152 = cljs.core._invoke[goog.typeOf(x__2363__auto____7151)];
        if(or__3824__auto____7152) {
          return or__3824__auto____7152
        }else {
          var or__3824__auto____7153 = cljs.core._invoke["_"];
          if(or__3824__auto____7153) {
            return or__3824__auto____7153
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____7154 = this$;
      if(and__3822__auto____7154) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____7154
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____7155 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7156 = cljs.core._invoke[goog.typeOf(x__2363__auto____7155)];
        if(or__3824__auto____7156) {
          return or__3824__auto____7156
        }else {
          var or__3824__auto____7157 = cljs.core._invoke["_"];
          if(or__3824__auto____7157) {
            return or__3824__auto____7157
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____7158 = this$;
      if(and__3822__auto____7158) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____7158
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____7159 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7160 = cljs.core._invoke[goog.typeOf(x__2363__auto____7159)];
        if(or__3824__auto____7160) {
          return or__3824__auto____7160
        }else {
          var or__3824__auto____7161 = cljs.core._invoke["_"];
          if(or__3824__auto____7161) {
            return or__3824__auto____7161
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____7162 = this$;
      if(and__3822__auto____7162) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____7162
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____7163 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7164 = cljs.core._invoke[goog.typeOf(x__2363__auto____7163)];
        if(or__3824__auto____7164) {
          return or__3824__auto____7164
        }else {
          var or__3824__auto____7165 = cljs.core._invoke["_"];
          if(or__3824__auto____7165) {
            return or__3824__auto____7165
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____7166 = this$;
      if(and__3822__auto____7166) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____7166
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____7167 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7168 = cljs.core._invoke[goog.typeOf(x__2363__auto____7167)];
        if(or__3824__auto____7168) {
          return or__3824__auto____7168
        }else {
          var or__3824__auto____7169 = cljs.core._invoke["_"];
          if(or__3824__auto____7169) {
            return or__3824__auto____7169
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____7170 = this$;
      if(and__3822__auto____7170) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____7170
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____7171 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7172 = cljs.core._invoke[goog.typeOf(x__2363__auto____7171)];
        if(or__3824__auto____7172) {
          return or__3824__auto____7172
        }else {
          var or__3824__auto____7173 = cljs.core._invoke["_"];
          if(or__3824__auto____7173) {
            return or__3824__auto____7173
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____7174 = this$;
      if(and__3822__auto____7174) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____7174
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____7175 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7176 = cljs.core._invoke[goog.typeOf(x__2363__auto____7175)];
        if(or__3824__auto____7176) {
          return or__3824__auto____7176
        }else {
          var or__3824__auto____7177 = cljs.core._invoke["_"];
          if(or__3824__auto____7177) {
            return or__3824__auto____7177
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____7178 = this$;
      if(and__3822__auto____7178) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____7178
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____7179 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7180 = cljs.core._invoke[goog.typeOf(x__2363__auto____7179)];
        if(or__3824__auto____7180) {
          return or__3824__auto____7180
        }else {
          var or__3824__auto____7181 = cljs.core._invoke["_"];
          if(or__3824__auto____7181) {
            return or__3824__auto____7181
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
    var and__3822__auto____7186 = coll;
    if(and__3822__auto____7186) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____7186
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____7187 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7188 = cljs.core._count[goog.typeOf(x__2363__auto____7187)];
      if(or__3824__auto____7188) {
        return or__3824__auto____7188
      }else {
        var or__3824__auto____7189 = cljs.core._count["_"];
        if(or__3824__auto____7189) {
          return or__3824__auto____7189
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
    var and__3822__auto____7194 = coll;
    if(and__3822__auto____7194) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____7194
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____7195 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7196 = cljs.core._empty[goog.typeOf(x__2363__auto____7195)];
      if(or__3824__auto____7196) {
        return or__3824__auto____7196
      }else {
        var or__3824__auto____7197 = cljs.core._empty["_"];
        if(or__3824__auto____7197) {
          return or__3824__auto____7197
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
    var and__3822__auto____7202 = coll;
    if(and__3822__auto____7202) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____7202
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____7203 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7204 = cljs.core._conj[goog.typeOf(x__2363__auto____7203)];
      if(or__3824__auto____7204) {
        return or__3824__auto____7204
      }else {
        var or__3824__auto____7205 = cljs.core._conj["_"];
        if(or__3824__auto____7205) {
          return or__3824__auto____7205
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
      var and__3822__auto____7214 = coll;
      if(and__3822__auto____7214) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____7214
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____7215 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7216 = cljs.core._nth[goog.typeOf(x__2363__auto____7215)];
        if(or__3824__auto____7216) {
          return or__3824__auto____7216
        }else {
          var or__3824__auto____7217 = cljs.core._nth["_"];
          if(or__3824__auto____7217) {
            return or__3824__auto____7217
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____7218 = coll;
      if(and__3822__auto____7218) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____7218
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____7219 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7220 = cljs.core._nth[goog.typeOf(x__2363__auto____7219)];
        if(or__3824__auto____7220) {
          return or__3824__auto____7220
        }else {
          var or__3824__auto____7221 = cljs.core._nth["_"];
          if(or__3824__auto____7221) {
            return or__3824__auto____7221
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
    var and__3822__auto____7226 = coll;
    if(and__3822__auto____7226) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____7226
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____7227 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7228 = cljs.core._first[goog.typeOf(x__2363__auto____7227)];
      if(or__3824__auto____7228) {
        return or__3824__auto____7228
      }else {
        var or__3824__auto____7229 = cljs.core._first["_"];
        if(or__3824__auto____7229) {
          return or__3824__auto____7229
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____7234 = coll;
    if(and__3822__auto____7234) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____7234
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____7235 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7236 = cljs.core._rest[goog.typeOf(x__2363__auto____7235)];
      if(or__3824__auto____7236) {
        return or__3824__auto____7236
      }else {
        var or__3824__auto____7237 = cljs.core._rest["_"];
        if(or__3824__auto____7237) {
          return or__3824__auto____7237
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
    var and__3822__auto____7242 = coll;
    if(and__3822__auto____7242) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____7242
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____7243 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7244 = cljs.core._next[goog.typeOf(x__2363__auto____7243)];
      if(or__3824__auto____7244) {
        return or__3824__auto____7244
      }else {
        var or__3824__auto____7245 = cljs.core._next["_"];
        if(or__3824__auto____7245) {
          return or__3824__auto____7245
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
      var and__3822__auto____7254 = o;
      if(and__3822__auto____7254) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____7254
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____7255 = o == null ? null : o;
      return function() {
        var or__3824__auto____7256 = cljs.core._lookup[goog.typeOf(x__2363__auto____7255)];
        if(or__3824__auto____7256) {
          return or__3824__auto____7256
        }else {
          var or__3824__auto____7257 = cljs.core._lookup["_"];
          if(or__3824__auto____7257) {
            return or__3824__auto____7257
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____7258 = o;
      if(and__3822__auto____7258) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____7258
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____7259 = o == null ? null : o;
      return function() {
        var or__3824__auto____7260 = cljs.core._lookup[goog.typeOf(x__2363__auto____7259)];
        if(or__3824__auto____7260) {
          return or__3824__auto____7260
        }else {
          var or__3824__auto____7261 = cljs.core._lookup["_"];
          if(or__3824__auto____7261) {
            return or__3824__auto____7261
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
    var and__3822__auto____7266 = coll;
    if(and__3822__auto____7266) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____7266
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____7267 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7268 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____7267)];
      if(or__3824__auto____7268) {
        return or__3824__auto____7268
      }else {
        var or__3824__auto____7269 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____7269) {
          return or__3824__auto____7269
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____7274 = coll;
    if(and__3822__auto____7274) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____7274
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____7275 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7276 = cljs.core._assoc[goog.typeOf(x__2363__auto____7275)];
      if(or__3824__auto____7276) {
        return or__3824__auto____7276
      }else {
        var or__3824__auto____7277 = cljs.core._assoc["_"];
        if(or__3824__auto____7277) {
          return or__3824__auto____7277
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
    var and__3822__auto____7282 = coll;
    if(and__3822__auto____7282) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____7282
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____7283 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7284 = cljs.core._dissoc[goog.typeOf(x__2363__auto____7283)];
      if(or__3824__auto____7284) {
        return or__3824__auto____7284
      }else {
        var or__3824__auto____7285 = cljs.core._dissoc["_"];
        if(or__3824__auto____7285) {
          return or__3824__auto____7285
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
    var and__3822__auto____7290 = coll;
    if(and__3822__auto____7290) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____7290
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____7291 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7292 = cljs.core._key[goog.typeOf(x__2363__auto____7291)];
      if(or__3824__auto____7292) {
        return or__3824__auto____7292
      }else {
        var or__3824__auto____7293 = cljs.core._key["_"];
        if(or__3824__auto____7293) {
          return or__3824__auto____7293
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____7298 = coll;
    if(and__3822__auto____7298) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____7298
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____7299 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7300 = cljs.core._val[goog.typeOf(x__2363__auto____7299)];
      if(or__3824__auto____7300) {
        return or__3824__auto____7300
      }else {
        var or__3824__auto____7301 = cljs.core._val["_"];
        if(or__3824__auto____7301) {
          return or__3824__auto____7301
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
    var and__3822__auto____7306 = coll;
    if(and__3822__auto____7306) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____7306
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____7307 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7308 = cljs.core._disjoin[goog.typeOf(x__2363__auto____7307)];
      if(or__3824__auto____7308) {
        return or__3824__auto____7308
      }else {
        var or__3824__auto____7309 = cljs.core._disjoin["_"];
        if(or__3824__auto____7309) {
          return or__3824__auto____7309
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
    var and__3822__auto____7314 = coll;
    if(and__3822__auto____7314) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____7314
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____7315 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7316 = cljs.core._peek[goog.typeOf(x__2363__auto____7315)];
      if(or__3824__auto____7316) {
        return or__3824__auto____7316
      }else {
        var or__3824__auto____7317 = cljs.core._peek["_"];
        if(or__3824__auto____7317) {
          return or__3824__auto____7317
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____7322 = coll;
    if(and__3822__auto____7322) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____7322
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____7323 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7324 = cljs.core._pop[goog.typeOf(x__2363__auto____7323)];
      if(or__3824__auto____7324) {
        return or__3824__auto____7324
      }else {
        var or__3824__auto____7325 = cljs.core._pop["_"];
        if(or__3824__auto____7325) {
          return or__3824__auto____7325
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
    var and__3822__auto____7330 = coll;
    if(and__3822__auto____7330) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____7330
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____7331 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7332 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____7331)];
      if(or__3824__auto____7332) {
        return or__3824__auto____7332
      }else {
        var or__3824__auto____7333 = cljs.core._assoc_n["_"];
        if(or__3824__auto____7333) {
          return or__3824__auto____7333
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
    var and__3822__auto____7338 = o;
    if(and__3822__auto____7338) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____7338
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____7339 = o == null ? null : o;
    return function() {
      var or__3824__auto____7340 = cljs.core._deref[goog.typeOf(x__2363__auto____7339)];
      if(or__3824__auto____7340) {
        return or__3824__auto____7340
      }else {
        var or__3824__auto____7341 = cljs.core._deref["_"];
        if(or__3824__auto____7341) {
          return or__3824__auto____7341
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
    var and__3822__auto____7346 = o;
    if(and__3822__auto____7346) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____7346
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____7347 = o == null ? null : o;
    return function() {
      var or__3824__auto____7348 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____7347)];
      if(or__3824__auto____7348) {
        return or__3824__auto____7348
      }else {
        var or__3824__auto____7349 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____7349) {
          return or__3824__auto____7349
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
    var and__3822__auto____7354 = o;
    if(and__3822__auto____7354) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____7354
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____7355 = o == null ? null : o;
    return function() {
      var or__3824__auto____7356 = cljs.core._meta[goog.typeOf(x__2363__auto____7355)];
      if(or__3824__auto____7356) {
        return or__3824__auto____7356
      }else {
        var or__3824__auto____7357 = cljs.core._meta["_"];
        if(or__3824__auto____7357) {
          return or__3824__auto____7357
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
    var and__3822__auto____7362 = o;
    if(and__3822__auto____7362) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____7362
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____7363 = o == null ? null : o;
    return function() {
      var or__3824__auto____7364 = cljs.core._with_meta[goog.typeOf(x__2363__auto____7363)];
      if(or__3824__auto____7364) {
        return or__3824__auto____7364
      }else {
        var or__3824__auto____7365 = cljs.core._with_meta["_"];
        if(or__3824__auto____7365) {
          return or__3824__auto____7365
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
      var and__3822__auto____7374 = coll;
      if(and__3822__auto____7374) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____7374
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____7375 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7376 = cljs.core._reduce[goog.typeOf(x__2363__auto____7375)];
        if(or__3824__auto____7376) {
          return or__3824__auto____7376
        }else {
          var or__3824__auto____7377 = cljs.core._reduce["_"];
          if(or__3824__auto____7377) {
            return or__3824__auto____7377
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____7378 = coll;
      if(and__3822__auto____7378) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____7378
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____7379 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7380 = cljs.core._reduce[goog.typeOf(x__2363__auto____7379)];
        if(or__3824__auto____7380) {
          return or__3824__auto____7380
        }else {
          var or__3824__auto____7381 = cljs.core._reduce["_"];
          if(or__3824__auto____7381) {
            return or__3824__auto____7381
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
    var and__3822__auto____7386 = coll;
    if(and__3822__auto____7386) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____7386
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____7387 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7388 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____7387)];
      if(or__3824__auto____7388) {
        return or__3824__auto____7388
      }else {
        var or__3824__auto____7389 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____7389) {
          return or__3824__auto____7389
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
    var and__3822__auto____7394 = o;
    if(and__3822__auto____7394) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____7394
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____7395 = o == null ? null : o;
    return function() {
      var or__3824__auto____7396 = cljs.core._equiv[goog.typeOf(x__2363__auto____7395)];
      if(or__3824__auto____7396) {
        return or__3824__auto____7396
      }else {
        var or__3824__auto____7397 = cljs.core._equiv["_"];
        if(or__3824__auto____7397) {
          return or__3824__auto____7397
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
    var and__3822__auto____7402 = o;
    if(and__3822__auto____7402) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____7402
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____7403 = o == null ? null : o;
    return function() {
      var or__3824__auto____7404 = cljs.core._hash[goog.typeOf(x__2363__auto____7403)];
      if(or__3824__auto____7404) {
        return or__3824__auto____7404
      }else {
        var or__3824__auto____7405 = cljs.core._hash["_"];
        if(or__3824__auto____7405) {
          return or__3824__auto____7405
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
    var and__3822__auto____7410 = o;
    if(and__3822__auto____7410) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____7410
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____7411 = o == null ? null : o;
    return function() {
      var or__3824__auto____7412 = cljs.core._seq[goog.typeOf(x__2363__auto____7411)];
      if(or__3824__auto____7412) {
        return or__3824__auto____7412
      }else {
        var or__3824__auto____7413 = cljs.core._seq["_"];
        if(or__3824__auto____7413) {
          return or__3824__auto____7413
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
    var and__3822__auto____7418 = coll;
    if(and__3822__auto____7418) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____7418
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____7419 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7420 = cljs.core._rseq[goog.typeOf(x__2363__auto____7419)];
      if(or__3824__auto____7420) {
        return or__3824__auto____7420
      }else {
        var or__3824__auto____7421 = cljs.core._rseq["_"];
        if(or__3824__auto____7421) {
          return or__3824__auto____7421
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
    var and__3822__auto____7426 = coll;
    if(and__3822__auto____7426) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____7426
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____7427 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7428 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____7427)];
      if(or__3824__auto____7428) {
        return or__3824__auto____7428
      }else {
        var or__3824__auto____7429 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____7429) {
          return or__3824__auto____7429
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____7434 = coll;
    if(and__3822__auto____7434) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____7434
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____7435 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7436 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____7435)];
      if(or__3824__auto____7436) {
        return or__3824__auto____7436
      }else {
        var or__3824__auto____7437 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____7437) {
          return or__3824__auto____7437
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____7442 = coll;
    if(and__3822__auto____7442) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____7442
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____7443 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7444 = cljs.core._entry_key[goog.typeOf(x__2363__auto____7443)];
      if(or__3824__auto____7444) {
        return or__3824__auto____7444
      }else {
        var or__3824__auto____7445 = cljs.core._entry_key["_"];
        if(or__3824__auto____7445) {
          return or__3824__auto____7445
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____7450 = coll;
    if(and__3822__auto____7450) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____7450
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____7451 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7452 = cljs.core._comparator[goog.typeOf(x__2363__auto____7451)];
      if(or__3824__auto____7452) {
        return or__3824__auto____7452
      }else {
        var or__3824__auto____7453 = cljs.core._comparator["_"];
        if(or__3824__auto____7453) {
          return or__3824__auto____7453
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
    var and__3822__auto____7458 = o;
    if(and__3822__auto____7458) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____7458
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____7459 = o == null ? null : o;
    return function() {
      var or__3824__auto____7460 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____7459)];
      if(or__3824__auto____7460) {
        return or__3824__auto____7460
      }else {
        var or__3824__auto____7461 = cljs.core._pr_seq["_"];
        if(or__3824__auto____7461) {
          return or__3824__auto____7461
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
    var and__3822__auto____7466 = d;
    if(and__3822__auto____7466) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____7466
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____7467 = d == null ? null : d;
    return function() {
      var or__3824__auto____7468 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____7467)];
      if(or__3824__auto____7468) {
        return or__3824__auto____7468
      }else {
        var or__3824__auto____7469 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____7469) {
          return or__3824__auto____7469
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
    var and__3822__auto____7474 = this$;
    if(and__3822__auto____7474) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____7474
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____7475 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7476 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____7475)];
      if(or__3824__auto____7476) {
        return or__3824__auto____7476
      }else {
        var or__3824__auto____7477 = cljs.core._notify_watches["_"];
        if(or__3824__auto____7477) {
          return or__3824__auto____7477
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____7482 = this$;
    if(and__3822__auto____7482) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____7482
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____7483 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7484 = cljs.core._add_watch[goog.typeOf(x__2363__auto____7483)];
      if(or__3824__auto____7484) {
        return or__3824__auto____7484
      }else {
        var or__3824__auto____7485 = cljs.core._add_watch["_"];
        if(or__3824__auto____7485) {
          return or__3824__auto____7485
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____7490 = this$;
    if(and__3822__auto____7490) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____7490
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____7491 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7492 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____7491)];
      if(or__3824__auto____7492) {
        return or__3824__auto____7492
      }else {
        var or__3824__auto____7493 = cljs.core._remove_watch["_"];
        if(or__3824__auto____7493) {
          return or__3824__auto____7493
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
    var and__3822__auto____7498 = coll;
    if(and__3822__auto____7498) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____7498
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____7499 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7500 = cljs.core._as_transient[goog.typeOf(x__2363__auto____7499)];
      if(or__3824__auto____7500) {
        return or__3824__auto____7500
      }else {
        var or__3824__auto____7501 = cljs.core._as_transient["_"];
        if(or__3824__auto____7501) {
          return or__3824__auto____7501
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
    var and__3822__auto____7506 = tcoll;
    if(and__3822__auto____7506) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____7506
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____7507 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7508 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____7507)];
      if(or__3824__auto____7508) {
        return or__3824__auto____7508
      }else {
        var or__3824__auto____7509 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____7509) {
          return or__3824__auto____7509
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7514 = tcoll;
    if(and__3822__auto____7514) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____7514
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____7515 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7516 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____7515)];
      if(or__3824__auto____7516) {
        return or__3824__auto____7516
      }else {
        var or__3824__auto____7517 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____7517) {
          return or__3824__auto____7517
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
    var and__3822__auto____7522 = tcoll;
    if(and__3822__auto____7522) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____7522
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____7523 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7524 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____7523)];
      if(or__3824__auto____7524) {
        return or__3824__auto____7524
      }else {
        var or__3824__auto____7525 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____7525) {
          return or__3824__auto____7525
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
    var and__3822__auto____7530 = tcoll;
    if(and__3822__auto____7530) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____7530
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____7531 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7532 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____7531)];
      if(or__3824__auto____7532) {
        return or__3824__auto____7532
      }else {
        var or__3824__auto____7533 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____7533) {
          return or__3824__auto____7533
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
    var and__3822__auto____7538 = tcoll;
    if(and__3822__auto____7538) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____7538
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____7539 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7540 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____7539)];
      if(or__3824__auto____7540) {
        return or__3824__auto____7540
      }else {
        var or__3824__auto____7541 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____7541) {
          return or__3824__auto____7541
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7546 = tcoll;
    if(and__3822__auto____7546) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____7546
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____7547 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7548 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____7547)];
      if(or__3824__auto____7548) {
        return or__3824__auto____7548
      }else {
        var or__3824__auto____7549 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____7549) {
          return or__3824__auto____7549
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
    var and__3822__auto____7554 = tcoll;
    if(and__3822__auto____7554) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____7554
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____7555 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7556 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____7555)];
      if(or__3824__auto____7556) {
        return or__3824__auto____7556
      }else {
        var or__3824__auto____7557 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____7557) {
          return or__3824__auto____7557
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
    var and__3822__auto____7562 = x;
    if(and__3822__auto____7562) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____7562
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____7563 = x == null ? null : x;
    return function() {
      var or__3824__auto____7564 = cljs.core._compare[goog.typeOf(x__2363__auto____7563)];
      if(or__3824__auto____7564) {
        return or__3824__auto____7564
      }else {
        var or__3824__auto____7565 = cljs.core._compare["_"];
        if(or__3824__auto____7565) {
          return or__3824__auto____7565
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
    var and__3822__auto____7570 = coll;
    if(and__3822__auto____7570) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____7570
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____7571 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7572 = cljs.core._drop_first[goog.typeOf(x__2363__auto____7571)];
      if(or__3824__auto____7572) {
        return or__3824__auto____7572
      }else {
        var or__3824__auto____7573 = cljs.core._drop_first["_"];
        if(or__3824__auto____7573) {
          return or__3824__auto____7573
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
    var and__3822__auto____7578 = coll;
    if(and__3822__auto____7578) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____7578
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____7579 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7580 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____7579)];
      if(or__3824__auto____7580) {
        return or__3824__auto____7580
      }else {
        var or__3824__auto____7581 = cljs.core._chunked_first["_"];
        if(or__3824__auto____7581) {
          return or__3824__auto____7581
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____7586 = coll;
    if(and__3822__auto____7586) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____7586
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____7587 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7588 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____7587)];
      if(or__3824__auto____7588) {
        return or__3824__auto____7588
      }else {
        var or__3824__auto____7589 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____7589) {
          return or__3824__auto____7589
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
    var and__3822__auto____7594 = coll;
    if(and__3822__auto____7594) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____7594
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____7595 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7596 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____7595)];
      if(or__3824__auto____7596) {
        return or__3824__auto____7596
      }else {
        var or__3824__auto____7597 = cljs.core._chunked_next["_"];
        if(or__3824__auto____7597) {
          return or__3824__auto____7597
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
    var or__3824__auto____7599 = x === y;
    if(or__3824__auto____7599) {
      return or__3824__auto____7599
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__7600__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7601 = y;
            var G__7602 = cljs.core.first.call(null, more);
            var G__7603 = cljs.core.next.call(null, more);
            x = G__7601;
            y = G__7602;
            more = G__7603;
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
    var G__7600 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7600__delegate.call(this, x, y, more)
    };
    G__7600.cljs$lang$maxFixedArity = 2;
    G__7600.cljs$lang$applyTo = function(arglist__7604) {
      var x = cljs.core.first(arglist__7604);
      var y = cljs.core.first(cljs.core.next(arglist__7604));
      var more = cljs.core.rest(cljs.core.next(arglist__7604));
      return G__7600__delegate(x, y, more)
    };
    G__7600.cljs$lang$arity$variadic = G__7600__delegate;
    return G__7600
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
  var G__7605 = null;
  var G__7605__2 = function(o, k) {
    return null
  };
  var G__7605__3 = function(o, k, not_found) {
    return not_found
  };
  G__7605 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7605__2.call(this, o, k);
      case 3:
        return G__7605__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7605
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
  var G__7606 = null;
  var G__7606__2 = function(_, f) {
    return f.call(null)
  };
  var G__7606__3 = function(_, f, start) {
    return start
  };
  G__7606 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7606__2.call(this, _, f);
      case 3:
        return G__7606__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7606
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
  var G__7607 = null;
  var G__7607__2 = function(_, n) {
    return null
  };
  var G__7607__3 = function(_, n, not_found) {
    return not_found
  };
  G__7607 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7607__2.call(this, _, n);
      case 3:
        return G__7607__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7607
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
  var and__3822__auto____7608 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____7608) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____7608
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
    var cnt__7621 = cljs.core._count.call(null, cicoll);
    if(cnt__7621 === 0) {
      return f.call(null)
    }else {
      var val__7622 = cljs.core._nth.call(null, cicoll, 0);
      var n__7623 = 1;
      while(true) {
        if(n__7623 < cnt__7621) {
          var nval__7624 = f.call(null, val__7622, cljs.core._nth.call(null, cicoll, n__7623));
          if(cljs.core.reduced_QMARK_.call(null, nval__7624)) {
            return cljs.core.deref.call(null, nval__7624)
          }else {
            var G__7633 = nval__7624;
            var G__7634 = n__7623 + 1;
            val__7622 = G__7633;
            n__7623 = G__7634;
            continue
          }
        }else {
          return val__7622
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__7625 = cljs.core._count.call(null, cicoll);
    var val__7626 = val;
    var n__7627 = 0;
    while(true) {
      if(n__7627 < cnt__7625) {
        var nval__7628 = f.call(null, val__7626, cljs.core._nth.call(null, cicoll, n__7627));
        if(cljs.core.reduced_QMARK_.call(null, nval__7628)) {
          return cljs.core.deref.call(null, nval__7628)
        }else {
          var G__7635 = nval__7628;
          var G__7636 = n__7627 + 1;
          val__7626 = G__7635;
          n__7627 = G__7636;
          continue
        }
      }else {
        return val__7626
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__7629 = cljs.core._count.call(null, cicoll);
    var val__7630 = val;
    var n__7631 = idx;
    while(true) {
      if(n__7631 < cnt__7629) {
        var nval__7632 = f.call(null, val__7630, cljs.core._nth.call(null, cicoll, n__7631));
        if(cljs.core.reduced_QMARK_.call(null, nval__7632)) {
          return cljs.core.deref.call(null, nval__7632)
        }else {
          var G__7637 = nval__7632;
          var G__7638 = n__7631 + 1;
          val__7630 = G__7637;
          n__7631 = G__7638;
          continue
        }
      }else {
        return val__7630
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
    var cnt__7651 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__7652 = arr[0];
      var n__7653 = 1;
      while(true) {
        if(n__7653 < cnt__7651) {
          var nval__7654 = f.call(null, val__7652, arr[n__7653]);
          if(cljs.core.reduced_QMARK_.call(null, nval__7654)) {
            return cljs.core.deref.call(null, nval__7654)
          }else {
            var G__7663 = nval__7654;
            var G__7664 = n__7653 + 1;
            val__7652 = G__7663;
            n__7653 = G__7664;
            continue
          }
        }else {
          return val__7652
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__7655 = arr.length;
    var val__7656 = val;
    var n__7657 = 0;
    while(true) {
      if(n__7657 < cnt__7655) {
        var nval__7658 = f.call(null, val__7656, arr[n__7657]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7658)) {
          return cljs.core.deref.call(null, nval__7658)
        }else {
          var G__7665 = nval__7658;
          var G__7666 = n__7657 + 1;
          val__7656 = G__7665;
          n__7657 = G__7666;
          continue
        }
      }else {
        return val__7656
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__7659 = arr.length;
    var val__7660 = val;
    var n__7661 = idx;
    while(true) {
      if(n__7661 < cnt__7659) {
        var nval__7662 = f.call(null, val__7660, arr[n__7661]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7662)) {
          return cljs.core.deref.call(null, nval__7662)
        }else {
          var G__7667 = nval__7662;
          var G__7668 = n__7661 + 1;
          val__7660 = G__7667;
          n__7661 = G__7668;
          continue
        }
      }else {
        return val__7660
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
  var this__7669 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__7670 = this;
  if(this__7670.i + 1 < this__7670.a.length) {
    return new cljs.core.IndexedSeq(this__7670.a, this__7670.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7671 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__7672 = this;
  var c__7673 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__7673 > 0) {
    return new cljs.core.RSeq(coll, c__7673 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__7674 = this;
  var this__7675 = this;
  return cljs.core.pr_str.call(null, this__7675)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7676 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7676.a)) {
    return cljs.core.ci_reduce.call(null, this__7676.a, f, this__7676.a[this__7676.i], this__7676.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__7676.a[this__7676.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7677 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7677.a)) {
    return cljs.core.ci_reduce.call(null, this__7677.a, f, start, this__7677.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7678 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7679 = this;
  return this__7679.a.length - this__7679.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__7680 = this;
  return this__7680.a[this__7680.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__7681 = this;
  if(this__7681.i + 1 < this__7681.a.length) {
    return new cljs.core.IndexedSeq(this__7681.a, this__7681.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7682 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7683 = this;
  var i__7684 = n + this__7683.i;
  if(i__7684 < this__7683.a.length) {
    return this__7683.a[i__7684]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7685 = this;
  var i__7686 = n + this__7685.i;
  if(i__7686 < this__7685.a.length) {
    return this__7685.a[i__7686]
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
  var G__7687 = null;
  var G__7687__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__7687__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__7687 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7687__2.call(this, array, f);
      case 3:
        return G__7687__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7687
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__7688 = null;
  var G__7688__2 = function(array, k) {
    return array[k]
  };
  var G__7688__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__7688 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7688__2.call(this, array, k);
      case 3:
        return G__7688__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7688
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__7689 = null;
  var G__7689__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__7689__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__7689 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7689__2.call(this, array, n);
      case 3:
        return G__7689__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7689
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
  var this__7690 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7691 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__7692 = this;
  var this__7693 = this;
  return cljs.core.pr_str.call(null, this__7693)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7694 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7695 = this;
  return this__7695.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7696 = this;
  return cljs.core._nth.call(null, this__7696.ci, this__7696.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7697 = this;
  if(this__7697.i > 0) {
    return new cljs.core.RSeq(this__7697.ci, this__7697.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7698 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__7699 = this;
  return new cljs.core.RSeq(this__7699.ci, this__7699.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7700 = this;
  return this__7700.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7704__7705 = coll;
      if(G__7704__7705) {
        if(function() {
          var or__3824__auto____7706 = G__7704__7705.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____7706) {
            return or__3824__auto____7706
          }else {
            return G__7704__7705.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__7704__7705.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7704__7705)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7704__7705)
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
      var G__7711__7712 = coll;
      if(G__7711__7712) {
        if(function() {
          var or__3824__auto____7713 = G__7711__7712.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7713) {
            return or__3824__auto____7713
          }else {
            return G__7711__7712.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7711__7712.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7711__7712)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7711__7712)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__7714 = cljs.core.seq.call(null, coll);
      if(s__7714 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__7714)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__7719__7720 = coll;
      if(G__7719__7720) {
        if(function() {
          var or__3824__auto____7721 = G__7719__7720.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7721) {
            return or__3824__auto____7721
          }else {
            return G__7719__7720.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7719__7720.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7719__7720)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7719__7720)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__7722 = cljs.core.seq.call(null, coll);
      if(!(s__7722 == null)) {
        return cljs.core._rest.call(null, s__7722)
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
      var G__7726__7727 = coll;
      if(G__7726__7727) {
        if(function() {
          var or__3824__auto____7728 = G__7726__7727.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____7728) {
            return or__3824__auto____7728
          }else {
            return G__7726__7727.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__7726__7727.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7726__7727)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7726__7727)
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
    var sn__7730 = cljs.core.next.call(null, s);
    if(!(sn__7730 == null)) {
      var G__7731 = sn__7730;
      s = G__7731;
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
    var G__7732__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__7733 = conj.call(null, coll, x);
          var G__7734 = cljs.core.first.call(null, xs);
          var G__7735 = cljs.core.next.call(null, xs);
          coll = G__7733;
          x = G__7734;
          xs = G__7735;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__7732 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7732__delegate.call(this, coll, x, xs)
    };
    G__7732.cljs$lang$maxFixedArity = 2;
    G__7732.cljs$lang$applyTo = function(arglist__7736) {
      var coll = cljs.core.first(arglist__7736);
      var x = cljs.core.first(cljs.core.next(arglist__7736));
      var xs = cljs.core.rest(cljs.core.next(arglist__7736));
      return G__7732__delegate(coll, x, xs)
    };
    G__7732.cljs$lang$arity$variadic = G__7732__delegate;
    return G__7732
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
  var s__7739 = cljs.core.seq.call(null, coll);
  var acc__7740 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__7739)) {
      return acc__7740 + cljs.core._count.call(null, s__7739)
    }else {
      var G__7741 = cljs.core.next.call(null, s__7739);
      var G__7742 = acc__7740 + 1;
      s__7739 = G__7741;
      acc__7740 = G__7742;
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
        var G__7749__7750 = coll;
        if(G__7749__7750) {
          if(function() {
            var or__3824__auto____7751 = G__7749__7750.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7751) {
              return or__3824__auto____7751
            }else {
              return G__7749__7750.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7749__7750.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7749__7750)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7749__7750)
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
        var G__7752__7753 = coll;
        if(G__7752__7753) {
          if(function() {
            var or__3824__auto____7754 = G__7752__7753.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7754) {
              return or__3824__auto____7754
            }else {
              return G__7752__7753.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7752__7753.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7752__7753)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7752__7753)
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
    var G__7757__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__7756 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__7758 = ret__7756;
          var G__7759 = cljs.core.first.call(null, kvs);
          var G__7760 = cljs.core.second.call(null, kvs);
          var G__7761 = cljs.core.nnext.call(null, kvs);
          coll = G__7758;
          k = G__7759;
          v = G__7760;
          kvs = G__7761;
          continue
        }else {
          return ret__7756
        }
        break
      }
    };
    var G__7757 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7757__delegate.call(this, coll, k, v, kvs)
    };
    G__7757.cljs$lang$maxFixedArity = 3;
    G__7757.cljs$lang$applyTo = function(arglist__7762) {
      var coll = cljs.core.first(arglist__7762);
      var k = cljs.core.first(cljs.core.next(arglist__7762));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7762)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7762)));
      return G__7757__delegate(coll, k, v, kvs)
    };
    G__7757.cljs$lang$arity$variadic = G__7757__delegate;
    return G__7757
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
    var G__7765__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7764 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7766 = ret__7764;
          var G__7767 = cljs.core.first.call(null, ks);
          var G__7768 = cljs.core.next.call(null, ks);
          coll = G__7766;
          k = G__7767;
          ks = G__7768;
          continue
        }else {
          return ret__7764
        }
        break
      }
    };
    var G__7765 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7765__delegate.call(this, coll, k, ks)
    };
    G__7765.cljs$lang$maxFixedArity = 2;
    G__7765.cljs$lang$applyTo = function(arglist__7769) {
      var coll = cljs.core.first(arglist__7769);
      var k = cljs.core.first(cljs.core.next(arglist__7769));
      var ks = cljs.core.rest(cljs.core.next(arglist__7769));
      return G__7765__delegate(coll, k, ks)
    };
    G__7765.cljs$lang$arity$variadic = G__7765__delegate;
    return G__7765
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
    var G__7773__7774 = o;
    if(G__7773__7774) {
      if(function() {
        var or__3824__auto____7775 = G__7773__7774.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____7775) {
          return or__3824__auto____7775
        }else {
          return G__7773__7774.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7773__7774.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7773__7774)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7773__7774)
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
    var G__7778__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7777 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7779 = ret__7777;
          var G__7780 = cljs.core.first.call(null, ks);
          var G__7781 = cljs.core.next.call(null, ks);
          coll = G__7779;
          k = G__7780;
          ks = G__7781;
          continue
        }else {
          return ret__7777
        }
        break
      }
    };
    var G__7778 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7778__delegate.call(this, coll, k, ks)
    };
    G__7778.cljs$lang$maxFixedArity = 2;
    G__7778.cljs$lang$applyTo = function(arglist__7782) {
      var coll = cljs.core.first(arglist__7782);
      var k = cljs.core.first(cljs.core.next(arglist__7782));
      var ks = cljs.core.rest(cljs.core.next(arglist__7782));
      return G__7778__delegate(coll, k, ks)
    };
    G__7778.cljs$lang$arity$variadic = G__7778__delegate;
    return G__7778
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
  var h__7784 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__7784;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__7784
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__7786 = cljs.core.string_hash_cache[k];
  if(!(h__7786 == null)) {
    return h__7786
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
      var and__3822__auto____7788 = goog.isString(o);
      if(and__3822__auto____7788) {
        return check_cache
      }else {
        return and__3822__auto____7788
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
    var G__7792__7793 = x;
    if(G__7792__7793) {
      if(function() {
        var or__3824__auto____7794 = G__7792__7793.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____7794) {
          return or__3824__auto____7794
        }else {
          return G__7792__7793.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__7792__7793.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7792__7793)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7792__7793)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7798__7799 = x;
    if(G__7798__7799) {
      if(function() {
        var or__3824__auto____7800 = G__7798__7799.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____7800) {
          return or__3824__auto____7800
        }else {
          return G__7798__7799.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__7798__7799.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7798__7799)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7798__7799)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__7804__7805 = x;
  if(G__7804__7805) {
    if(function() {
      var or__3824__auto____7806 = G__7804__7805.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____7806) {
        return or__3824__auto____7806
      }else {
        return G__7804__7805.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__7804__7805.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7804__7805)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7804__7805)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__7810__7811 = x;
  if(G__7810__7811) {
    if(function() {
      var or__3824__auto____7812 = G__7810__7811.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____7812) {
        return or__3824__auto____7812
      }else {
        return G__7810__7811.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__7810__7811.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7810__7811)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7810__7811)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__7816__7817 = x;
  if(G__7816__7817) {
    if(function() {
      var or__3824__auto____7818 = G__7816__7817.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____7818) {
        return or__3824__auto____7818
      }else {
        return G__7816__7817.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__7816__7817.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7816__7817)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7816__7817)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__7822__7823 = x;
  if(G__7822__7823) {
    if(function() {
      var or__3824__auto____7824 = G__7822__7823.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____7824) {
        return or__3824__auto____7824
      }else {
        return G__7822__7823.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__7822__7823.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7822__7823)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7822__7823)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__7828__7829 = x;
  if(G__7828__7829) {
    if(function() {
      var or__3824__auto____7830 = G__7828__7829.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____7830) {
        return or__3824__auto____7830
      }else {
        return G__7828__7829.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__7828__7829.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7828__7829)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7828__7829)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7834__7835 = x;
    if(G__7834__7835) {
      if(function() {
        var or__3824__auto____7836 = G__7834__7835.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____7836) {
          return or__3824__auto____7836
        }else {
          return G__7834__7835.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7834__7835.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7834__7835)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7834__7835)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7840__7841 = x;
  if(G__7840__7841) {
    if(function() {
      var or__3824__auto____7842 = G__7840__7841.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____7842) {
        return or__3824__auto____7842
      }else {
        return G__7840__7841.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7840__7841.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7840__7841)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7840__7841)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7846__7847 = x;
  if(G__7846__7847) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____7848 = null;
      if(cljs.core.truth_(or__3824__auto____7848)) {
        return or__3824__auto____7848
      }else {
        return G__7846__7847.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__7846__7847.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7846__7847)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7846__7847)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7849__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7849 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7849__delegate.call(this, keyvals)
    };
    G__7849.cljs$lang$maxFixedArity = 0;
    G__7849.cljs$lang$applyTo = function(arglist__7850) {
      var keyvals = cljs.core.seq(arglist__7850);
      return G__7849__delegate(keyvals)
    };
    G__7849.cljs$lang$arity$variadic = G__7849__delegate;
    return G__7849
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
  var keys__7852 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7852.push(key)
  });
  return keys__7852
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7856 = i;
  var j__7857 = j;
  var len__7858 = len;
  while(true) {
    if(len__7858 === 0) {
      return to
    }else {
      to[j__7857] = from[i__7856];
      var G__7859 = i__7856 + 1;
      var G__7860 = j__7857 + 1;
      var G__7861 = len__7858 - 1;
      i__7856 = G__7859;
      j__7857 = G__7860;
      len__7858 = G__7861;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7865 = i + (len - 1);
  var j__7866 = j + (len - 1);
  var len__7867 = len;
  while(true) {
    if(len__7867 === 0) {
      return to
    }else {
      to[j__7866] = from[i__7865];
      var G__7868 = i__7865 - 1;
      var G__7869 = j__7866 - 1;
      var G__7870 = len__7867 - 1;
      i__7865 = G__7868;
      j__7866 = G__7869;
      len__7867 = G__7870;
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
    var G__7874__7875 = s;
    if(G__7874__7875) {
      if(function() {
        var or__3824__auto____7876 = G__7874__7875.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7876) {
          return or__3824__auto____7876
        }else {
          return G__7874__7875.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7874__7875.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7874__7875)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7874__7875)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7880__7881 = s;
  if(G__7880__7881) {
    if(function() {
      var or__3824__auto____7882 = G__7880__7881.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7882) {
        return or__3824__auto____7882
      }else {
        return G__7880__7881.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7880__7881.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7880__7881)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7880__7881)
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
  var and__3822__auto____7885 = goog.isString(x);
  if(and__3822__auto____7885) {
    return!function() {
      var or__3824__auto____7886 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7886) {
        return or__3824__auto____7886
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7885
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7888 = goog.isString(x);
  if(and__3822__auto____7888) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7888
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7890 = goog.isString(x);
  if(and__3822__auto____7890) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7890
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7895 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7895) {
    return or__3824__auto____7895
  }else {
    var G__7896__7897 = f;
    if(G__7896__7897) {
      if(function() {
        var or__3824__auto____7898 = G__7896__7897.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7898) {
          return or__3824__auto____7898
        }else {
          return G__7896__7897.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7896__7897.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7896__7897)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7896__7897)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7900 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7900) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7900
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
    var and__3822__auto____7903 = coll;
    if(cljs.core.truth_(and__3822__auto____7903)) {
      var and__3822__auto____7904 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7904) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7904
      }
    }else {
      return and__3822__auto____7903
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
    var G__7913__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7909 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7910 = more;
        while(true) {
          var x__7911 = cljs.core.first.call(null, xs__7910);
          var etc__7912 = cljs.core.next.call(null, xs__7910);
          if(cljs.core.truth_(xs__7910)) {
            if(cljs.core.contains_QMARK_.call(null, s__7909, x__7911)) {
              return false
            }else {
              var G__7914 = cljs.core.conj.call(null, s__7909, x__7911);
              var G__7915 = etc__7912;
              s__7909 = G__7914;
              xs__7910 = G__7915;
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
    var G__7913 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7913__delegate.call(this, x, y, more)
    };
    G__7913.cljs$lang$maxFixedArity = 2;
    G__7913.cljs$lang$applyTo = function(arglist__7916) {
      var x = cljs.core.first(arglist__7916);
      var y = cljs.core.first(cljs.core.next(arglist__7916));
      var more = cljs.core.rest(cljs.core.next(arglist__7916));
      return G__7913__delegate(x, y, more)
    };
    G__7913.cljs$lang$arity$variadic = G__7913__delegate;
    return G__7913
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
            var G__7920__7921 = x;
            if(G__7920__7921) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7922 = null;
                if(cljs.core.truth_(or__3824__auto____7922)) {
                  return or__3824__auto____7922
                }else {
                  return G__7920__7921.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7920__7921.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7920__7921)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7920__7921)
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
    var xl__7927 = cljs.core.count.call(null, xs);
    var yl__7928 = cljs.core.count.call(null, ys);
    if(xl__7927 < yl__7928) {
      return-1
    }else {
      if(xl__7927 > yl__7928) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7927, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7929 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7930 = d__7929 === 0;
        if(and__3822__auto____7930) {
          return n + 1 < len
        }else {
          return and__3822__auto____7930
        }
      }()) {
        var G__7931 = xs;
        var G__7932 = ys;
        var G__7933 = len;
        var G__7934 = n + 1;
        xs = G__7931;
        ys = G__7932;
        len = G__7933;
        n = G__7934;
        continue
      }else {
        return d__7929
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
      var r__7936 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7936)) {
        return r__7936
      }else {
        if(cljs.core.truth_(r__7936)) {
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
      var a__7938 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7938, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7938)
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
    var temp__3971__auto____7944 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7944) {
      var s__7945 = temp__3971__auto____7944;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7945), cljs.core.next.call(null, s__7945))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7946 = val;
    var coll__7947 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7947) {
        var nval__7948 = f.call(null, val__7946, cljs.core.first.call(null, coll__7947));
        if(cljs.core.reduced_QMARK_.call(null, nval__7948)) {
          return cljs.core.deref.call(null, nval__7948)
        }else {
          var G__7949 = nval__7948;
          var G__7950 = cljs.core.next.call(null, coll__7947);
          val__7946 = G__7949;
          coll__7947 = G__7950;
          continue
        }
      }else {
        return val__7946
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
  var a__7952 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7952);
  return cljs.core.vec.call(null, a__7952)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7959__7960 = coll;
      if(G__7959__7960) {
        if(function() {
          var or__3824__auto____7961 = G__7959__7960.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7961) {
            return or__3824__auto____7961
          }else {
            return G__7959__7960.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7959__7960.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7959__7960)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7959__7960)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7962__7963 = coll;
      if(G__7962__7963) {
        if(function() {
          var or__3824__auto____7964 = G__7962__7963.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7964) {
            return or__3824__auto____7964
          }else {
            return G__7962__7963.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7962__7963.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7962__7963)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7962__7963)
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
  var this__7965 = this;
  return this__7965.val
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
    var G__7966__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7966 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7966__delegate.call(this, x, y, more)
    };
    G__7966.cljs$lang$maxFixedArity = 2;
    G__7966.cljs$lang$applyTo = function(arglist__7967) {
      var x = cljs.core.first(arglist__7967);
      var y = cljs.core.first(cljs.core.next(arglist__7967));
      var more = cljs.core.rest(cljs.core.next(arglist__7967));
      return G__7966__delegate(x, y, more)
    };
    G__7966.cljs$lang$arity$variadic = G__7966__delegate;
    return G__7966
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
    var G__7968__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7968 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7968__delegate.call(this, x, y, more)
    };
    G__7968.cljs$lang$maxFixedArity = 2;
    G__7968.cljs$lang$applyTo = function(arglist__7969) {
      var x = cljs.core.first(arglist__7969);
      var y = cljs.core.first(cljs.core.next(arglist__7969));
      var more = cljs.core.rest(cljs.core.next(arglist__7969));
      return G__7968__delegate(x, y, more)
    };
    G__7968.cljs$lang$arity$variadic = G__7968__delegate;
    return G__7968
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
    var G__7970__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7970 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7970__delegate.call(this, x, y, more)
    };
    G__7970.cljs$lang$maxFixedArity = 2;
    G__7970.cljs$lang$applyTo = function(arglist__7971) {
      var x = cljs.core.first(arglist__7971);
      var y = cljs.core.first(cljs.core.next(arglist__7971));
      var more = cljs.core.rest(cljs.core.next(arglist__7971));
      return G__7970__delegate(x, y, more)
    };
    G__7970.cljs$lang$arity$variadic = G__7970__delegate;
    return G__7970
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
    var G__7972__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7972 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7972__delegate.call(this, x, y, more)
    };
    G__7972.cljs$lang$maxFixedArity = 2;
    G__7972.cljs$lang$applyTo = function(arglist__7973) {
      var x = cljs.core.first(arglist__7973);
      var y = cljs.core.first(cljs.core.next(arglist__7973));
      var more = cljs.core.rest(cljs.core.next(arglist__7973));
      return G__7972__delegate(x, y, more)
    };
    G__7972.cljs$lang$arity$variadic = G__7972__delegate;
    return G__7972
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
    var G__7974__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7975 = y;
            var G__7976 = cljs.core.first.call(null, more);
            var G__7977 = cljs.core.next.call(null, more);
            x = G__7975;
            y = G__7976;
            more = G__7977;
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
    var G__7974 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7974__delegate.call(this, x, y, more)
    };
    G__7974.cljs$lang$maxFixedArity = 2;
    G__7974.cljs$lang$applyTo = function(arglist__7978) {
      var x = cljs.core.first(arglist__7978);
      var y = cljs.core.first(cljs.core.next(arglist__7978));
      var more = cljs.core.rest(cljs.core.next(arglist__7978));
      return G__7974__delegate(x, y, more)
    };
    G__7974.cljs$lang$arity$variadic = G__7974__delegate;
    return G__7974
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
    var G__7979__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7980 = y;
            var G__7981 = cljs.core.first.call(null, more);
            var G__7982 = cljs.core.next.call(null, more);
            x = G__7980;
            y = G__7981;
            more = G__7982;
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
    var G__7979 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7979__delegate.call(this, x, y, more)
    };
    G__7979.cljs$lang$maxFixedArity = 2;
    G__7979.cljs$lang$applyTo = function(arglist__7983) {
      var x = cljs.core.first(arglist__7983);
      var y = cljs.core.first(cljs.core.next(arglist__7983));
      var more = cljs.core.rest(cljs.core.next(arglist__7983));
      return G__7979__delegate(x, y, more)
    };
    G__7979.cljs$lang$arity$variadic = G__7979__delegate;
    return G__7979
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
    var G__7984__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7985 = y;
            var G__7986 = cljs.core.first.call(null, more);
            var G__7987 = cljs.core.next.call(null, more);
            x = G__7985;
            y = G__7986;
            more = G__7987;
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
    var G__7984 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7984__delegate.call(this, x, y, more)
    };
    G__7984.cljs$lang$maxFixedArity = 2;
    G__7984.cljs$lang$applyTo = function(arglist__7988) {
      var x = cljs.core.first(arglist__7988);
      var y = cljs.core.first(cljs.core.next(arglist__7988));
      var more = cljs.core.rest(cljs.core.next(arglist__7988));
      return G__7984__delegate(x, y, more)
    };
    G__7984.cljs$lang$arity$variadic = G__7984__delegate;
    return G__7984
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
    var G__7989__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7990 = y;
            var G__7991 = cljs.core.first.call(null, more);
            var G__7992 = cljs.core.next.call(null, more);
            x = G__7990;
            y = G__7991;
            more = G__7992;
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
    var G__7989 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7989__delegate.call(this, x, y, more)
    };
    G__7989.cljs$lang$maxFixedArity = 2;
    G__7989.cljs$lang$applyTo = function(arglist__7993) {
      var x = cljs.core.first(arglist__7993);
      var y = cljs.core.first(cljs.core.next(arglist__7993));
      var more = cljs.core.rest(cljs.core.next(arglist__7993));
      return G__7989__delegate(x, y, more)
    };
    G__7989.cljs$lang$arity$variadic = G__7989__delegate;
    return G__7989
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
    var G__7994__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7994 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7994__delegate.call(this, x, y, more)
    };
    G__7994.cljs$lang$maxFixedArity = 2;
    G__7994.cljs$lang$applyTo = function(arglist__7995) {
      var x = cljs.core.first(arglist__7995);
      var y = cljs.core.first(cljs.core.next(arglist__7995));
      var more = cljs.core.rest(cljs.core.next(arglist__7995));
      return G__7994__delegate(x, y, more)
    };
    G__7994.cljs$lang$arity$variadic = G__7994__delegate;
    return G__7994
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
    var G__7996__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7996 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7996__delegate.call(this, x, y, more)
    };
    G__7996.cljs$lang$maxFixedArity = 2;
    G__7996.cljs$lang$applyTo = function(arglist__7997) {
      var x = cljs.core.first(arglist__7997);
      var y = cljs.core.first(cljs.core.next(arglist__7997));
      var more = cljs.core.rest(cljs.core.next(arglist__7997));
      return G__7996__delegate(x, y, more)
    };
    G__7996.cljs$lang$arity$variadic = G__7996__delegate;
    return G__7996
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
  var rem__7999 = n % d;
  return cljs.core.fix.call(null, (n - rem__7999) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__8001 = cljs.core.quot.call(null, n, d);
  return n - d * q__8001
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
  var v__8004 = v - (v >> 1 & 1431655765);
  var v__8005 = (v__8004 & 858993459) + (v__8004 >> 2 & 858993459);
  return(v__8005 + (v__8005 >> 4) & 252645135) * 16843009 >> 24
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
    var G__8006__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__8007 = y;
            var G__8008 = cljs.core.first.call(null, more);
            var G__8009 = cljs.core.next.call(null, more);
            x = G__8007;
            y = G__8008;
            more = G__8009;
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
    var G__8006 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8006__delegate.call(this, x, y, more)
    };
    G__8006.cljs$lang$maxFixedArity = 2;
    G__8006.cljs$lang$applyTo = function(arglist__8010) {
      var x = cljs.core.first(arglist__8010);
      var y = cljs.core.first(cljs.core.next(arglist__8010));
      var more = cljs.core.rest(cljs.core.next(arglist__8010));
      return G__8006__delegate(x, y, more)
    };
    G__8006.cljs$lang$arity$variadic = G__8006__delegate;
    return G__8006
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
  var n__8014 = n;
  var xs__8015 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____8016 = xs__8015;
      if(and__3822__auto____8016) {
        return n__8014 > 0
      }else {
        return and__3822__auto____8016
      }
    }())) {
      var G__8017 = n__8014 - 1;
      var G__8018 = cljs.core.next.call(null, xs__8015);
      n__8014 = G__8017;
      xs__8015 = G__8018;
      continue
    }else {
      return xs__8015
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
    var G__8019__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__8020 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__8021 = cljs.core.next.call(null, more);
            sb = G__8020;
            more = G__8021;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__8019 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8019__delegate.call(this, x, ys)
    };
    G__8019.cljs$lang$maxFixedArity = 1;
    G__8019.cljs$lang$applyTo = function(arglist__8022) {
      var x = cljs.core.first(arglist__8022);
      var ys = cljs.core.rest(arglist__8022);
      return G__8019__delegate(x, ys)
    };
    G__8019.cljs$lang$arity$variadic = G__8019__delegate;
    return G__8019
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
    var G__8023__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__8024 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__8025 = cljs.core.next.call(null, more);
            sb = G__8024;
            more = G__8025;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__8023 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8023__delegate.call(this, x, ys)
    };
    G__8023.cljs$lang$maxFixedArity = 1;
    G__8023.cljs$lang$applyTo = function(arglist__8026) {
      var x = cljs.core.first(arglist__8026);
      var ys = cljs.core.rest(arglist__8026);
      return G__8023__delegate(x, ys)
    };
    G__8023.cljs$lang$arity$variadic = G__8023__delegate;
    return G__8023
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
  format.cljs$lang$applyTo = function(arglist__8027) {
    var fmt = cljs.core.first(arglist__8027);
    var args = cljs.core.rest(arglist__8027);
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
    var xs__8030 = cljs.core.seq.call(null, x);
    var ys__8031 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__8030 == null) {
        return ys__8031 == null
      }else {
        if(ys__8031 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__8030), cljs.core.first.call(null, ys__8031))) {
            var G__8032 = cljs.core.next.call(null, xs__8030);
            var G__8033 = cljs.core.next.call(null, ys__8031);
            xs__8030 = G__8032;
            ys__8031 = G__8033;
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
  return cljs.core.reduce.call(null, function(p1__8034_SHARP_, p2__8035_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__8034_SHARP_, cljs.core.hash.call(null, p2__8035_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__8039 = 0;
  var s__8040 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__8040) {
      var e__8041 = cljs.core.first.call(null, s__8040);
      var G__8042 = (h__8039 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__8041)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__8041)))) % 4503599627370496;
      var G__8043 = cljs.core.next.call(null, s__8040);
      h__8039 = G__8042;
      s__8040 = G__8043;
      continue
    }else {
      return h__8039
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__8047 = 0;
  var s__8048 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__8048) {
      var e__8049 = cljs.core.first.call(null, s__8048);
      var G__8050 = (h__8047 + cljs.core.hash.call(null, e__8049)) % 4503599627370496;
      var G__8051 = cljs.core.next.call(null, s__8048);
      h__8047 = G__8050;
      s__8048 = G__8051;
      continue
    }else {
      return h__8047
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__8072__8073 = cljs.core.seq.call(null, fn_map);
  if(G__8072__8073) {
    var G__8075__8077 = cljs.core.first.call(null, G__8072__8073);
    var vec__8076__8078 = G__8075__8077;
    var key_name__8079 = cljs.core.nth.call(null, vec__8076__8078, 0, null);
    var f__8080 = cljs.core.nth.call(null, vec__8076__8078, 1, null);
    var G__8072__8081 = G__8072__8073;
    var G__8075__8082 = G__8075__8077;
    var G__8072__8083 = G__8072__8081;
    while(true) {
      var vec__8084__8085 = G__8075__8082;
      var key_name__8086 = cljs.core.nth.call(null, vec__8084__8085, 0, null);
      var f__8087 = cljs.core.nth.call(null, vec__8084__8085, 1, null);
      var G__8072__8088 = G__8072__8083;
      var str_name__8089 = cljs.core.name.call(null, key_name__8086);
      obj[str_name__8089] = f__8087;
      var temp__3974__auto____8090 = cljs.core.next.call(null, G__8072__8088);
      if(temp__3974__auto____8090) {
        var G__8072__8091 = temp__3974__auto____8090;
        var G__8092 = cljs.core.first.call(null, G__8072__8091);
        var G__8093 = G__8072__8091;
        G__8075__8082 = G__8092;
        G__8072__8083 = G__8093;
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
  var this__8094 = this;
  var h__2192__auto____8095 = this__8094.__hash;
  if(!(h__2192__auto____8095 == null)) {
    return h__2192__auto____8095
  }else {
    var h__2192__auto____8096 = cljs.core.hash_coll.call(null, coll);
    this__8094.__hash = h__2192__auto____8096;
    return h__2192__auto____8096
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8097 = this;
  if(this__8097.count === 1) {
    return null
  }else {
    return this__8097.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8098 = this;
  return new cljs.core.List(this__8098.meta, o, coll, this__8098.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__8099 = this;
  var this__8100 = this;
  return cljs.core.pr_str.call(null, this__8100)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8101 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8102 = this;
  return this__8102.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8103 = this;
  return this__8103.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8104 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8105 = this;
  return this__8105.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8106 = this;
  if(this__8106.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__8106.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8107 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8108 = this;
  return new cljs.core.List(meta, this__8108.first, this__8108.rest, this__8108.count, this__8108.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8109 = this;
  return this__8109.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8110 = this;
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
  var this__8111 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8112 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8113 = this;
  return new cljs.core.List(this__8113.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__8114 = this;
  var this__8115 = this;
  return cljs.core.pr_str.call(null, this__8115)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8116 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8117 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8118 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8119 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8120 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8121 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8122 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8123 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8124 = this;
  return this__8124.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8125 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__8129__8130 = coll;
  if(G__8129__8130) {
    if(function() {
      var or__3824__auto____8131 = G__8129__8130.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____8131) {
        return or__3824__auto____8131
      }else {
        return G__8129__8130.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__8129__8130.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__8129__8130)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__8129__8130)
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
    var G__8132__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__8132 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8132__delegate.call(this, x, y, z, items)
    };
    G__8132.cljs$lang$maxFixedArity = 3;
    G__8132.cljs$lang$applyTo = function(arglist__8133) {
      var x = cljs.core.first(arglist__8133);
      var y = cljs.core.first(cljs.core.next(arglist__8133));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8133)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8133)));
      return G__8132__delegate(x, y, z, items)
    };
    G__8132.cljs$lang$arity$variadic = G__8132__delegate;
    return G__8132
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
  var this__8134 = this;
  var h__2192__auto____8135 = this__8134.__hash;
  if(!(h__2192__auto____8135 == null)) {
    return h__2192__auto____8135
  }else {
    var h__2192__auto____8136 = cljs.core.hash_coll.call(null, coll);
    this__8134.__hash = h__2192__auto____8136;
    return h__2192__auto____8136
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8137 = this;
  if(this__8137.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__8137.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8138 = this;
  return new cljs.core.Cons(null, o, coll, this__8138.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__8139 = this;
  var this__8140 = this;
  return cljs.core.pr_str.call(null, this__8140)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8141 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8142 = this;
  return this__8142.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8143 = this;
  if(this__8143.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__8143.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8144 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8145 = this;
  return new cljs.core.Cons(meta, this__8145.first, this__8145.rest, this__8145.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8146 = this;
  return this__8146.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8147 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8147.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____8152 = coll == null;
    if(or__3824__auto____8152) {
      return or__3824__auto____8152
    }else {
      var G__8153__8154 = coll;
      if(G__8153__8154) {
        if(function() {
          var or__3824__auto____8155 = G__8153__8154.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____8155) {
            return or__3824__auto____8155
          }else {
            return G__8153__8154.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__8153__8154.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8153__8154)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8153__8154)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__8159__8160 = x;
  if(G__8159__8160) {
    if(function() {
      var or__3824__auto____8161 = G__8159__8160.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____8161) {
        return or__3824__auto____8161
      }else {
        return G__8159__8160.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__8159__8160.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__8159__8160)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__8159__8160)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__8162 = null;
  var G__8162__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__8162__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__8162 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8162__2.call(this, string, f);
      case 3:
        return G__8162__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8162
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__8163 = null;
  var G__8163__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__8163__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__8163 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8163__2.call(this, string, k);
      case 3:
        return G__8163__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8163
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__8164 = null;
  var G__8164__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__8164__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__8164 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8164__2.call(this, string, n);
      case 3:
        return G__8164__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8164
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
  var G__8176 = null;
  var G__8176__2 = function(this_sym8167, coll) {
    var this__8169 = this;
    var this_sym8167__8170 = this;
    var ___8171 = this_sym8167__8170;
    if(coll == null) {
      return null
    }else {
      var strobj__8172 = coll.strobj;
      if(strobj__8172 == null) {
        return cljs.core._lookup.call(null, coll, this__8169.k, null)
      }else {
        return strobj__8172[this__8169.k]
      }
    }
  };
  var G__8176__3 = function(this_sym8168, coll, not_found) {
    var this__8169 = this;
    var this_sym8168__8173 = this;
    var ___8174 = this_sym8168__8173;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__8169.k, not_found)
    }
  };
  G__8176 = function(this_sym8168, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8176__2.call(this, this_sym8168, coll);
      case 3:
        return G__8176__3.call(this, this_sym8168, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8176
}();
cljs.core.Keyword.prototype.apply = function(this_sym8165, args8166) {
  var this__8175 = this;
  return this_sym8165.call.apply(this_sym8165, [this_sym8165].concat(args8166.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__8185 = null;
  var G__8185__2 = function(this_sym8179, coll) {
    var this_sym8179__8181 = this;
    var this__8182 = this_sym8179__8181;
    return cljs.core._lookup.call(null, coll, this__8182.toString(), null)
  };
  var G__8185__3 = function(this_sym8180, coll, not_found) {
    var this_sym8180__8183 = this;
    var this__8184 = this_sym8180__8183;
    return cljs.core._lookup.call(null, coll, this__8184.toString(), not_found)
  };
  G__8185 = function(this_sym8180, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8185__2.call(this, this_sym8180, coll);
      case 3:
        return G__8185__3.call(this, this_sym8180, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8185
}();
String.prototype.apply = function(this_sym8177, args8178) {
  return this_sym8177.call.apply(this_sym8177, [this_sym8177].concat(args8178.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__8187 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__8187
  }else {
    lazy_seq.x = x__8187.call(null);
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
  var this__8188 = this;
  var h__2192__auto____8189 = this__8188.__hash;
  if(!(h__2192__auto____8189 == null)) {
    return h__2192__auto____8189
  }else {
    var h__2192__auto____8190 = cljs.core.hash_coll.call(null, coll);
    this__8188.__hash = h__2192__auto____8190;
    return h__2192__auto____8190
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8191 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8192 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__8193 = this;
  var this__8194 = this;
  return cljs.core.pr_str.call(null, this__8194)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8195 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8196 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8197 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8198 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8199 = this;
  return new cljs.core.LazySeq(meta, this__8199.realized, this__8199.x, this__8199.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8200 = this;
  return this__8200.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8201 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8201.meta)
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
  var this__8202 = this;
  return this__8202.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__8203 = this;
  var ___8204 = this;
  this__8203.buf[this__8203.end] = o;
  return this__8203.end = this__8203.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__8205 = this;
  var ___8206 = this;
  var ret__8207 = new cljs.core.ArrayChunk(this__8205.buf, 0, this__8205.end);
  this__8205.buf = null;
  return ret__8207
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
  var this__8208 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__8208.arr[this__8208.off], this__8208.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8209 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__8209.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__8210 = this;
  if(this__8210.off === this__8210.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__8210.arr, this__8210.off + 1, this__8210.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__8211 = this;
  return this__8211.arr[this__8211.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__8212 = this;
  if(function() {
    var and__3822__auto____8213 = i >= 0;
    if(and__3822__auto____8213) {
      return i < this__8212.end - this__8212.off
    }else {
      return and__3822__auto____8213
    }
  }()) {
    return this__8212.arr[this__8212.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__8214 = this;
  return this__8214.end - this__8214.off
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
  var this__8215 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8216 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8217 = this;
  return cljs.core._nth.call(null, this__8217.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8218 = this;
  if(cljs.core._count.call(null, this__8218.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__8218.chunk), this__8218.more, this__8218.meta)
  }else {
    if(this__8218.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__8218.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8219 = this;
  if(this__8219.more == null) {
    return null
  }else {
    return this__8219.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8220 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8221 = this;
  return new cljs.core.ChunkedCons(this__8221.chunk, this__8221.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8222 = this;
  return this__8222.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8223 = this;
  return this__8223.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8224 = this;
  if(this__8224.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__8224.more
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
    var G__8228__8229 = s;
    if(G__8228__8229) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____8230 = null;
        if(cljs.core.truth_(or__3824__auto____8230)) {
          return or__3824__auto____8230
        }else {
          return G__8228__8229.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__8228__8229.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__8228__8229)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__8228__8229)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__8233 = [];
  var s__8234 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__8234)) {
      ary__8233.push(cljs.core.first.call(null, s__8234));
      var G__8235 = cljs.core.next.call(null, s__8234);
      s__8234 = G__8235;
      continue
    }else {
      return ary__8233
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__8239 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__8240 = 0;
  var xs__8241 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__8241) {
      ret__8239[i__8240] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__8241));
      var G__8242 = i__8240 + 1;
      var G__8243 = cljs.core.next.call(null, xs__8241);
      i__8240 = G__8242;
      xs__8241 = G__8243;
      continue
    }else {
    }
    break
  }
  return ret__8239
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
    var a__8251 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8252 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8253 = 0;
      var s__8254 = s__8252;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8255 = s__8254;
          if(and__3822__auto____8255) {
            return i__8253 < size
          }else {
            return and__3822__auto____8255
          }
        }())) {
          a__8251[i__8253] = cljs.core.first.call(null, s__8254);
          var G__8258 = i__8253 + 1;
          var G__8259 = cljs.core.next.call(null, s__8254);
          i__8253 = G__8258;
          s__8254 = G__8259;
          continue
        }else {
          return a__8251
        }
        break
      }
    }else {
      var n__2527__auto____8256 = size;
      var i__8257 = 0;
      while(true) {
        if(i__8257 < n__2527__auto____8256) {
          a__8251[i__8257] = init_val_or_seq;
          var G__8260 = i__8257 + 1;
          i__8257 = G__8260;
          continue
        }else {
        }
        break
      }
      return a__8251
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
    var a__8268 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8269 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8270 = 0;
      var s__8271 = s__8269;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8272 = s__8271;
          if(and__3822__auto____8272) {
            return i__8270 < size
          }else {
            return and__3822__auto____8272
          }
        }())) {
          a__8268[i__8270] = cljs.core.first.call(null, s__8271);
          var G__8275 = i__8270 + 1;
          var G__8276 = cljs.core.next.call(null, s__8271);
          i__8270 = G__8275;
          s__8271 = G__8276;
          continue
        }else {
          return a__8268
        }
        break
      }
    }else {
      var n__2527__auto____8273 = size;
      var i__8274 = 0;
      while(true) {
        if(i__8274 < n__2527__auto____8273) {
          a__8268[i__8274] = init_val_or_seq;
          var G__8277 = i__8274 + 1;
          i__8274 = G__8277;
          continue
        }else {
        }
        break
      }
      return a__8268
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
    var a__8285 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8286 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8287 = 0;
      var s__8288 = s__8286;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8289 = s__8288;
          if(and__3822__auto____8289) {
            return i__8287 < size
          }else {
            return and__3822__auto____8289
          }
        }())) {
          a__8285[i__8287] = cljs.core.first.call(null, s__8288);
          var G__8292 = i__8287 + 1;
          var G__8293 = cljs.core.next.call(null, s__8288);
          i__8287 = G__8292;
          s__8288 = G__8293;
          continue
        }else {
          return a__8285
        }
        break
      }
    }else {
      var n__2527__auto____8290 = size;
      var i__8291 = 0;
      while(true) {
        if(i__8291 < n__2527__auto____8290) {
          a__8285[i__8291] = init_val_or_seq;
          var G__8294 = i__8291 + 1;
          i__8291 = G__8294;
          continue
        }else {
        }
        break
      }
      return a__8285
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
    var s__8299 = s;
    var i__8300 = n;
    var sum__8301 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____8302 = i__8300 > 0;
        if(and__3822__auto____8302) {
          return cljs.core.seq.call(null, s__8299)
        }else {
          return and__3822__auto____8302
        }
      }())) {
        var G__8303 = cljs.core.next.call(null, s__8299);
        var G__8304 = i__8300 - 1;
        var G__8305 = sum__8301 + 1;
        s__8299 = G__8303;
        i__8300 = G__8304;
        sum__8301 = G__8305;
        continue
      }else {
        return sum__8301
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
      var s__8310 = cljs.core.seq.call(null, x);
      if(s__8310) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8310)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__8310), concat.call(null, cljs.core.chunk_rest.call(null, s__8310), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__8310), concat.call(null, cljs.core.rest.call(null, s__8310), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__8314__delegate = function(x, y, zs) {
      var cat__8313 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__8312 = cljs.core.seq.call(null, xys);
          if(xys__8312) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__8312)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__8312), cat.call(null, cljs.core.chunk_rest.call(null, xys__8312), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__8312), cat.call(null, cljs.core.rest.call(null, xys__8312), zs))
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
      return cat__8313.call(null, concat.call(null, x, y), zs)
    };
    var G__8314 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8314__delegate.call(this, x, y, zs)
    };
    G__8314.cljs$lang$maxFixedArity = 2;
    G__8314.cljs$lang$applyTo = function(arglist__8315) {
      var x = cljs.core.first(arglist__8315);
      var y = cljs.core.first(cljs.core.next(arglist__8315));
      var zs = cljs.core.rest(cljs.core.next(arglist__8315));
      return G__8314__delegate(x, y, zs)
    };
    G__8314.cljs$lang$arity$variadic = G__8314__delegate;
    return G__8314
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
    var G__8316__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__8316 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8316__delegate.call(this, a, b, c, d, more)
    };
    G__8316.cljs$lang$maxFixedArity = 4;
    G__8316.cljs$lang$applyTo = function(arglist__8317) {
      var a = cljs.core.first(arglist__8317);
      var b = cljs.core.first(cljs.core.next(arglist__8317));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8317)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8317))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8317))));
      return G__8316__delegate(a, b, c, d, more)
    };
    G__8316.cljs$lang$arity$variadic = G__8316__delegate;
    return G__8316
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
  var args__8359 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__8360 = cljs.core._first.call(null, args__8359);
    var args__8361 = cljs.core._rest.call(null, args__8359);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__8360)
      }else {
        return f.call(null, a__8360)
      }
    }else {
      var b__8362 = cljs.core._first.call(null, args__8361);
      var args__8363 = cljs.core._rest.call(null, args__8361);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__8360, b__8362)
        }else {
          return f.call(null, a__8360, b__8362)
        }
      }else {
        var c__8364 = cljs.core._first.call(null, args__8363);
        var args__8365 = cljs.core._rest.call(null, args__8363);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__8360, b__8362, c__8364)
          }else {
            return f.call(null, a__8360, b__8362, c__8364)
          }
        }else {
          var d__8366 = cljs.core._first.call(null, args__8365);
          var args__8367 = cljs.core._rest.call(null, args__8365);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__8360, b__8362, c__8364, d__8366)
            }else {
              return f.call(null, a__8360, b__8362, c__8364, d__8366)
            }
          }else {
            var e__8368 = cljs.core._first.call(null, args__8367);
            var args__8369 = cljs.core._rest.call(null, args__8367);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__8360, b__8362, c__8364, d__8366, e__8368)
              }else {
                return f.call(null, a__8360, b__8362, c__8364, d__8366, e__8368)
              }
            }else {
              var f__8370 = cljs.core._first.call(null, args__8369);
              var args__8371 = cljs.core._rest.call(null, args__8369);
              if(argc === 6) {
                if(f__8370.cljs$lang$arity$6) {
                  return f__8370.cljs$lang$arity$6(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370)
                }else {
                  return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370)
                }
              }else {
                var g__8372 = cljs.core._first.call(null, args__8371);
                var args__8373 = cljs.core._rest.call(null, args__8371);
                if(argc === 7) {
                  if(f__8370.cljs$lang$arity$7) {
                    return f__8370.cljs$lang$arity$7(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372)
                  }else {
                    return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372)
                  }
                }else {
                  var h__8374 = cljs.core._first.call(null, args__8373);
                  var args__8375 = cljs.core._rest.call(null, args__8373);
                  if(argc === 8) {
                    if(f__8370.cljs$lang$arity$8) {
                      return f__8370.cljs$lang$arity$8(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374)
                    }else {
                      return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374)
                    }
                  }else {
                    var i__8376 = cljs.core._first.call(null, args__8375);
                    var args__8377 = cljs.core._rest.call(null, args__8375);
                    if(argc === 9) {
                      if(f__8370.cljs$lang$arity$9) {
                        return f__8370.cljs$lang$arity$9(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376)
                      }else {
                        return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376)
                      }
                    }else {
                      var j__8378 = cljs.core._first.call(null, args__8377);
                      var args__8379 = cljs.core._rest.call(null, args__8377);
                      if(argc === 10) {
                        if(f__8370.cljs$lang$arity$10) {
                          return f__8370.cljs$lang$arity$10(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378)
                        }else {
                          return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378)
                        }
                      }else {
                        var k__8380 = cljs.core._first.call(null, args__8379);
                        var args__8381 = cljs.core._rest.call(null, args__8379);
                        if(argc === 11) {
                          if(f__8370.cljs$lang$arity$11) {
                            return f__8370.cljs$lang$arity$11(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380)
                          }else {
                            return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380)
                          }
                        }else {
                          var l__8382 = cljs.core._first.call(null, args__8381);
                          var args__8383 = cljs.core._rest.call(null, args__8381);
                          if(argc === 12) {
                            if(f__8370.cljs$lang$arity$12) {
                              return f__8370.cljs$lang$arity$12(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382)
                            }else {
                              return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382)
                            }
                          }else {
                            var m__8384 = cljs.core._first.call(null, args__8383);
                            var args__8385 = cljs.core._rest.call(null, args__8383);
                            if(argc === 13) {
                              if(f__8370.cljs$lang$arity$13) {
                                return f__8370.cljs$lang$arity$13(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384)
                              }else {
                                return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384)
                              }
                            }else {
                              var n__8386 = cljs.core._first.call(null, args__8385);
                              var args__8387 = cljs.core._rest.call(null, args__8385);
                              if(argc === 14) {
                                if(f__8370.cljs$lang$arity$14) {
                                  return f__8370.cljs$lang$arity$14(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386)
                                }else {
                                  return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386)
                                }
                              }else {
                                var o__8388 = cljs.core._first.call(null, args__8387);
                                var args__8389 = cljs.core._rest.call(null, args__8387);
                                if(argc === 15) {
                                  if(f__8370.cljs$lang$arity$15) {
                                    return f__8370.cljs$lang$arity$15(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386, o__8388)
                                  }else {
                                    return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386, o__8388)
                                  }
                                }else {
                                  var p__8390 = cljs.core._first.call(null, args__8389);
                                  var args__8391 = cljs.core._rest.call(null, args__8389);
                                  if(argc === 16) {
                                    if(f__8370.cljs$lang$arity$16) {
                                      return f__8370.cljs$lang$arity$16(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386, o__8388, p__8390)
                                    }else {
                                      return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386, o__8388, p__8390)
                                    }
                                  }else {
                                    var q__8392 = cljs.core._first.call(null, args__8391);
                                    var args__8393 = cljs.core._rest.call(null, args__8391);
                                    if(argc === 17) {
                                      if(f__8370.cljs$lang$arity$17) {
                                        return f__8370.cljs$lang$arity$17(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386, o__8388, p__8390, q__8392)
                                      }else {
                                        return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386, o__8388, p__8390, q__8392)
                                      }
                                    }else {
                                      var r__8394 = cljs.core._first.call(null, args__8393);
                                      var args__8395 = cljs.core._rest.call(null, args__8393);
                                      if(argc === 18) {
                                        if(f__8370.cljs$lang$arity$18) {
                                          return f__8370.cljs$lang$arity$18(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386, o__8388, p__8390, q__8392, r__8394)
                                        }else {
                                          return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386, o__8388, p__8390, q__8392, r__8394)
                                        }
                                      }else {
                                        var s__8396 = cljs.core._first.call(null, args__8395);
                                        var args__8397 = cljs.core._rest.call(null, args__8395);
                                        if(argc === 19) {
                                          if(f__8370.cljs$lang$arity$19) {
                                            return f__8370.cljs$lang$arity$19(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386, o__8388, p__8390, q__8392, r__8394, s__8396)
                                          }else {
                                            return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386, o__8388, p__8390, q__8392, r__8394, s__8396)
                                          }
                                        }else {
                                          var t__8398 = cljs.core._first.call(null, args__8397);
                                          var args__8399 = cljs.core._rest.call(null, args__8397);
                                          if(argc === 20) {
                                            if(f__8370.cljs$lang$arity$20) {
                                              return f__8370.cljs$lang$arity$20(a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386, o__8388, p__8390, q__8392, r__8394, s__8396, t__8398)
                                            }else {
                                              return f__8370.call(null, a__8360, b__8362, c__8364, d__8366, e__8368, f__8370, g__8372, h__8374, i__8376, j__8378, k__8380, l__8382, m__8384, n__8386, o__8388, p__8390, q__8392, r__8394, s__8396, t__8398)
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
    var fixed_arity__8414 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8415 = cljs.core.bounded_count.call(null, args, fixed_arity__8414 + 1);
      if(bc__8415 <= fixed_arity__8414) {
        return cljs.core.apply_to.call(null, f, bc__8415, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__8416 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__8417 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8418 = cljs.core.bounded_count.call(null, arglist__8416, fixed_arity__8417 + 1);
      if(bc__8418 <= fixed_arity__8417) {
        return cljs.core.apply_to.call(null, f, bc__8418, arglist__8416)
      }else {
        return f.cljs$lang$applyTo(arglist__8416)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8416))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__8419 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__8420 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8421 = cljs.core.bounded_count.call(null, arglist__8419, fixed_arity__8420 + 1);
      if(bc__8421 <= fixed_arity__8420) {
        return cljs.core.apply_to.call(null, f, bc__8421, arglist__8419)
      }else {
        return f.cljs$lang$applyTo(arglist__8419)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8419))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__8422 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__8423 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8424 = cljs.core.bounded_count.call(null, arglist__8422, fixed_arity__8423 + 1);
      if(bc__8424 <= fixed_arity__8423) {
        return cljs.core.apply_to.call(null, f, bc__8424, arglist__8422)
      }else {
        return f.cljs$lang$applyTo(arglist__8422)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8422))
    }
  };
  var apply__6 = function() {
    var G__8428__delegate = function(f, a, b, c, d, args) {
      var arglist__8425 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__8426 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__8427 = cljs.core.bounded_count.call(null, arglist__8425, fixed_arity__8426 + 1);
        if(bc__8427 <= fixed_arity__8426) {
          return cljs.core.apply_to.call(null, f, bc__8427, arglist__8425)
        }else {
          return f.cljs$lang$applyTo(arglist__8425)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__8425))
      }
    };
    var G__8428 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__8428__delegate.call(this, f, a, b, c, d, args)
    };
    G__8428.cljs$lang$maxFixedArity = 5;
    G__8428.cljs$lang$applyTo = function(arglist__8429) {
      var f = cljs.core.first(arglist__8429);
      var a = cljs.core.first(cljs.core.next(arglist__8429));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8429)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8429))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8429)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8429)))));
      return G__8428__delegate(f, a, b, c, d, args)
    };
    G__8428.cljs$lang$arity$variadic = G__8428__delegate;
    return G__8428
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
  vary_meta.cljs$lang$applyTo = function(arglist__8430) {
    var obj = cljs.core.first(arglist__8430);
    var f = cljs.core.first(cljs.core.next(arglist__8430));
    var args = cljs.core.rest(cljs.core.next(arglist__8430));
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
    var G__8431__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__8431 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8431__delegate.call(this, x, y, more)
    };
    G__8431.cljs$lang$maxFixedArity = 2;
    G__8431.cljs$lang$applyTo = function(arglist__8432) {
      var x = cljs.core.first(arglist__8432);
      var y = cljs.core.first(cljs.core.next(arglist__8432));
      var more = cljs.core.rest(cljs.core.next(arglist__8432));
      return G__8431__delegate(x, y, more)
    };
    G__8431.cljs$lang$arity$variadic = G__8431__delegate;
    return G__8431
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
        var G__8433 = pred;
        var G__8434 = cljs.core.next.call(null, coll);
        pred = G__8433;
        coll = G__8434;
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
      var or__3824__auto____8436 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____8436)) {
        return or__3824__auto____8436
      }else {
        var G__8437 = pred;
        var G__8438 = cljs.core.next.call(null, coll);
        pred = G__8437;
        coll = G__8438;
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
    var G__8439 = null;
    var G__8439__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__8439__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__8439__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__8439__3 = function() {
      var G__8440__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__8440 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__8440__delegate.call(this, x, y, zs)
      };
      G__8440.cljs$lang$maxFixedArity = 2;
      G__8440.cljs$lang$applyTo = function(arglist__8441) {
        var x = cljs.core.first(arglist__8441);
        var y = cljs.core.first(cljs.core.next(arglist__8441));
        var zs = cljs.core.rest(cljs.core.next(arglist__8441));
        return G__8440__delegate(x, y, zs)
      };
      G__8440.cljs$lang$arity$variadic = G__8440__delegate;
      return G__8440
    }();
    G__8439 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__8439__0.call(this);
        case 1:
          return G__8439__1.call(this, x);
        case 2:
          return G__8439__2.call(this, x, y);
        default:
          return G__8439__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__8439.cljs$lang$maxFixedArity = 2;
    G__8439.cljs$lang$applyTo = G__8439__3.cljs$lang$applyTo;
    return G__8439
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__8442__delegate = function(args) {
      return x
    };
    var G__8442 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8442__delegate.call(this, args)
    };
    G__8442.cljs$lang$maxFixedArity = 0;
    G__8442.cljs$lang$applyTo = function(arglist__8443) {
      var args = cljs.core.seq(arglist__8443);
      return G__8442__delegate(args)
    };
    G__8442.cljs$lang$arity$variadic = G__8442__delegate;
    return G__8442
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
      var G__8450 = null;
      var G__8450__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__8450__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__8450__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__8450__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__8450__4 = function() {
        var G__8451__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__8451 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8451__delegate.call(this, x, y, z, args)
        };
        G__8451.cljs$lang$maxFixedArity = 3;
        G__8451.cljs$lang$applyTo = function(arglist__8452) {
          var x = cljs.core.first(arglist__8452);
          var y = cljs.core.first(cljs.core.next(arglist__8452));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8452)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8452)));
          return G__8451__delegate(x, y, z, args)
        };
        G__8451.cljs$lang$arity$variadic = G__8451__delegate;
        return G__8451
      }();
      G__8450 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8450__0.call(this);
          case 1:
            return G__8450__1.call(this, x);
          case 2:
            return G__8450__2.call(this, x, y);
          case 3:
            return G__8450__3.call(this, x, y, z);
          default:
            return G__8450__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8450.cljs$lang$maxFixedArity = 3;
      G__8450.cljs$lang$applyTo = G__8450__4.cljs$lang$applyTo;
      return G__8450
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__8453 = null;
      var G__8453__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__8453__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__8453__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__8453__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__8453__4 = function() {
        var G__8454__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__8454 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8454__delegate.call(this, x, y, z, args)
        };
        G__8454.cljs$lang$maxFixedArity = 3;
        G__8454.cljs$lang$applyTo = function(arglist__8455) {
          var x = cljs.core.first(arglist__8455);
          var y = cljs.core.first(cljs.core.next(arglist__8455));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8455)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8455)));
          return G__8454__delegate(x, y, z, args)
        };
        G__8454.cljs$lang$arity$variadic = G__8454__delegate;
        return G__8454
      }();
      G__8453 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8453__0.call(this);
          case 1:
            return G__8453__1.call(this, x);
          case 2:
            return G__8453__2.call(this, x, y);
          case 3:
            return G__8453__3.call(this, x, y, z);
          default:
            return G__8453__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8453.cljs$lang$maxFixedArity = 3;
      G__8453.cljs$lang$applyTo = G__8453__4.cljs$lang$applyTo;
      return G__8453
    }()
  };
  var comp__4 = function() {
    var G__8456__delegate = function(f1, f2, f3, fs) {
      var fs__8447 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__8457__delegate = function(args) {
          var ret__8448 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__8447), args);
          var fs__8449 = cljs.core.next.call(null, fs__8447);
          while(true) {
            if(fs__8449) {
              var G__8458 = cljs.core.first.call(null, fs__8449).call(null, ret__8448);
              var G__8459 = cljs.core.next.call(null, fs__8449);
              ret__8448 = G__8458;
              fs__8449 = G__8459;
              continue
            }else {
              return ret__8448
            }
            break
          }
        };
        var G__8457 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8457__delegate.call(this, args)
        };
        G__8457.cljs$lang$maxFixedArity = 0;
        G__8457.cljs$lang$applyTo = function(arglist__8460) {
          var args = cljs.core.seq(arglist__8460);
          return G__8457__delegate(args)
        };
        G__8457.cljs$lang$arity$variadic = G__8457__delegate;
        return G__8457
      }()
    };
    var G__8456 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8456__delegate.call(this, f1, f2, f3, fs)
    };
    G__8456.cljs$lang$maxFixedArity = 3;
    G__8456.cljs$lang$applyTo = function(arglist__8461) {
      var f1 = cljs.core.first(arglist__8461);
      var f2 = cljs.core.first(cljs.core.next(arglist__8461));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8461)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8461)));
      return G__8456__delegate(f1, f2, f3, fs)
    };
    G__8456.cljs$lang$arity$variadic = G__8456__delegate;
    return G__8456
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
      var G__8462__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__8462 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8462__delegate.call(this, args)
      };
      G__8462.cljs$lang$maxFixedArity = 0;
      G__8462.cljs$lang$applyTo = function(arglist__8463) {
        var args = cljs.core.seq(arglist__8463);
        return G__8462__delegate(args)
      };
      G__8462.cljs$lang$arity$variadic = G__8462__delegate;
      return G__8462
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__8464__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__8464 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8464__delegate.call(this, args)
      };
      G__8464.cljs$lang$maxFixedArity = 0;
      G__8464.cljs$lang$applyTo = function(arglist__8465) {
        var args = cljs.core.seq(arglist__8465);
        return G__8464__delegate(args)
      };
      G__8464.cljs$lang$arity$variadic = G__8464__delegate;
      return G__8464
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__8466__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__8466 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8466__delegate.call(this, args)
      };
      G__8466.cljs$lang$maxFixedArity = 0;
      G__8466.cljs$lang$applyTo = function(arglist__8467) {
        var args = cljs.core.seq(arglist__8467);
        return G__8466__delegate(args)
      };
      G__8466.cljs$lang$arity$variadic = G__8466__delegate;
      return G__8466
    }()
  };
  var partial__5 = function() {
    var G__8468__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__8469__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__8469 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8469__delegate.call(this, args)
        };
        G__8469.cljs$lang$maxFixedArity = 0;
        G__8469.cljs$lang$applyTo = function(arglist__8470) {
          var args = cljs.core.seq(arglist__8470);
          return G__8469__delegate(args)
        };
        G__8469.cljs$lang$arity$variadic = G__8469__delegate;
        return G__8469
      }()
    };
    var G__8468 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8468__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__8468.cljs$lang$maxFixedArity = 4;
    G__8468.cljs$lang$applyTo = function(arglist__8471) {
      var f = cljs.core.first(arglist__8471);
      var arg1 = cljs.core.first(cljs.core.next(arglist__8471));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8471)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8471))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8471))));
      return G__8468__delegate(f, arg1, arg2, arg3, more)
    };
    G__8468.cljs$lang$arity$variadic = G__8468__delegate;
    return G__8468
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
      var G__8472 = null;
      var G__8472__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__8472__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__8472__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__8472__4 = function() {
        var G__8473__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__8473 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8473__delegate.call(this, a, b, c, ds)
        };
        G__8473.cljs$lang$maxFixedArity = 3;
        G__8473.cljs$lang$applyTo = function(arglist__8474) {
          var a = cljs.core.first(arglist__8474);
          var b = cljs.core.first(cljs.core.next(arglist__8474));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8474)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8474)));
          return G__8473__delegate(a, b, c, ds)
        };
        G__8473.cljs$lang$arity$variadic = G__8473__delegate;
        return G__8473
      }();
      G__8472 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__8472__1.call(this, a);
          case 2:
            return G__8472__2.call(this, a, b);
          case 3:
            return G__8472__3.call(this, a, b, c);
          default:
            return G__8472__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8472.cljs$lang$maxFixedArity = 3;
      G__8472.cljs$lang$applyTo = G__8472__4.cljs$lang$applyTo;
      return G__8472
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__8475 = null;
      var G__8475__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8475__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__8475__4 = function() {
        var G__8476__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__8476 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8476__delegate.call(this, a, b, c, ds)
        };
        G__8476.cljs$lang$maxFixedArity = 3;
        G__8476.cljs$lang$applyTo = function(arglist__8477) {
          var a = cljs.core.first(arglist__8477);
          var b = cljs.core.first(cljs.core.next(arglist__8477));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8477)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8477)));
          return G__8476__delegate(a, b, c, ds)
        };
        G__8476.cljs$lang$arity$variadic = G__8476__delegate;
        return G__8476
      }();
      G__8475 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8475__2.call(this, a, b);
          case 3:
            return G__8475__3.call(this, a, b, c);
          default:
            return G__8475__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8475.cljs$lang$maxFixedArity = 3;
      G__8475.cljs$lang$applyTo = G__8475__4.cljs$lang$applyTo;
      return G__8475
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__8478 = null;
      var G__8478__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8478__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__8478__4 = function() {
        var G__8479__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__8479 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8479__delegate.call(this, a, b, c, ds)
        };
        G__8479.cljs$lang$maxFixedArity = 3;
        G__8479.cljs$lang$applyTo = function(arglist__8480) {
          var a = cljs.core.first(arglist__8480);
          var b = cljs.core.first(cljs.core.next(arglist__8480));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8480)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8480)));
          return G__8479__delegate(a, b, c, ds)
        };
        G__8479.cljs$lang$arity$variadic = G__8479__delegate;
        return G__8479
      }();
      G__8478 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8478__2.call(this, a, b);
          case 3:
            return G__8478__3.call(this, a, b, c);
          default:
            return G__8478__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8478.cljs$lang$maxFixedArity = 3;
      G__8478.cljs$lang$applyTo = G__8478__4.cljs$lang$applyTo;
      return G__8478
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
  var mapi__8496 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8504 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8504) {
        var s__8505 = temp__3974__auto____8504;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8505)) {
          var c__8506 = cljs.core.chunk_first.call(null, s__8505);
          var size__8507 = cljs.core.count.call(null, c__8506);
          var b__8508 = cljs.core.chunk_buffer.call(null, size__8507);
          var n__2527__auto____8509 = size__8507;
          var i__8510 = 0;
          while(true) {
            if(i__8510 < n__2527__auto____8509) {
              cljs.core.chunk_append.call(null, b__8508, f.call(null, idx + i__8510, cljs.core._nth.call(null, c__8506, i__8510)));
              var G__8511 = i__8510 + 1;
              i__8510 = G__8511;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8508), mapi.call(null, idx + size__8507, cljs.core.chunk_rest.call(null, s__8505)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__8505)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__8505)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__8496.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8521 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8521) {
      var s__8522 = temp__3974__auto____8521;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8522)) {
        var c__8523 = cljs.core.chunk_first.call(null, s__8522);
        var size__8524 = cljs.core.count.call(null, c__8523);
        var b__8525 = cljs.core.chunk_buffer.call(null, size__8524);
        var n__2527__auto____8526 = size__8524;
        var i__8527 = 0;
        while(true) {
          if(i__8527 < n__2527__auto____8526) {
            var x__8528 = f.call(null, cljs.core._nth.call(null, c__8523, i__8527));
            if(x__8528 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__8525, x__8528)
            }
            var G__8530 = i__8527 + 1;
            i__8527 = G__8530;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8525), keep.call(null, f, cljs.core.chunk_rest.call(null, s__8522)))
      }else {
        var x__8529 = f.call(null, cljs.core.first.call(null, s__8522));
        if(x__8529 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__8522))
        }else {
          return cljs.core.cons.call(null, x__8529, keep.call(null, f, cljs.core.rest.call(null, s__8522)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__8556 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8566 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8566) {
        var s__8567 = temp__3974__auto____8566;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8567)) {
          var c__8568 = cljs.core.chunk_first.call(null, s__8567);
          var size__8569 = cljs.core.count.call(null, c__8568);
          var b__8570 = cljs.core.chunk_buffer.call(null, size__8569);
          var n__2527__auto____8571 = size__8569;
          var i__8572 = 0;
          while(true) {
            if(i__8572 < n__2527__auto____8571) {
              var x__8573 = f.call(null, idx + i__8572, cljs.core._nth.call(null, c__8568, i__8572));
              if(x__8573 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__8570, x__8573)
              }
              var G__8575 = i__8572 + 1;
              i__8572 = G__8575;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8570), keepi.call(null, idx + size__8569, cljs.core.chunk_rest.call(null, s__8567)))
        }else {
          var x__8574 = f.call(null, idx, cljs.core.first.call(null, s__8567));
          if(x__8574 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8567))
          }else {
            return cljs.core.cons.call(null, x__8574, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8567)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__8556.call(null, 0, coll)
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
          var and__3822__auto____8661 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8661)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____8661
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8662 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8662)) {
            var and__3822__auto____8663 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8663)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____8663
            }
          }else {
            return and__3822__auto____8662
          }
        }())
      };
      var ep1__4 = function() {
        var G__8732__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8664 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8664)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____8664
            }
          }())
        };
        var G__8732 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8732__delegate.call(this, x, y, z, args)
        };
        G__8732.cljs$lang$maxFixedArity = 3;
        G__8732.cljs$lang$applyTo = function(arglist__8733) {
          var x = cljs.core.first(arglist__8733);
          var y = cljs.core.first(cljs.core.next(arglist__8733));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8733)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8733)));
          return G__8732__delegate(x, y, z, args)
        };
        G__8732.cljs$lang$arity$variadic = G__8732__delegate;
        return G__8732
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
          var and__3822__auto____8676 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8676)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____8676
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8677 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8677)) {
            var and__3822__auto____8678 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8678)) {
              var and__3822__auto____8679 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8679)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____8679
              }
            }else {
              return and__3822__auto____8678
            }
          }else {
            return and__3822__auto____8677
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8680 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8680)) {
            var and__3822__auto____8681 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8681)) {
              var and__3822__auto____8682 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____8682)) {
                var and__3822__auto____8683 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____8683)) {
                  var and__3822__auto____8684 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8684)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____8684
                  }
                }else {
                  return and__3822__auto____8683
                }
              }else {
                return and__3822__auto____8682
              }
            }else {
              return and__3822__auto____8681
            }
          }else {
            return and__3822__auto____8680
          }
        }())
      };
      var ep2__4 = function() {
        var G__8734__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8685 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8685)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8531_SHARP_) {
                var and__3822__auto____8686 = p1.call(null, p1__8531_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8686)) {
                  return p2.call(null, p1__8531_SHARP_)
                }else {
                  return and__3822__auto____8686
                }
              }, args)
            }else {
              return and__3822__auto____8685
            }
          }())
        };
        var G__8734 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8734__delegate.call(this, x, y, z, args)
        };
        G__8734.cljs$lang$maxFixedArity = 3;
        G__8734.cljs$lang$applyTo = function(arglist__8735) {
          var x = cljs.core.first(arglist__8735);
          var y = cljs.core.first(cljs.core.next(arglist__8735));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8735)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8735)));
          return G__8734__delegate(x, y, z, args)
        };
        G__8734.cljs$lang$arity$variadic = G__8734__delegate;
        return G__8734
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
          var and__3822__auto____8705 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8705)) {
            var and__3822__auto____8706 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8706)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____8706
            }
          }else {
            return and__3822__auto____8705
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8707 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8707)) {
            var and__3822__auto____8708 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8708)) {
              var and__3822__auto____8709 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8709)) {
                var and__3822__auto____8710 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8710)) {
                  var and__3822__auto____8711 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8711)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____8711
                  }
                }else {
                  return and__3822__auto____8710
                }
              }else {
                return and__3822__auto____8709
              }
            }else {
              return and__3822__auto____8708
            }
          }else {
            return and__3822__auto____8707
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8712 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8712)) {
            var and__3822__auto____8713 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8713)) {
              var and__3822__auto____8714 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8714)) {
                var and__3822__auto____8715 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8715)) {
                  var and__3822__auto____8716 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8716)) {
                    var and__3822__auto____8717 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____8717)) {
                      var and__3822__auto____8718 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____8718)) {
                        var and__3822__auto____8719 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____8719)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____8719
                        }
                      }else {
                        return and__3822__auto____8718
                      }
                    }else {
                      return and__3822__auto____8717
                    }
                  }else {
                    return and__3822__auto____8716
                  }
                }else {
                  return and__3822__auto____8715
                }
              }else {
                return and__3822__auto____8714
              }
            }else {
              return and__3822__auto____8713
            }
          }else {
            return and__3822__auto____8712
          }
        }())
      };
      var ep3__4 = function() {
        var G__8736__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8720 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8720)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8532_SHARP_) {
                var and__3822__auto____8721 = p1.call(null, p1__8532_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8721)) {
                  var and__3822__auto____8722 = p2.call(null, p1__8532_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____8722)) {
                    return p3.call(null, p1__8532_SHARP_)
                  }else {
                    return and__3822__auto____8722
                  }
                }else {
                  return and__3822__auto____8721
                }
              }, args)
            }else {
              return and__3822__auto____8720
            }
          }())
        };
        var G__8736 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8736__delegate.call(this, x, y, z, args)
        };
        G__8736.cljs$lang$maxFixedArity = 3;
        G__8736.cljs$lang$applyTo = function(arglist__8737) {
          var x = cljs.core.first(arglist__8737);
          var y = cljs.core.first(cljs.core.next(arglist__8737));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8737)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8737)));
          return G__8736__delegate(x, y, z, args)
        };
        G__8736.cljs$lang$arity$variadic = G__8736__delegate;
        return G__8736
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
    var G__8738__delegate = function(p1, p2, p3, ps) {
      var ps__8723 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__8533_SHARP_) {
            return p1__8533_SHARP_.call(null, x)
          }, ps__8723)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__8534_SHARP_) {
            var and__3822__auto____8728 = p1__8534_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8728)) {
              return p1__8534_SHARP_.call(null, y)
            }else {
              return and__3822__auto____8728
            }
          }, ps__8723)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__8535_SHARP_) {
            var and__3822__auto____8729 = p1__8535_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8729)) {
              var and__3822__auto____8730 = p1__8535_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____8730)) {
                return p1__8535_SHARP_.call(null, z)
              }else {
                return and__3822__auto____8730
              }
            }else {
              return and__3822__auto____8729
            }
          }, ps__8723)
        };
        var epn__4 = function() {
          var G__8739__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____8731 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____8731)) {
                return cljs.core.every_QMARK_.call(null, function(p1__8536_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__8536_SHARP_, args)
                }, ps__8723)
              }else {
                return and__3822__auto____8731
              }
            }())
          };
          var G__8739 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8739__delegate.call(this, x, y, z, args)
          };
          G__8739.cljs$lang$maxFixedArity = 3;
          G__8739.cljs$lang$applyTo = function(arglist__8740) {
            var x = cljs.core.first(arglist__8740);
            var y = cljs.core.first(cljs.core.next(arglist__8740));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8740)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8740)));
            return G__8739__delegate(x, y, z, args)
          };
          G__8739.cljs$lang$arity$variadic = G__8739__delegate;
          return G__8739
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
    var G__8738 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8738__delegate.call(this, p1, p2, p3, ps)
    };
    G__8738.cljs$lang$maxFixedArity = 3;
    G__8738.cljs$lang$applyTo = function(arglist__8741) {
      var p1 = cljs.core.first(arglist__8741);
      var p2 = cljs.core.first(cljs.core.next(arglist__8741));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8741)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8741)));
      return G__8738__delegate(p1, p2, p3, ps)
    };
    G__8738.cljs$lang$arity$variadic = G__8738__delegate;
    return G__8738
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
        var or__3824__auto____8822 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8822)) {
          return or__3824__auto____8822
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____8823 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8823)) {
          return or__3824__auto____8823
        }else {
          var or__3824__auto____8824 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8824)) {
            return or__3824__auto____8824
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8893__delegate = function(x, y, z, args) {
          var or__3824__auto____8825 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8825)) {
            return or__3824__auto____8825
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8893 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8893__delegate.call(this, x, y, z, args)
        };
        G__8893.cljs$lang$maxFixedArity = 3;
        G__8893.cljs$lang$applyTo = function(arglist__8894) {
          var x = cljs.core.first(arglist__8894);
          var y = cljs.core.first(cljs.core.next(arglist__8894));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8894)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8894)));
          return G__8893__delegate(x, y, z, args)
        };
        G__8893.cljs$lang$arity$variadic = G__8893__delegate;
        return G__8893
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
        var or__3824__auto____8837 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8837)) {
          return or__3824__auto____8837
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____8838 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8838)) {
          return or__3824__auto____8838
        }else {
          var or__3824__auto____8839 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8839)) {
            return or__3824__auto____8839
          }else {
            var or__3824__auto____8840 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8840)) {
              return or__3824__auto____8840
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____8841 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8841)) {
          return or__3824__auto____8841
        }else {
          var or__3824__auto____8842 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8842)) {
            return or__3824__auto____8842
          }else {
            var or__3824__auto____8843 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____8843)) {
              return or__3824__auto____8843
            }else {
              var or__3824__auto____8844 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____8844)) {
                return or__3824__auto____8844
              }else {
                var or__3824__auto____8845 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8845)) {
                  return or__3824__auto____8845
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8895__delegate = function(x, y, z, args) {
          var or__3824__auto____8846 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8846)) {
            return or__3824__auto____8846
          }else {
            return cljs.core.some.call(null, function(p1__8576_SHARP_) {
              var or__3824__auto____8847 = p1.call(null, p1__8576_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8847)) {
                return or__3824__auto____8847
              }else {
                return p2.call(null, p1__8576_SHARP_)
              }
            }, args)
          }
        };
        var G__8895 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8895__delegate.call(this, x, y, z, args)
        };
        G__8895.cljs$lang$maxFixedArity = 3;
        G__8895.cljs$lang$applyTo = function(arglist__8896) {
          var x = cljs.core.first(arglist__8896);
          var y = cljs.core.first(cljs.core.next(arglist__8896));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8896)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8896)));
          return G__8895__delegate(x, y, z, args)
        };
        G__8895.cljs$lang$arity$variadic = G__8895__delegate;
        return G__8895
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
        var or__3824__auto____8866 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8866)) {
          return or__3824__auto____8866
        }else {
          var or__3824__auto____8867 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8867)) {
            return or__3824__auto____8867
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8868 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8868)) {
          return or__3824__auto____8868
        }else {
          var or__3824__auto____8869 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8869)) {
            return or__3824__auto____8869
          }else {
            var or__3824__auto____8870 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8870)) {
              return or__3824__auto____8870
            }else {
              var or__3824__auto____8871 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8871)) {
                return or__3824__auto____8871
              }else {
                var or__3824__auto____8872 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8872)) {
                  return or__3824__auto____8872
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8873 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8873)) {
          return or__3824__auto____8873
        }else {
          var or__3824__auto____8874 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8874)) {
            return or__3824__auto____8874
          }else {
            var or__3824__auto____8875 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8875)) {
              return or__3824__auto____8875
            }else {
              var or__3824__auto____8876 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8876)) {
                return or__3824__auto____8876
              }else {
                var or__3824__auto____8877 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8877)) {
                  return or__3824__auto____8877
                }else {
                  var or__3824__auto____8878 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8878)) {
                    return or__3824__auto____8878
                  }else {
                    var or__3824__auto____8879 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8879)) {
                      return or__3824__auto____8879
                    }else {
                      var or__3824__auto____8880 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8880)) {
                        return or__3824__auto____8880
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
        var G__8897__delegate = function(x, y, z, args) {
          var or__3824__auto____8881 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8881)) {
            return or__3824__auto____8881
          }else {
            return cljs.core.some.call(null, function(p1__8577_SHARP_) {
              var or__3824__auto____8882 = p1.call(null, p1__8577_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8882)) {
                return or__3824__auto____8882
              }else {
                var or__3824__auto____8883 = p2.call(null, p1__8577_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8883)) {
                  return or__3824__auto____8883
                }else {
                  return p3.call(null, p1__8577_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8897 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8897__delegate.call(this, x, y, z, args)
        };
        G__8897.cljs$lang$maxFixedArity = 3;
        G__8897.cljs$lang$applyTo = function(arglist__8898) {
          var x = cljs.core.first(arglist__8898);
          var y = cljs.core.first(cljs.core.next(arglist__8898));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8898)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8898)));
          return G__8897__delegate(x, y, z, args)
        };
        G__8897.cljs$lang$arity$variadic = G__8897__delegate;
        return G__8897
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
    var G__8899__delegate = function(p1, p2, p3, ps) {
      var ps__8884 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__8578_SHARP_) {
            return p1__8578_SHARP_.call(null, x)
          }, ps__8884)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__8579_SHARP_) {
            var or__3824__auto____8889 = p1__8579_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8889)) {
              return or__3824__auto____8889
            }else {
              return p1__8579_SHARP_.call(null, y)
            }
          }, ps__8884)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__8580_SHARP_) {
            var or__3824__auto____8890 = p1__8580_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8890)) {
              return or__3824__auto____8890
            }else {
              var or__3824__auto____8891 = p1__8580_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8891)) {
                return or__3824__auto____8891
              }else {
                return p1__8580_SHARP_.call(null, z)
              }
            }
          }, ps__8884)
        };
        var spn__4 = function() {
          var G__8900__delegate = function(x, y, z, args) {
            var or__3824__auto____8892 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8892)) {
              return or__3824__auto____8892
            }else {
              return cljs.core.some.call(null, function(p1__8581_SHARP_) {
                return cljs.core.some.call(null, p1__8581_SHARP_, args)
              }, ps__8884)
            }
          };
          var G__8900 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8900__delegate.call(this, x, y, z, args)
          };
          G__8900.cljs$lang$maxFixedArity = 3;
          G__8900.cljs$lang$applyTo = function(arglist__8901) {
            var x = cljs.core.first(arglist__8901);
            var y = cljs.core.first(cljs.core.next(arglist__8901));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8901)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8901)));
            return G__8900__delegate(x, y, z, args)
          };
          G__8900.cljs$lang$arity$variadic = G__8900__delegate;
          return G__8900
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
    var G__8899 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8899__delegate.call(this, p1, p2, p3, ps)
    };
    G__8899.cljs$lang$maxFixedArity = 3;
    G__8899.cljs$lang$applyTo = function(arglist__8902) {
      var p1 = cljs.core.first(arglist__8902);
      var p2 = cljs.core.first(cljs.core.next(arglist__8902));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8902)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8902)));
      return G__8899__delegate(p1, p2, p3, ps)
    };
    G__8899.cljs$lang$arity$variadic = G__8899__delegate;
    return G__8899
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
      var temp__3974__auto____8921 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8921) {
        var s__8922 = temp__3974__auto____8921;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8922)) {
          var c__8923 = cljs.core.chunk_first.call(null, s__8922);
          var size__8924 = cljs.core.count.call(null, c__8923);
          var b__8925 = cljs.core.chunk_buffer.call(null, size__8924);
          var n__2527__auto____8926 = size__8924;
          var i__8927 = 0;
          while(true) {
            if(i__8927 < n__2527__auto____8926) {
              cljs.core.chunk_append.call(null, b__8925, f.call(null, cljs.core._nth.call(null, c__8923, i__8927)));
              var G__8939 = i__8927 + 1;
              i__8927 = G__8939;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8925), map.call(null, f, cljs.core.chunk_rest.call(null, s__8922)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8922)), map.call(null, f, cljs.core.rest.call(null, s__8922)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8928 = cljs.core.seq.call(null, c1);
      var s2__8929 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8930 = s1__8928;
        if(and__3822__auto____8930) {
          return s2__8929
        }else {
          return and__3822__auto____8930
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8928), cljs.core.first.call(null, s2__8929)), map.call(null, f, cljs.core.rest.call(null, s1__8928), cljs.core.rest.call(null, s2__8929)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8931 = cljs.core.seq.call(null, c1);
      var s2__8932 = cljs.core.seq.call(null, c2);
      var s3__8933 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8934 = s1__8931;
        if(and__3822__auto____8934) {
          var and__3822__auto____8935 = s2__8932;
          if(and__3822__auto____8935) {
            return s3__8933
          }else {
            return and__3822__auto____8935
          }
        }else {
          return and__3822__auto____8934
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8931), cljs.core.first.call(null, s2__8932), cljs.core.first.call(null, s3__8933)), map.call(null, f, cljs.core.rest.call(null, s1__8931), cljs.core.rest.call(null, s2__8932), cljs.core.rest.call(null, s3__8933)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8940__delegate = function(f, c1, c2, c3, colls) {
      var step__8938 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8937 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8937)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8937), step.call(null, map.call(null, cljs.core.rest, ss__8937)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__8742_SHARP_) {
        return cljs.core.apply.call(null, f, p1__8742_SHARP_)
      }, step__8938.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8940 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8940__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8940.cljs$lang$maxFixedArity = 4;
    G__8940.cljs$lang$applyTo = function(arglist__8941) {
      var f = cljs.core.first(arglist__8941);
      var c1 = cljs.core.first(cljs.core.next(arglist__8941));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8941)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8941))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8941))));
      return G__8940__delegate(f, c1, c2, c3, colls)
    };
    G__8940.cljs$lang$arity$variadic = G__8940__delegate;
    return G__8940
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
      var temp__3974__auto____8944 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8944) {
        var s__8945 = temp__3974__auto____8944;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8945), take.call(null, n - 1, cljs.core.rest.call(null, s__8945)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8951 = function(n, coll) {
    while(true) {
      var s__8949 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8950 = n > 0;
        if(and__3822__auto____8950) {
          return s__8949
        }else {
          return and__3822__auto____8950
        }
      }())) {
        var G__8952 = n - 1;
        var G__8953 = cljs.core.rest.call(null, s__8949);
        n = G__8952;
        coll = G__8953;
        continue
      }else {
        return s__8949
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8951.call(null, n, coll)
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
  var s__8956 = cljs.core.seq.call(null, coll);
  var lead__8957 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8957) {
      var G__8958 = cljs.core.next.call(null, s__8956);
      var G__8959 = cljs.core.next.call(null, lead__8957);
      s__8956 = G__8958;
      lead__8957 = G__8959;
      continue
    }else {
      return s__8956
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8965 = function(pred, coll) {
    while(true) {
      var s__8963 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8964 = s__8963;
        if(and__3822__auto____8964) {
          return pred.call(null, cljs.core.first.call(null, s__8963))
        }else {
          return and__3822__auto____8964
        }
      }())) {
        var G__8966 = pred;
        var G__8967 = cljs.core.rest.call(null, s__8963);
        pred = G__8966;
        coll = G__8967;
        continue
      }else {
        return s__8963
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8965.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8970 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8970) {
      var s__8971 = temp__3974__auto____8970;
      return cljs.core.concat.call(null, s__8971, cycle.call(null, s__8971))
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
      var s1__8976 = cljs.core.seq.call(null, c1);
      var s2__8977 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8978 = s1__8976;
        if(and__3822__auto____8978) {
          return s2__8977
        }else {
          return and__3822__auto____8978
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8976), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8977), interleave.call(null, cljs.core.rest.call(null, s1__8976), cljs.core.rest.call(null, s2__8977))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8980__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8979 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8979)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8979), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8979)))
        }else {
          return null
        }
      }, null)
    };
    var G__8980 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8980__delegate.call(this, c1, c2, colls)
    };
    G__8980.cljs$lang$maxFixedArity = 2;
    G__8980.cljs$lang$applyTo = function(arglist__8981) {
      var c1 = cljs.core.first(arglist__8981);
      var c2 = cljs.core.first(cljs.core.next(arglist__8981));
      var colls = cljs.core.rest(cljs.core.next(arglist__8981));
      return G__8980__delegate(c1, c2, colls)
    };
    G__8980.cljs$lang$arity$variadic = G__8980__delegate;
    return G__8980
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
  var cat__8991 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8989 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8989) {
        var coll__8990 = temp__3971__auto____8989;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8990), cat.call(null, cljs.core.rest.call(null, coll__8990), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8991.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8992__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8992 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8992__delegate.call(this, f, coll, colls)
    };
    G__8992.cljs$lang$maxFixedArity = 2;
    G__8992.cljs$lang$applyTo = function(arglist__8993) {
      var f = cljs.core.first(arglist__8993);
      var coll = cljs.core.first(cljs.core.next(arglist__8993));
      var colls = cljs.core.rest(cljs.core.next(arglist__8993));
      return G__8992__delegate(f, coll, colls)
    };
    G__8992.cljs$lang$arity$variadic = G__8992__delegate;
    return G__8992
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
    var temp__3974__auto____9003 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9003) {
      var s__9004 = temp__3974__auto____9003;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__9004)) {
        var c__9005 = cljs.core.chunk_first.call(null, s__9004);
        var size__9006 = cljs.core.count.call(null, c__9005);
        var b__9007 = cljs.core.chunk_buffer.call(null, size__9006);
        var n__2527__auto____9008 = size__9006;
        var i__9009 = 0;
        while(true) {
          if(i__9009 < n__2527__auto____9008) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__9005, i__9009)))) {
              cljs.core.chunk_append.call(null, b__9007, cljs.core._nth.call(null, c__9005, i__9009))
            }else {
            }
            var G__9012 = i__9009 + 1;
            i__9009 = G__9012;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__9007), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__9004)))
      }else {
        var f__9010 = cljs.core.first.call(null, s__9004);
        var r__9011 = cljs.core.rest.call(null, s__9004);
        if(cljs.core.truth_(pred.call(null, f__9010))) {
          return cljs.core.cons.call(null, f__9010, filter.call(null, pred, r__9011))
        }else {
          return filter.call(null, pred, r__9011)
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
  var walk__9015 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__9015.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__9013_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__9013_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__9019__9020 = to;
    if(G__9019__9020) {
      if(function() {
        var or__3824__auto____9021 = G__9019__9020.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____9021) {
          return or__3824__auto____9021
        }else {
          return G__9019__9020.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__9019__9020.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9019__9020)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9019__9020)
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
    var G__9022__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__9022 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9022__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9022.cljs$lang$maxFixedArity = 4;
    G__9022.cljs$lang$applyTo = function(arglist__9023) {
      var f = cljs.core.first(arglist__9023);
      var c1 = cljs.core.first(cljs.core.next(arglist__9023));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9023)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9023))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9023))));
      return G__9022__delegate(f, c1, c2, c3, colls)
    };
    G__9022.cljs$lang$arity$variadic = G__9022__delegate;
    return G__9022
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
      var temp__3974__auto____9030 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9030) {
        var s__9031 = temp__3974__auto____9030;
        var p__9032 = cljs.core.take.call(null, n, s__9031);
        if(n === cljs.core.count.call(null, p__9032)) {
          return cljs.core.cons.call(null, p__9032, partition.call(null, n, step, cljs.core.drop.call(null, step, s__9031)))
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
      var temp__3974__auto____9033 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9033) {
        var s__9034 = temp__3974__auto____9033;
        var p__9035 = cljs.core.take.call(null, n, s__9034);
        if(n === cljs.core.count.call(null, p__9035)) {
          return cljs.core.cons.call(null, p__9035, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__9034)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__9035, pad)))
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
    var sentinel__9040 = cljs.core.lookup_sentinel;
    var m__9041 = m;
    var ks__9042 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__9042) {
        var m__9043 = cljs.core._lookup.call(null, m__9041, cljs.core.first.call(null, ks__9042), sentinel__9040);
        if(sentinel__9040 === m__9043) {
          return not_found
        }else {
          var G__9044 = sentinel__9040;
          var G__9045 = m__9043;
          var G__9046 = cljs.core.next.call(null, ks__9042);
          sentinel__9040 = G__9044;
          m__9041 = G__9045;
          ks__9042 = G__9046;
          continue
        }
      }else {
        return m__9041
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
cljs.core.assoc_in = function assoc_in(m, p__9047, v) {
  var vec__9052__9053 = p__9047;
  var k__9054 = cljs.core.nth.call(null, vec__9052__9053, 0, null);
  var ks__9055 = cljs.core.nthnext.call(null, vec__9052__9053, 1);
  if(cljs.core.truth_(ks__9055)) {
    return cljs.core.assoc.call(null, m, k__9054, assoc_in.call(null, cljs.core._lookup.call(null, m, k__9054, null), ks__9055, v))
  }else {
    return cljs.core.assoc.call(null, m, k__9054, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__9056, f, args) {
    var vec__9061__9062 = p__9056;
    var k__9063 = cljs.core.nth.call(null, vec__9061__9062, 0, null);
    var ks__9064 = cljs.core.nthnext.call(null, vec__9061__9062, 1);
    if(cljs.core.truth_(ks__9064)) {
      return cljs.core.assoc.call(null, m, k__9063, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__9063, null), ks__9064, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__9063, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__9063, null), args))
    }
  };
  var update_in = function(m, p__9056, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__9056, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__9065) {
    var m = cljs.core.first(arglist__9065);
    var p__9056 = cljs.core.first(cljs.core.next(arglist__9065));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9065)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9065)));
    return update_in__delegate(m, p__9056, f, args)
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
  var this__9068 = this;
  var h__2192__auto____9069 = this__9068.__hash;
  if(!(h__2192__auto____9069 == null)) {
    return h__2192__auto____9069
  }else {
    var h__2192__auto____9070 = cljs.core.hash_coll.call(null, coll);
    this__9068.__hash = h__2192__auto____9070;
    return h__2192__auto____9070
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9071 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9072 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9073 = this;
  var new_array__9074 = this__9073.array.slice();
  new_array__9074[k] = v;
  return new cljs.core.Vector(this__9073.meta, new_array__9074, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__9105 = null;
  var G__9105__2 = function(this_sym9075, k) {
    var this__9077 = this;
    var this_sym9075__9078 = this;
    var coll__9079 = this_sym9075__9078;
    return coll__9079.cljs$core$ILookup$_lookup$arity$2(coll__9079, k)
  };
  var G__9105__3 = function(this_sym9076, k, not_found) {
    var this__9077 = this;
    var this_sym9076__9080 = this;
    var coll__9081 = this_sym9076__9080;
    return coll__9081.cljs$core$ILookup$_lookup$arity$3(coll__9081, k, not_found)
  };
  G__9105 = function(this_sym9076, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9105__2.call(this, this_sym9076, k);
      case 3:
        return G__9105__3.call(this, this_sym9076, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9105
}();
cljs.core.Vector.prototype.apply = function(this_sym9066, args9067) {
  var this__9082 = this;
  return this_sym9066.call.apply(this_sym9066, [this_sym9066].concat(args9067.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9083 = this;
  var new_array__9084 = this__9083.array.slice();
  new_array__9084.push(o);
  return new cljs.core.Vector(this__9083.meta, new_array__9084, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__9085 = this;
  var this__9086 = this;
  return cljs.core.pr_str.call(null, this__9086)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__9087 = this;
  return cljs.core.ci_reduce.call(null, this__9087.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__9088 = this;
  return cljs.core.ci_reduce.call(null, this__9088.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9089 = this;
  if(this__9089.array.length > 0) {
    var vector_seq__9090 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__9089.array.length) {
          return cljs.core.cons.call(null, this__9089.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__9090.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9091 = this;
  return this__9091.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9092 = this;
  var count__9093 = this__9092.array.length;
  if(count__9093 > 0) {
    return this__9092.array[count__9093 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9094 = this;
  if(this__9094.array.length > 0) {
    var new_array__9095 = this__9094.array.slice();
    new_array__9095.pop();
    return new cljs.core.Vector(this__9094.meta, new_array__9095, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9096 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9097 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9098 = this;
  return new cljs.core.Vector(meta, this__9098.array, this__9098.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9099 = this;
  return this__9099.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9100 = this;
  if(function() {
    var and__3822__auto____9101 = 0 <= n;
    if(and__3822__auto____9101) {
      return n < this__9100.array.length
    }else {
      return and__3822__auto____9101
    }
  }()) {
    return this__9100.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9102 = this;
  if(function() {
    var and__3822__auto____9103 = 0 <= n;
    if(and__3822__auto____9103) {
      return n < this__9102.array.length
    }else {
      return and__3822__auto____9103
    }
  }()) {
    return this__9102.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9104 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__9104.meta)
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
  var cnt__9107 = pv.cnt;
  if(cnt__9107 < 32) {
    return 0
  }else {
    return cnt__9107 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__9113 = level;
  var ret__9114 = node;
  while(true) {
    if(ll__9113 === 0) {
      return ret__9114
    }else {
      var embed__9115 = ret__9114;
      var r__9116 = cljs.core.pv_fresh_node.call(null, edit);
      var ___9117 = cljs.core.pv_aset.call(null, r__9116, 0, embed__9115);
      var G__9118 = ll__9113 - 5;
      var G__9119 = r__9116;
      ll__9113 = G__9118;
      ret__9114 = G__9119;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__9125 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__9126 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__9125, subidx__9126, tailnode);
    return ret__9125
  }else {
    var child__9127 = cljs.core.pv_aget.call(null, parent, subidx__9126);
    if(!(child__9127 == null)) {
      var node_to_insert__9128 = push_tail.call(null, pv, level - 5, child__9127, tailnode);
      cljs.core.pv_aset.call(null, ret__9125, subidx__9126, node_to_insert__9128);
      return ret__9125
    }else {
      var node_to_insert__9129 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__9125, subidx__9126, node_to_insert__9129);
      return ret__9125
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____9133 = 0 <= i;
    if(and__3822__auto____9133) {
      return i < pv.cnt
    }else {
      return and__3822__auto____9133
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__9134 = pv.root;
      var level__9135 = pv.shift;
      while(true) {
        if(level__9135 > 0) {
          var G__9136 = cljs.core.pv_aget.call(null, node__9134, i >>> level__9135 & 31);
          var G__9137 = level__9135 - 5;
          node__9134 = G__9136;
          level__9135 = G__9137;
          continue
        }else {
          return node__9134.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__9140 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__9140, i & 31, val);
    return ret__9140
  }else {
    var subidx__9141 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__9140, subidx__9141, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__9141), i, val));
    return ret__9140
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__9147 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__9148 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__9147));
    if(function() {
      var and__3822__auto____9149 = new_child__9148 == null;
      if(and__3822__auto____9149) {
        return subidx__9147 === 0
      }else {
        return and__3822__auto____9149
      }
    }()) {
      return null
    }else {
      var ret__9150 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__9150, subidx__9147, new_child__9148);
      return ret__9150
    }
  }else {
    if(subidx__9147 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__9151 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__9151, subidx__9147, null);
        return ret__9151
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
  var this__9154 = this;
  return new cljs.core.TransientVector(this__9154.cnt, this__9154.shift, cljs.core.tv_editable_root.call(null, this__9154.root), cljs.core.tv_editable_tail.call(null, this__9154.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9155 = this;
  var h__2192__auto____9156 = this__9155.__hash;
  if(!(h__2192__auto____9156 == null)) {
    return h__2192__auto____9156
  }else {
    var h__2192__auto____9157 = cljs.core.hash_coll.call(null, coll);
    this__9155.__hash = h__2192__auto____9157;
    return h__2192__auto____9157
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9158 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9159 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9160 = this;
  if(function() {
    var and__3822__auto____9161 = 0 <= k;
    if(and__3822__auto____9161) {
      return k < this__9160.cnt
    }else {
      return and__3822__auto____9161
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__9162 = this__9160.tail.slice();
      new_tail__9162[k & 31] = v;
      return new cljs.core.PersistentVector(this__9160.meta, this__9160.cnt, this__9160.shift, this__9160.root, new_tail__9162, null)
    }else {
      return new cljs.core.PersistentVector(this__9160.meta, this__9160.cnt, this__9160.shift, cljs.core.do_assoc.call(null, coll, this__9160.shift, this__9160.root, k, v), this__9160.tail, null)
    }
  }else {
    if(k === this__9160.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__9160.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__9210 = null;
  var G__9210__2 = function(this_sym9163, k) {
    var this__9165 = this;
    var this_sym9163__9166 = this;
    var coll__9167 = this_sym9163__9166;
    return coll__9167.cljs$core$ILookup$_lookup$arity$2(coll__9167, k)
  };
  var G__9210__3 = function(this_sym9164, k, not_found) {
    var this__9165 = this;
    var this_sym9164__9168 = this;
    var coll__9169 = this_sym9164__9168;
    return coll__9169.cljs$core$ILookup$_lookup$arity$3(coll__9169, k, not_found)
  };
  G__9210 = function(this_sym9164, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9210__2.call(this, this_sym9164, k);
      case 3:
        return G__9210__3.call(this, this_sym9164, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9210
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym9152, args9153) {
  var this__9170 = this;
  return this_sym9152.call.apply(this_sym9152, [this_sym9152].concat(args9153.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__9171 = this;
  var step_init__9172 = [0, init];
  var i__9173 = 0;
  while(true) {
    if(i__9173 < this__9171.cnt) {
      var arr__9174 = cljs.core.array_for.call(null, v, i__9173);
      var len__9175 = arr__9174.length;
      var init__9179 = function() {
        var j__9176 = 0;
        var init__9177 = step_init__9172[1];
        while(true) {
          if(j__9176 < len__9175) {
            var init__9178 = f.call(null, init__9177, j__9176 + i__9173, arr__9174[j__9176]);
            if(cljs.core.reduced_QMARK_.call(null, init__9178)) {
              return init__9178
            }else {
              var G__9211 = j__9176 + 1;
              var G__9212 = init__9178;
              j__9176 = G__9211;
              init__9177 = G__9212;
              continue
            }
          }else {
            step_init__9172[0] = len__9175;
            step_init__9172[1] = init__9177;
            return init__9177
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9179)) {
        return cljs.core.deref.call(null, init__9179)
      }else {
        var G__9213 = i__9173 + step_init__9172[0];
        i__9173 = G__9213;
        continue
      }
    }else {
      return step_init__9172[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9180 = this;
  if(this__9180.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__9181 = this__9180.tail.slice();
    new_tail__9181.push(o);
    return new cljs.core.PersistentVector(this__9180.meta, this__9180.cnt + 1, this__9180.shift, this__9180.root, new_tail__9181, null)
  }else {
    var root_overflow_QMARK___9182 = this__9180.cnt >>> 5 > 1 << this__9180.shift;
    var new_shift__9183 = root_overflow_QMARK___9182 ? this__9180.shift + 5 : this__9180.shift;
    var new_root__9185 = root_overflow_QMARK___9182 ? function() {
      var n_r__9184 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__9184, 0, this__9180.root);
      cljs.core.pv_aset.call(null, n_r__9184, 1, cljs.core.new_path.call(null, null, this__9180.shift, new cljs.core.VectorNode(null, this__9180.tail)));
      return n_r__9184
    }() : cljs.core.push_tail.call(null, coll, this__9180.shift, this__9180.root, new cljs.core.VectorNode(null, this__9180.tail));
    return new cljs.core.PersistentVector(this__9180.meta, this__9180.cnt + 1, new_shift__9183, new_root__9185, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9186 = this;
  if(this__9186.cnt > 0) {
    return new cljs.core.RSeq(coll, this__9186.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__9187 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__9188 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__9189 = this;
  var this__9190 = this;
  return cljs.core.pr_str.call(null, this__9190)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__9191 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__9192 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9193 = this;
  if(this__9193.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9194 = this;
  return this__9194.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9195 = this;
  if(this__9195.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__9195.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9196 = this;
  if(this__9196.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__9196.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9196.meta)
    }else {
      if(1 < this__9196.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__9196.meta, this__9196.cnt - 1, this__9196.shift, this__9196.root, this__9196.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__9197 = cljs.core.array_for.call(null, coll, this__9196.cnt - 2);
          var nr__9198 = cljs.core.pop_tail.call(null, coll, this__9196.shift, this__9196.root);
          var new_root__9199 = nr__9198 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__9198;
          var cnt_1__9200 = this__9196.cnt - 1;
          if(function() {
            var and__3822__auto____9201 = 5 < this__9196.shift;
            if(and__3822__auto____9201) {
              return cljs.core.pv_aget.call(null, new_root__9199, 1) == null
            }else {
              return and__3822__auto____9201
            }
          }()) {
            return new cljs.core.PersistentVector(this__9196.meta, cnt_1__9200, this__9196.shift - 5, cljs.core.pv_aget.call(null, new_root__9199, 0), new_tail__9197, null)
          }else {
            return new cljs.core.PersistentVector(this__9196.meta, cnt_1__9200, this__9196.shift, new_root__9199, new_tail__9197, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9202 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9203 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9204 = this;
  return new cljs.core.PersistentVector(meta, this__9204.cnt, this__9204.shift, this__9204.root, this__9204.tail, this__9204.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9205 = this;
  return this__9205.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9206 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9207 = this;
  if(function() {
    var and__3822__auto____9208 = 0 <= n;
    if(and__3822__auto____9208) {
      return n < this__9207.cnt
    }else {
      return and__3822__auto____9208
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9209 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9209.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__9214 = xs.length;
  var xs__9215 = no_clone === true ? xs : xs.slice();
  if(l__9214 < 32) {
    return new cljs.core.PersistentVector(null, l__9214, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__9215, null)
  }else {
    var node__9216 = xs__9215.slice(0, 32);
    var v__9217 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__9216, null);
    var i__9218 = 32;
    var out__9219 = cljs.core._as_transient.call(null, v__9217);
    while(true) {
      if(i__9218 < l__9214) {
        var G__9220 = i__9218 + 1;
        var G__9221 = cljs.core.conj_BANG_.call(null, out__9219, xs__9215[i__9218]);
        i__9218 = G__9220;
        out__9219 = G__9221;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9219)
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
  vector.cljs$lang$applyTo = function(arglist__9222) {
    var args = cljs.core.seq(arglist__9222);
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
  var this__9223 = this;
  if(this__9223.off + 1 < this__9223.node.length) {
    var s__9224 = cljs.core.chunked_seq.call(null, this__9223.vec, this__9223.node, this__9223.i, this__9223.off + 1);
    if(s__9224 == null) {
      return null
    }else {
      return s__9224
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9225 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9226 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9227 = this;
  return this__9227.node[this__9227.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9228 = this;
  if(this__9228.off + 1 < this__9228.node.length) {
    var s__9229 = cljs.core.chunked_seq.call(null, this__9228.vec, this__9228.node, this__9228.i, this__9228.off + 1);
    if(s__9229 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__9229
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__9230 = this;
  var l__9231 = this__9230.node.length;
  var s__9232 = this__9230.i + l__9231 < cljs.core._count.call(null, this__9230.vec) ? cljs.core.chunked_seq.call(null, this__9230.vec, this__9230.i + l__9231, 0) : null;
  if(s__9232 == null) {
    return null
  }else {
    return s__9232
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9233 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__9234 = this;
  return cljs.core.chunked_seq.call(null, this__9234.vec, this__9234.node, this__9234.i, this__9234.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__9235 = this;
  return this__9235.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9236 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9236.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__9237 = this;
  return cljs.core.array_chunk.call(null, this__9237.node, this__9237.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__9238 = this;
  var l__9239 = this__9238.node.length;
  var s__9240 = this__9238.i + l__9239 < cljs.core._count.call(null, this__9238.vec) ? cljs.core.chunked_seq.call(null, this__9238.vec, this__9238.i + l__9239, 0) : null;
  if(s__9240 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__9240
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
  var this__9243 = this;
  var h__2192__auto____9244 = this__9243.__hash;
  if(!(h__2192__auto____9244 == null)) {
    return h__2192__auto____9244
  }else {
    var h__2192__auto____9245 = cljs.core.hash_coll.call(null, coll);
    this__9243.__hash = h__2192__auto____9245;
    return h__2192__auto____9245
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9246 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9247 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__9248 = this;
  var v_pos__9249 = this__9248.start + key;
  return new cljs.core.Subvec(this__9248.meta, cljs.core._assoc.call(null, this__9248.v, v_pos__9249, val), this__9248.start, this__9248.end > v_pos__9249 + 1 ? this__9248.end : v_pos__9249 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__9275 = null;
  var G__9275__2 = function(this_sym9250, k) {
    var this__9252 = this;
    var this_sym9250__9253 = this;
    var coll__9254 = this_sym9250__9253;
    return coll__9254.cljs$core$ILookup$_lookup$arity$2(coll__9254, k)
  };
  var G__9275__3 = function(this_sym9251, k, not_found) {
    var this__9252 = this;
    var this_sym9251__9255 = this;
    var coll__9256 = this_sym9251__9255;
    return coll__9256.cljs$core$ILookup$_lookup$arity$3(coll__9256, k, not_found)
  };
  G__9275 = function(this_sym9251, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9275__2.call(this, this_sym9251, k);
      case 3:
        return G__9275__3.call(this, this_sym9251, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9275
}();
cljs.core.Subvec.prototype.apply = function(this_sym9241, args9242) {
  var this__9257 = this;
  return this_sym9241.call.apply(this_sym9241, [this_sym9241].concat(args9242.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9258 = this;
  return new cljs.core.Subvec(this__9258.meta, cljs.core._assoc_n.call(null, this__9258.v, this__9258.end, o), this__9258.start, this__9258.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__9259 = this;
  var this__9260 = this;
  return cljs.core.pr_str.call(null, this__9260)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__9261 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__9262 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9263 = this;
  var subvec_seq__9264 = function subvec_seq(i) {
    if(i === this__9263.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__9263.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__9264.call(null, this__9263.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9265 = this;
  return this__9265.end - this__9265.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9266 = this;
  return cljs.core._nth.call(null, this__9266.v, this__9266.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9267 = this;
  if(this__9267.start === this__9267.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__9267.meta, this__9267.v, this__9267.start, this__9267.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9268 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9269 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9270 = this;
  return new cljs.core.Subvec(meta, this__9270.v, this__9270.start, this__9270.end, this__9270.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9271 = this;
  return this__9271.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9272 = this;
  return cljs.core._nth.call(null, this__9272.v, this__9272.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9273 = this;
  return cljs.core._nth.call(null, this__9273.v, this__9273.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9274 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__9274.meta)
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
  var ret__9277 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__9277, 0, tl.length);
  return ret__9277
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__9281 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__9282 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__9281, subidx__9282, level === 5 ? tail_node : function() {
    var child__9283 = cljs.core.pv_aget.call(null, ret__9281, subidx__9282);
    if(!(child__9283 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__9283, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__9281
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__9288 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__9289 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__9290 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__9288, subidx__9289));
    if(function() {
      var and__3822__auto____9291 = new_child__9290 == null;
      if(and__3822__auto____9291) {
        return subidx__9289 === 0
      }else {
        return and__3822__auto____9291
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__9288, subidx__9289, new_child__9290);
      return node__9288
    }
  }else {
    if(subidx__9289 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__9288, subidx__9289, null);
        return node__9288
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____9296 = 0 <= i;
    if(and__3822__auto____9296) {
      return i < tv.cnt
    }else {
      return and__3822__auto____9296
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__9297 = tv.root;
      var node__9298 = root__9297;
      var level__9299 = tv.shift;
      while(true) {
        if(level__9299 > 0) {
          var G__9300 = cljs.core.tv_ensure_editable.call(null, root__9297.edit, cljs.core.pv_aget.call(null, node__9298, i >>> level__9299 & 31));
          var G__9301 = level__9299 - 5;
          node__9298 = G__9300;
          level__9299 = G__9301;
          continue
        }else {
          return node__9298.arr
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
  var G__9341 = null;
  var G__9341__2 = function(this_sym9304, k) {
    var this__9306 = this;
    var this_sym9304__9307 = this;
    var coll__9308 = this_sym9304__9307;
    return coll__9308.cljs$core$ILookup$_lookup$arity$2(coll__9308, k)
  };
  var G__9341__3 = function(this_sym9305, k, not_found) {
    var this__9306 = this;
    var this_sym9305__9309 = this;
    var coll__9310 = this_sym9305__9309;
    return coll__9310.cljs$core$ILookup$_lookup$arity$3(coll__9310, k, not_found)
  };
  G__9341 = function(this_sym9305, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9341__2.call(this, this_sym9305, k);
      case 3:
        return G__9341__3.call(this, this_sym9305, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9341
}();
cljs.core.TransientVector.prototype.apply = function(this_sym9302, args9303) {
  var this__9311 = this;
  return this_sym9302.call.apply(this_sym9302, [this_sym9302].concat(args9303.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9312 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9313 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9314 = this;
  if(this__9314.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9315 = this;
  if(function() {
    var and__3822__auto____9316 = 0 <= n;
    if(and__3822__auto____9316) {
      return n < this__9315.cnt
    }else {
      return and__3822__auto____9316
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9317 = this;
  if(this__9317.root.edit) {
    return this__9317.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__9318 = this;
  if(this__9318.root.edit) {
    if(function() {
      var and__3822__auto____9319 = 0 <= n;
      if(and__3822__auto____9319) {
        return n < this__9318.cnt
      }else {
        return and__3822__auto____9319
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__9318.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__9324 = function go(level, node) {
          var node__9322 = cljs.core.tv_ensure_editable.call(null, this__9318.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__9322, n & 31, val);
            return node__9322
          }else {
            var subidx__9323 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__9322, subidx__9323, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__9322, subidx__9323)));
            return node__9322
          }
        }.call(null, this__9318.shift, this__9318.root);
        this__9318.root = new_root__9324;
        return tcoll
      }
    }else {
      if(n === this__9318.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__9318.cnt)].join(""));
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
  var this__9325 = this;
  if(this__9325.root.edit) {
    if(this__9325.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__9325.cnt) {
        this__9325.cnt = 0;
        return tcoll
      }else {
        if((this__9325.cnt - 1 & 31) > 0) {
          this__9325.cnt = this__9325.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__9326 = cljs.core.editable_array_for.call(null, tcoll, this__9325.cnt - 2);
            var new_root__9328 = function() {
              var nr__9327 = cljs.core.tv_pop_tail.call(null, tcoll, this__9325.shift, this__9325.root);
              if(!(nr__9327 == null)) {
                return nr__9327
              }else {
                return new cljs.core.VectorNode(this__9325.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____9329 = 5 < this__9325.shift;
              if(and__3822__auto____9329) {
                return cljs.core.pv_aget.call(null, new_root__9328, 1) == null
              }else {
                return and__3822__auto____9329
              }
            }()) {
              var new_root__9330 = cljs.core.tv_ensure_editable.call(null, this__9325.root.edit, cljs.core.pv_aget.call(null, new_root__9328, 0));
              this__9325.root = new_root__9330;
              this__9325.shift = this__9325.shift - 5;
              this__9325.cnt = this__9325.cnt - 1;
              this__9325.tail = new_tail__9326;
              return tcoll
            }else {
              this__9325.root = new_root__9328;
              this__9325.cnt = this__9325.cnt - 1;
              this__9325.tail = new_tail__9326;
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
  var this__9331 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9332 = this;
  if(this__9332.root.edit) {
    if(this__9332.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__9332.tail[this__9332.cnt & 31] = o;
      this__9332.cnt = this__9332.cnt + 1;
      return tcoll
    }else {
      var tail_node__9333 = new cljs.core.VectorNode(this__9332.root.edit, this__9332.tail);
      var new_tail__9334 = cljs.core.make_array.call(null, 32);
      new_tail__9334[0] = o;
      this__9332.tail = new_tail__9334;
      if(this__9332.cnt >>> 5 > 1 << this__9332.shift) {
        var new_root_array__9335 = cljs.core.make_array.call(null, 32);
        var new_shift__9336 = this__9332.shift + 5;
        new_root_array__9335[0] = this__9332.root;
        new_root_array__9335[1] = cljs.core.new_path.call(null, this__9332.root.edit, this__9332.shift, tail_node__9333);
        this__9332.root = new cljs.core.VectorNode(this__9332.root.edit, new_root_array__9335);
        this__9332.shift = new_shift__9336;
        this__9332.cnt = this__9332.cnt + 1;
        return tcoll
      }else {
        var new_root__9337 = cljs.core.tv_push_tail.call(null, tcoll, this__9332.shift, this__9332.root, tail_node__9333);
        this__9332.root = new_root__9337;
        this__9332.cnt = this__9332.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9338 = this;
  if(this__9338.root.edit) {
    this__9338.root.edit = null;
    var len__9339 = this__9338.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__9340 = cljs.core.make_array.call(null, len__9339);
    cljs.core.array_copy.call(null, this__9338.tail, 0, trimmed_tail__9340, 0, len__9339);
    return new cljs.core.PersistentVector(null, this__9338.cnt, this__9338.shift, this__9338.root, trimmed_tail__9340, null)
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
  var this__9342 = this;
  var h__2192__auto____9343 = this__9342.__hash;
  if(!(h__2192__auto____9343 == null)) {
    return h__2192__auto____9343
  }else {
    var h__2192__auto____9344 = cljs.core.hash_coll.call(null, coll);
    this__9342.__hash = h__2192__auto____9344;
    return h__2192__auto____9344
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9345 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__9346 = this;
  var this__9347 = this;
  return cljs.core.pr_str.call(null, this__9347)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9348 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9349 = this;
  return cljs.core._first.call(null, this__9349.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9350 = this;
  var temp__3971__auto____9351 = cljs.core.next.call(null, this__9350.front);
  if(temp__3971__auto____9351) {
    var f1__9352 = temp__3971__auto____9351;
    return new cljs.core.PersistentQueueSeq(this__9350.meta, f1__9352, this__9350.rear, null)
  }else {
    if(this__9350.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__9350.meta, this__9350.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9353 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9354 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__9354.front, this__9354.rear, this__9354.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9355 = this;
  return this__9355.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9356 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9356.meta)
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
  var this__9357 = this;
  var h__2192__auto____9358 = this__9357.__hash;
  if(!(h__2192__auto____9358 == null)) {
    return h__2192__auto____9358
  }else {
    var h__2192__auto____9359 = cljs.core.hash_coll.call(null, coll);
    this__9357.__hash = h__2192__auto____9359;
    return h__2192__auto____9359
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9360 = this;
  if(cljs.core.truth_(this__9360.front)) {
    return new cljs.core.PersistentQueue(this__9360.meta, this__9360.count + 1, this__9360.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____9361 = this__9360.rear;
      if(cljs.core.truth_(or__3824__auto____9361)) {
        return or__3824__auto____9361
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__9360.meta, this__9360.count + 1, cljs.core.conj.call(null, this__9360.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__9362 = this;
  var this__9363 = this;
  return cljs.core.pr_str.call(null, this__9363)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9364 = this;
  var rear__9365 = cljs.core.seq.call(null, this__9364.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____9366 = this__9364.front;
    if(cljs.core.truth_(or__3824__auto____9366)) {
      return or__3824__auto____9366
    }else {
      return rear__9365
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__9364.front, cljs.core.seq.call(null, rear__9365), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9367 = this;
  return this__9367.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9368 = this;
  return cljs.core._first.call(null, this__9368.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9369 = this;
  if(cljs.core.truth_(this__9369.front)) {
    var temp__3971__auto____9370 = cljs.core.next.call(null, this__9369.front);
    if(temp__3971__auto____9370) {
      var f1__9371 = temp__3971__auto____9370;
      return new cljs.core.PersistentQueue(this__9369.meta, this__9369.count - 1, f1__9371, this__9369.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__9369.meta, this__9369.count - 1, cljs.core.seq.call(null, this__9369.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9372 = this;
  return cljs.core.first.call(null, this__9372.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9373 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9374 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9375 = this;
  return new cljs.core.PersistentQueue(meta, this__9375.count, this__9375.front, this__9375.rear, this__9375.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9376 = this;
  return this__9376.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9377 = this;
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
  var this__9378 = this;
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
  var len__9381 = array.length;
  var i__9382 = 0;
  while(true) {
    if(i__9382 < len__9381) {
      if(k === array[i__9382]) {
        return i__9382
      }else {
        var G__9383 = i__9382 + incr;
        i__9382 = G__9383;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__9386 = cljs.core.hash.call(null, a);
  var b__9387 = cljs.core.hash.call(null, b);
  if(a__9386 < b__9387) {
    return-1
  }else {
    if(a__9386 > b__9387) {
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
  var ks__9395 = m.keys;
  var len__9396 = ks__9395.length;
  var so__9397 = m.strobj;
  var out__9398 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__9399 = 0;
  var out__9400 = cljs.core.transient$.call(null, out__9398);
  while(true) {
    if(i__9399 < len__9396) {
      var k__9401 = ks__9395[i__9399];
      var G__9402 = i__9399 + 1;
      var G__9403 = cljs.core.assoc_BANG_.call(null, out__9400, k__9401, so__9397[k__9401]);
      i__9399 = G__9402;
      out__9400 = G__9403;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__9400, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__9409 = {};
  var l__9410 = ks.length;
  var i__9411 = 0;
  while(true) {
    if(i__9411 < l__9410) {
      var k__9412 = ks[i__9411];
      new_obj__9409[k__9412] = obj[k__9412];
      var G__9413 = i__9411 + 1;
      i__9411 = G__9413;
      continue
    }else {
    }
    break
  }
  return new_obj__9409
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
  var this__9416 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9417 = this;
  var h__2192__auto____9418 = this__9417.__hash;
  if(!(h__2192__auto____9418 == null)) {
    return h__2192__auto____9418
  }else {
    var h__2192__auto____9419 = cljs.core.hash_imap.call(null, coll);
    this__9417.__hash = h__2192__auto____9419;
    return h__2192__auto____9419
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9420 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9421 = this;
  if(function() {
    var and__3822__auto____9422 = goog.isString(k);
    if(and__3822__auto____9422) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9421.keys) == null)
    }else {
      return and__3822__auto____9422
    }
  }()) {
    return this__9421.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9423 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____9424 = this__9423.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____9424) {
        return or__3824__auto____9424
      }else {
        return this__9423.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__9423.keys) == null)) {
        var new_strobj__9425 = cljs.core.obj_clone.call(null, this__9423.strobj, this__9423.keys);
        new_strobj__9425[k] = v;
        return new cljs.core.ObjMap(this__9423.meta, this__9423.keys, new_strobj__9425, this__9423.update_count + 1, null)
      }else {
        var new_strobj__9426 = cljs.core.obj_clone.call(null, this__9423.strobj, this__9423.keys);
        var new_keys__9427 = this__9423.keys.slice();
        new_strobj__9426[k] = v;
        new_keys__9427.push(k);
        return new cljs.core.ObjMap(this__9423.meta, new_keys__9427, new_strobj__9426, this__9423.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9428 = this;
  if(function() {
    var and__3822__auto____9429 = goog.isString(k);
    if(and__3822__auto____9429) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9428.keys) == null)
    }else {
      return and__3822__auto____9429
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__9451 = null;
  var G__9451__2 = function(this_sym9430, k) {
    var this__9432 = this;
    var this_sym9430__9433 = this;
    var coll__9434 = this_sym9430__9433;
    return coll__9434.cljs$core$ILookup$_lookup$arity$2(coll__9434, k)
  };
  var G__9451__3 = function(this_sym9431, k, not_found) {
    var this__9432 = this;
    var this_sym9431__9435 = this;
    var coll__9436 = this_sym9431__9435;
    return coll__9436.cljs$core$ILookup$_lookup$arity$3(coll__9436, k, not_found)
  };
  G__9451 = function(this_sym9431, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9451__2.call(this, this_sym9431, k);
      case 3:
        return G__9451__3.call(this, this_sym9431, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9451
}();
cljs.core.ObjMap.prototype.apply = function(this_sym9414, args9415) {
  var this__9437 = this;
  return this_sym9414.call.apply(this_sym9414, [this_sym9414].concat(args9415.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9438 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__9439 = this;
  var this__9440 = this;
  return cljs.core.pr_str.call(null, this__9440)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9441 = this;
  if(this__9441.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__9404_SHARP_) {
      return cljs.core.vector.call(null, p1__9404_SHARP_, this__9441.strobj[p1__9404_SHARP_])
    }, this__9441.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9442 = this;
  return this__9442.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9443 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9444 = this;
  return new cljs.core.ObjMap(meta, this__9444.keys, this__9444.strobj, this__9444.update_count, this__9444.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9445 = this;
  return this__9445.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9446 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__9446.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9447 = this;
  if(function() {
    var and__3822__auto____9448 = goog.isString(k);
    if(and__3822__auto____9448) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9447.keys) == null)
    }else {
      return and__3822__auto____9448
    }
  }()) {
    var new_keys__9449 = this__9447.keys.slice();
    var new_strobj__9450 = cljs.core.obj_clone.call(null, this__9447.strobj, this__9447.keys);
    new_keys__9449.splice(cljs.core.scan_array.call(null, 1, k, new_keys__9449), 1);
    cljs.core.js_delete.call(null, new_strobj__9450, k);
    return new cljs.core.ObjMap(this__9447.meta, new_keys__9449, new_strobj__9450, this__9447.update_count + 1, null)
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
  var this__9455 = this;
  var h__2192__auto____9456 = this__9455.__hash;
  if(!(h__2192__auto____9456 == null)) {
    return h__2192__auto____9456
  }else {
    var h__2192__auto____9457 = cljs.core.hash_imap.call(null, coll);
    this__9455.__hash = h__2192__auto____9457;
    return h__2192__auto____9457
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9458 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9459 = this;
  var bucket__9460 = this__9459.hashobj[cljs.core.hash.call(null, k)];
  var i__9461 = cljs.core.truth_(bucket__9460) ? cljs.core.scan_array.call(null, 2, k, bucket__9460) : null;
  if(cljs.core.truth_(i__9461)) {
    return bucket__9460[i__9461 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9462 = this;
  var h__9463 = cljs.core.hash.call(null, k);
  var bucket__9464 = this__9462.hashobj[h__9463];
  if(cljs.core.truth_(bucket__9464)) {
    var new_bucket__9465 = bucket__9464.slice();
    var new_hashobj__9466 = goog.object.clone(this__9462.hashobj);
    new_hashobj__9466[h__9463] = new_bucket__9465;
    var temp__3971__auto____9467 = cljs.core.scan_array.call(null, 2, k, new_bucket__9465);
    if(cljs.core.truth_(temp__3971__auto____9467)) {
      var i__9468 = temp__3971__auto____9467;
      new_bucket__9465[i__9468 + 1] = v;
      return new cljs.core.HashMap(this__9462.meta, this__9462.count, new_hashobj__9466, null)
    }else {
      new_bucket__9465.push(k, v);
      return new cljs.core.HashMap(this__9462.meta, this__9462.count + 1, new_hashobj__9466, null)
    }
  }else {
    var new_hashobj__9469 = goog.object.clone(this__9462.hashobj);
    new_hashobj__9469[h__9463] = [k, v];
    return new cljs.core.HashMap(this__9462.meta, this__9462.count + 1, new_hashobj__9469, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9470 = this;
  var bucket__9471 = this__9470.hashobj[cljs.core.hash.call(null, k)];
  var i__9472 = cljs.core.truth_(bucket__9471) ? cljs.core.scan_array.call(null, 2, k, bucket__9471) : null;
  if(cljs.core.truth_(i__9472)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__9497 = null;
  var G__9497__2 = function(this_sym9473, k) {
    var this__9475 = this;
    var this_sym9473__9476 = this;
    var coll__9477 = this_sym9473__9476;
    return coll__9477.cljs$core$ILookup$_lookup$arity$2(coll__9477, k)
  };
  var G__9497__3 = function(this_sym9474, k, not_found) {
    var this__9475 = this;
    var this_sym9474__9478 = this;
    var coll__9479 = this_sym9474__9478;
    return coll__9479.cljs$core$ILookup$_lookup$arity$3(coll__9479, k, not_found)
  };
  G__9497 = function(this_sym9474, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9497__2.call(this, this_sym9474, k);
      case 3:
        return G__9497__3.call(this, this_sym9474, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9497
}();
cljs.core.HashMap.prototype.apply = function(this_sym9453, args9454) {
  var this__9480 = this;
  return this_sym9453.call.apply(this_sym9453, [this_sym9453].concat(args9454.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9481 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__9482 = this;
  var this__9483 = this;
  return cljs.core.pr_str.call(null, this__9483)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9484 = this;
  if(this__9484.count > 0) {
    var hashes__9485 = cljs.core.js_keys.call(null, this__9484.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__9452_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__9484.hashobj[p1__9452_SHARP_]))
    }, hashes__9485)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9486 = this;
  return this__9486.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9487 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9488 = this;
  return new cljs.core.HashMap(meta, this__9488.count, this__9488.hashobj, this__9488.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9489 = this;
  return this__9489.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9490 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__9490.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9491 = this;
  var h__9492 = cljs.core.hash.call(null, k);
  var bucket__9493 = this__9491.hashobj[h__9492];
  var i__9494 = cljs.core.truth_(bucket__9493) ? cljs.core.scan_array.call(null, 2, k, bucket__9493) : null;
  if(cljs.core.not.call(null, i__9494)) {
    return coll
  }else {
    var new_hashobj__9495 = goog.object.clone(this__9491.hashobj);
    if(3 > bucket__9493.length) {
      cljs.core.js_delete.call(null, new_hashobj__9495, h__9492)
    }else {
      var new_bucket__9496 = bucket__9493.slice();
      new_bucket__9496.splice(i__9494, 2);
      new_hashobj__9495[h__9492] = new_bucket__9496
    }
    return new cljs.core.HashMap(this__9491.meta, this__9491.count - 1, new_hashobj__9495, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__9498 = ks.length;
  var i__9499 = 0;
  var out__9500 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__9499 < len__9498) {
      var G__9501 = i__9499 + 1;
      var G__9502 = cljs.core.assoc.call(null, out__9500, ks[i__9499], vs[i__9499]);
      i__9499 = G__9501;
      out__9500 = G__9502;
      continue
    }else {
      return out__9500
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__9506 = m.arr;
  var len__9507 = arr__9506.length;
  var i__9508 = 0;
  while(true) {
    if(len__9507 <= i__9508) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__9506[i__9508], k)) {
        return i__9508
      }else {
        if("\ufdd0'else") {
          var G__9509 = i__9508 + 2;
          i__9508 = G__9509;
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
  var this__9512 = this;
  return new cljs.core.TransientArrayMap({}, this__9512.arr.length, this__9512.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9513 = this;
  var h__2192__auto____9514 = this__9513.__hash;
  if(!(h__2192__auto____9514 == null)) {
    return h__2192__auto____9514
  }else {
    var h__2192__auto____9515 = cljs.core.hash_imap.call(null, coll);
    this__9513.__hash = h__2192__auto____9515;
    return h__2192__auto____9515
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9516 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9517 = this;
  var idx__9518 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9518 === -1) {
    return not_found
  }else {
    return this__9517.arr[idx__9518 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9519 = this;
  var idx__9520 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9520 === -1) {
    if(this__9519.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__9519.meta, this__9519.cnt + 1, function() {
        var G__9521__9522 = this__9519.arr.slice();
        G__9521__9522.push(k);
        G__9521__9522.push(v);
        return G__9521__9522
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__9519.arr[idx__9520 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__9519.meta, this__9519.cnt, function() {
          var G__9523__9524 = this__9519.arr.slice();
          G__9523__9524[idx__9520 + 1] = v;
          return G__9523__9524
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9525 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__9557 = null;
  var G__9557__2 = function(this_sym9526, k) {
    var this__9528 = this;
    var this_sym9526__9529 = this;
    var coll__9530 = this_sym9526__9529;
    return coll__9530.cljs$core$ILookup$_lookup$arity$2(coll__9530, k)
  };
  var G__9557__3 = function(this_sym9527, k, not_found) {
    var this__9528 = this;
    var this_sym9527__9531 = this;
    var coll__9532 = this_sym9527__9531;
    return coll__9532.cljs$core$ILookup$_lookup$arity$3(coll__9532, k, not_found)
  };
  G__9557 = function(this_sym9527, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9557__2.call(this, this_sym9527, k);
      case 3:
        return G__9557__3.call(this, this_sym9527, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9557
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym9510, args9511) {
  var this__9533 = this;
  return this_sym9510.call.apply(this_sym9510, [this_sym9510].concat(args9511.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9534 = this;
  var len__9535 = this__9534.arr.length;
  var i__9536 = 0;
  var init__9537 = init;
  while(true) {
    if(i__9536 < len__9535) {
      var init__9538 = f.call(null, init__9537, this__9534.arr[i__9536], this__9534.arr[i__9536 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__9538)) {
        return cljs.core.deref.call(null, init__9538)
      }else {
        var G__9558 = i__9536 + 2;
        var G__9559 = init__9538;
        i__9536 = G__9558;
        init__9537 = G__9559;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9539 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__9540 = this;
  var this__9541 = this;
  return cljs.core.pr_str.call(null, this__9541)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9542 = this;
  if(this__9542.cnt > 0) {
    var len__9543 = this__9542.arr.length;
    var array_map_seq__9544 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__9543) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__9542.arr[i], this__9542.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__9544.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9545 = this;
  return this__9545.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9546 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9547 = this;
  return new cljs.core.PersistentArrayMap(meta, this__9547.cnt, this__9547.arr, this__9547.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9548 = this;
  return this__9548.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9549 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__9549.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9550 = this;
  var idx__9551 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9551 >= 0) {
    var len__9552 = this__9550.arr.length;
    var new_len__9553 = len__9552 - 2;
    if(new_len__9553 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__9554 = cljs.core.make_array.call(null, new_len__9553);
      var s__9555 = 0;
      var d__9556 = 0;
      while(true) {
        if(s__9555 >= len__9552) {
          return new cljs.core.PersistentArrayMap(this__9550.meta, this__9550.cnt - 1, new_arr__9554, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__9550.arr[s__9555])) {
            var G__9560 = s__9555 + 2;
            var G__9561 = d__9556;
            s__9555 = G__9560;
            d__9556 = G__9561;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__9554[d__9556] = this__9550.arr[s__9555];
              new_arr__9554[d__9556 + 1] = this__9550.arr[s__9555 + 1];
              var G__9562 = s__9555 + 2;
              var G__9563 = d__9556 + 2;
              s__9555 = G__9562;
              d__9556 = G__9563;
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
  var len__9564 = cljs.core.count.call(null, ks);
  var i__9565 = 0;
  var out__9566 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__9565 < len__9564) {
      var G__9567 = i__9565 + 1;
      var G__9568 = cljs.core.assoc_BANG_.call(null, out__9566, ks[i__9565], vs[i__9565]);
      i__9565 = G__9567;
      out__9566 = G__9568;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9566)
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
  var this__9569 = this;
  if(cljs.core.truth_(this__9569.editable_QMARK_)) {
    var idx__9570 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9570 >= 0) {
      this__9569.arr[idx__9570] = this__9569.arr[this__9569.len - 2];
      this__9569.arr[idx__9570 + 1] = this__9569.arr[this__9569.len - 1];
      var G__9571__9572 = this__9569.arr;
      G__9571__9572.pop();
      G__9571__9572.pop();
      G__9571__9572;
      this__9569.len = this__9569.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9573 = this;
  if(cljs.core.truth_(this__9573.editable_QMARK_)) {
    var idx__9574 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9574 === -1) {
      if(this__9573.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__9573.len = this__9573.len + 2;
        this__9573.arr.push(key);
        this__9573.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__9573.len, this__9573.arr), key, val)
      }
    }else {
      if(val === this__9573.arr[idx__9574 + 1]) {
        return tcoll
      }else {
        this__9573.arr[idx__9574 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9575 = this;
  if(cljs.core.truth_(this__9575.editable_QMARK_)) {
    if(function() {
      var G__9576__9577 = o;
      if(G__9576__9577) {
        if(function() {
          var or__3824__auto____9578 = G__9576__9577.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9578) {
            return or__3824__auto____9578
          }else {
            return G__9576__9577.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9576__9577.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9576__9577)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9576__9577)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9579 = cljs.core.seq.call(null, o);
      var tcoll__9580 = tcoll;
      while(true) {
        var temp__3971__auto____9581 = cljs.core.first.call(null, es__9579);
        if(cljs.core.truth_(temp__3971__auto____9581)) {
          var e__9582 = temp__3971__auto____9581;
          var G__9588 = cljs.core.next.call(null, es__9579);
          var G__9589 = tcoll__9580.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__9580, cljs.core.key.call(null, e__9582), cljs.core.val.call(null, e__9582));
          es__9579 = G__9588;
          tcoll__9580 = G__9589;
          continue
        }else {
          return tcoll__9580
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9583 = this;
  if(cljs.core.truth_(this__9583.editable_QMARK_)) {
    this__9583.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__9583.len, 2), this__9583.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9584 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9585 = this;
  if(cljs.core.truth_(this__9585.editable_QMARK_)) {
    var idx__9586 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__9586 === -1) {
      return not_found
    }else {
      return this__9585.arr[idx__9586 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9587 = this;
  if(cljs.core.truth_(this__9587.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__9587.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__9592 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__9593 = 0;
  while(true) {
    if(i__9593 < len) {
      var G__9594 = cljs.core.assoc_BANG_.call(null, out__9592, arr[i__9593], arr[i__9593 + 1]);
      var G__9595 = i__9593 + 2;
      out__9592 = G__9594;
      i__9593 = G__9595;
      continue
    }else {
      return out__9592
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
    var G__9600__9601 = arr.slice();
    G__9600__9601[i] = a;
    return G__9600__9601
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__9602__9603 = arr.slice();
    G__9602__9603[i] = a;
    G__9602__9603[j] = b;
    return G__9602__9603
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
  var new_arr__9605 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__9605, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__9605, 2 * i, new_arr__9605.length - 2 * i);
  return new_arr__9605
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
    var editable__9608 = inode.ensure_editable(edit);
    editable__9608.arr[i] = a;
    return editable__9608
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__9609 = inode.ensure_editable(edit);
    editable__9609.arr[i] = a;
    editable__9609.arr[j] = b;
    return editable__9609
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
  var len__9616 = arr.length;
  var i__9617 = 0;
  var init__9618 = init;
  while(true) {
    if(i__9617 < len__9616) {
      var init__9621 = function() {
        var k__9619 = arr[i__9617];
        if(!(k__9619 == null)) {
          return f.call(null, init__9618, k__9619, arr[i__9617 + 1])
        }else {
          var node__9620 = arr[i__9617 + 1];
          if(!(node__9620 == null)) {
            return node__9620.kv_reduce(f, init__9618)
          }else {
            return init__9618
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9621)) {
        return cljs.core.deref.call(null, init__9621)
      }else {
        var G__9622 = i__9617 + 2;
        var G__9623 = init__9621;
        i__9617 = G__9622;
        init__9618 = G__9623;
        continue
      }
    }else {
      return init__9618
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
  var this__9624 = this;
  var inode__9625 = this;
  if(this__9624.bitmap === bit) {
    return null
  }else {
    var editable__9626 = inode__9625.ensure_editable(e);
    var earr__9627 = editable__9626.arr;
    var len__9628 = earr__9627.length;
    editable__9626.bitmap = bit ^ editable__9626.bitmap;
    cljs.core.array_copy.call(null, earr__9627, 2 * (i + 1), earr__9627, 2 * i, len__9628 - 2 * (i + 1));
    earr__9627[len__9628 - 2] = null;
    earr__9627[len__9628 - 1] = null;
    return editable__9626
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9629 = this;
  var inode__9630 = this;
  var bit__9631 = 1 << (hash >>> shift & 31);
  var idx__9632 = cljs.core.bitmap_indexed_node_index.call(null, this__9629.bitmap, bit__9631);
  if((this__9629.bitmap & bit__9631) === 0) {
    var n__9633 = cljs.core.bit_count.call(null, this__9629.bitmap);
    if(2 * n__9633 < this__9629.arr.length) {
      var editable__9634 = inode__9630.ensure_editable(edit);
      var earr__9635 = editable__9634.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__9635, 2 * idx__9632, earr__9635, 2 * (idx__9632 + 1), 2 * (n__9633 - idx__9632));
      earr__9635[2 * idx__9632] = key;
      earr__9635[2 * idx__9632 + 1] = val;
      editable__9634.bitmap = editable__9634.bitmap | bit__9631;
      return editable__9634
    }else {
      if(n__9633 >= 16) {
        var nodes__9636 = cljs.core.make_array.call(null, 32);
        var jdx__9637 = hash >>> shift & 31;
        nodes__9636[jdx__9637] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__9638 = 0;
        var j__9639 = 0;
        while(true) {
          if(i__9638 < 32) {
            if((this__9629.bitmap >>> i__9638 & 1) === 0) {
              var G__9692 = i__9638 + 1;
              var G__9693 = j__9639;
              i__9638 = G__9692;
              j__9639 = G__9693;
              continue
            }else {
              nodes__9636[i__9638] = !(this__9629.arr[j__9639] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__9629.arr[j__9639]), this__9629.arr[j__9639], this__9629.arr[j__9639 + 1], added_leaf_QMARK_) : this__9629.arr[j__9639 + 1];
              var G__9694 = i__9638 + 1;
              var G__9695 = j__9639 + 2;
              i__9638 = G__9694;
              j__9639 = G__9695;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__9633 + 1, nodes__9636)
      }else {
        if("\ufdd0'else") {
          var new_arr__9640 = cljs.core.make_array.call(null, 2 * (n__9633 + 4));
          cljs.core.array_copy.call(null, this__9629.arr, 0, new_arr__9640, 0, 2 * idx__9632);
          new_arr__9640[2 * idx__9632] = key;
          new_arr__9640[2 * idx__9632 + 1] = val;
          cljs.core.array_copy.call(null, this__9629.arr, 2 * idx__9632, new_arr__9640, 2 * (idx__9632 + 1), 2 * (n__9633 - idx__9632));
          added_leaf_QMARK_.val = true;
          var editable__9641 = inode__9630.ensure_editable(edit);
          editable__9641.arr = new_arr__9640;
          editable__9641.bitmap = editable__9641.bitmap | bit__9631;
          return editable__9641
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__9642 = this__9629.arr[2 * idx__9632];
    var val_or_node__9643 = this__9629.arr[2 * idx__9632 + 1];
    if(key_or_nil__9642 == null) {
      var n__9644 = val_or_node__9643.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9644 === val_or_node__9643) {
        return inode__9630
      }else {
        return cljs.core.edit_and_set.call(null, inode__9630, edit, 2 * idx__9632 + 1, n__9644)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9642)) {
        if(val === val_or_node__9643) {
          return inode__9630
        }else {
          return cljs.core.edit_and_set.call(null, inode__9630, edit, 2 * idx__9632 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__9630, edit, 2 * idx__9632, null, 2 * idx__9632 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__9642, val_or_node__9643, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__9645 = this;
  var inode__9646 = this;
  return cljs.core.create_inode_seq.call(null, this__9645.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9647 = this;
  var inode__9648 = this;
  var bit__9649 = 1 << (hash >>> shift & 31);
  if((this__9647.bitmap & bit__9649) === 0) {
    return inode__9648
  }else {
    var idx__9650 = cljs.core.bitmap_indexed_node_index.call(null, this__9647.bitmap, bit__9649);
    var key_or_nil__9651 = this__9647.arr[2 * idx__9650];
    var val_or_node__9652 = this__9647.arr[2 * idx__9650 + 1];
    if(key_or_nil__9651 == null) {
      var n__9653 = val_or_node__9652.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__9653 === val_or_node__9652) {
        return inode__9648
      }else {
        if(!(n__9653 == null)) {
          return cljs.core.edit_and_set.call(null, inode__9648, edit, 2 * idx__9650 + 1, n__9653)
        }else {
          if(this__9647.bitmap === bit__9649) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__9648.edit_and_remove_pair(edit, bit__9649, idx__9650)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9651)) {
        removed_leaf_QMARK_[0] = true;
        return inode__9648.edit_and_remove_pair(edit, bit__9649, idx__9650)
      }else {
        if("\ufdd0'else") {
          return inode__9648
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__9654 = this;
  var inode__9655 = this;
  if(e === this__9654.edit) {
    return inode__9655
  }else {
    var n__9656 = cljs.core.bit_count.call(null, this__9654.bitmap);
    var new_arr__9657 = cljs.core.make_array.call(null, n__9656 < 0 ? 4 : 2 * (n__9656 + 1));
    cljs.core.array_copy.call(null, this__9654.arr, 0, new_arr__9657, 0, 2 * n__9656);
    return new cljs.core.BitmapIndexedNode(e, this__9654.bitmap, new_arr__9657)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__9658 = this;
  var inode__9659 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9658.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9660 = this;
  var inode__9661 = this;
  var bit__9662 = 1 << (hash >>> shift & 31);
  if((this__9660.bitmap & bit__9662) === 0) {
    return not_found
  }else {
    var idx__9663 = cljs.core.bitmap_indexed_node_index.call(null, this__9660.bitmap, bit__9662);
    var key_or_nil__9664 = this__9660.arr[2 * idx__9663];
    var val_or_node__9665 = this__9660.arr[2 * idx__9663 + 1];
    if(key_or_nil__9664 == null) {
      return val_or_node__9665.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9664)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__9664, val_or_node__9665], true)
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
  var this__9666 = this;
  var inode__9667 = this;
  var bit__9668 = 1 << (hash >>> shift & 31);
  if((this__9666.bitmap & bit__9668) === 0) {
    return inode__9667
  }else {
    var idx__9669 = cljs.core.bitmap_indexed_node_index.call(null, this__9666.bitmap, bit__9668);
    var key_or_nil__9670 = this__9666.arr[2 * idx__9669];
    var val_or_node__9671 = this__9666.arr[2 * idx__9669 + 1];
    if(key_or_nil__9670 == null) {
      var n__9672 = val_or_node__9671.inode_without(shift + 5, hash, key);
      if(n__9672 === val_or_node__9671) {
        return inode__9667
      }else {
        if(!(n__9672 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__9666.bitmap, cljs.core.clone_and_set.call(null, this__9666.arr, 2 * idx__9669 + 1, n__9672))
        }else {
          if(this__9666.bitmap === bit__9668) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__9666.bitmap ^ bit__9668, cljs.core.remove_pair.call(null, this__9666.arr, idx__9669))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9670)) {
        return new cljs.core.BitmapIndexedNode(null, this__9666.bitmap ^ bit__9668, cljs.core.remove_pair.call(null, this__9666.arr, idx__9669))
      }else {
        if("\ufdd0'else") {
          return inode__9667
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9673 = this;
  var inode__9674 = this;
  var bit__9675 = 1 << (hash >>> shift & 31);
  var idx__9676 = cljs.core.bitmap_indexed_node_index.call(null, this__9673.bitmap, bit__9675);
  if((this__9673.bitmap & bit__9675) === 0) {
    var n__9677 = cljs.core.bit_count.call(null, this__9673.bitmap);
    if(n__9677 >= 16) {
      var nodes__9678 = cljs.core.make_array.call(null, 32);
      var jdx__9679 = hash >>> shift & 31;
      nodes__9678[jdx__9679] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__9680 = 0;
      var j__9681 = 0;
      while(true) {
        if(i__9680 < 32) {
          if((this__9673.bitmap >>> i__9680 & 1) === 0) {
            var G__9696 = i__9680 + 1;
            var G__9697 = j__9681;
            i__9680 = G__9696;
            j__9681 = G__9697;
            continue
          }else {
            nodes__9678[i__9680] = !(this__9673.arr[j__9681] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__9673.arr[j__9681]), this__9673.arr[j__9681], this__9673.arr[j__9681 + 1], added_leaf_QMARK_) : this__9673.arr[j__9681 + 1];
            var G__9698 = i__9680 + 1;
            var G__9699 = j__9681 + 2;
            i__9680 = G__9698;
            j__9681 = G__9699;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__9677 + 1, nodes__9678)
    }else {
      var new_arr__9682 = cljs.core.make_array.call(null, 2 * (n__9677 + 1));
      cljs.core.array_copy.call(null, this__9673.arr, 0, new_arr__9682, 0, 2 * idx__9676);
      new_arr__9682[2 * idx__9676] = key;
      new_arr__9682[2 * idx__9676 + 1] = val;
      cljs.core.array_copy.call(null, this__9673.arr, 2 * idx__9676, new_arr__9682, 2 * (idx__9676 + 1), 2 * (n__9677 - idx__9676));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__9673.bitmap | bit__9675, new_arr__9682)
    }
  }else {
    var key_or_nil__9683 = this__9673.arr[2 * idx__9676];
    var val_or_node__9684 = this__9673.arr[2 * idx__9676 + 1];
    if(key_or_nil__9683 == null) {
      var n__9685 = val_or_node__9684.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9685 === val_or_node__9684) {
        return inode__9674
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__9673.bitmap, cljs.core.clone_and_set.call(null, this__9673.arr, 2 * idx__9676 + 1, n__9685))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9683)) {
        if(val === val_or_node__9684) {
          return inode__9674
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__9673.bitmap, cljs.core.clone_and_set.call(null, this__9673.arr, 2 * idx__9676 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__9673.bitmap, cljs.core.clone_and_set.call(null, this__9673.arr, 2 * idx__9676, null, 2 * idx__9676 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__9683, val_or_node__9684, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9686 = this;
  var inode__9687 = this;
  var bit__9688 = 1 << (hash >>> shift & 31);
  if((this__9686.bitmap & bit__9688) === 0) {
    return not_found
  }else {
    var idx__9689 = cljs.core.bitmap_indexed_node_index.call(null, this__9686.bitmap, bit__9688);
    var key_or_nil__9690 = this__9686.arr[2 * idx__9689];
    var val_or_node__9691 = this__9686.arr[2 * idx__9689 + 1];
    if(key_or_nil__9690 == null) {
      return val_or_node__9691.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9690)) {
        return val_or_node__9691
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
  var arr__9707 = array_node.arr;
  var len__9708 = 2 * (array_node.cnt - 1);
  var new_arr__9709 = cljs.core.make_array.call(null, len__9708);
  var i__9710 = 0;
  var j__9711 = 1;
  var bitmap__9712 = 0;
  while(true) {
    if(i__9710 < len__9708) {
      if(function() {
        var and__3822__auto____9713 = !(i__9710 === idx);
        if(and__3822__auto____9713) {
          return!(arr__9707[i__9710] == null)
        }else {
          return and__3822__auto____9713
        }
      }()) {
        new_arr__9709[j__9711] = arr__9707[i__9710];
        var G__9714 = i__9710 + 1;
        var G__9715 = j__9711 + 2;
        var G__9716 = bitmap__9712 | 1 << i__9710;
        i__9710 = G__9714;
        j__9711 = G__9715;
        bitmap__9712 = G__9716;
        continue
      }else {
        var G__9717 = i__9710 + 1;
        var G__9718 = j__9711;
        var G__9719 = bitmap__9712;
        i__9710 = G__9717;
        j__9711 = G__9718;
        bitmap__9712 = G__9719;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__9712, new_arr__9709)
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
  var this__9720 = this;
  var inode__9721 = this;
  var idx__9722 = hash >>> shift & 31;
  var node__9723 = this__9720.arr[idx__9722];
  if(node__9723 == null) {
    var editable__9724 = cljs.core.edit_and_set.call(null, inode__9721, edit, idx__9722, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__9724.cnt = editable__9724.cnt + 1;
    return editable__9724
  }else {
    var n__9725 = node__9723.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9725 === node__9723) {
      return inode__9721
    }else {
      return cljs.core.edit_and_set.call(null, inode__9721, edit, idx__9722, n__9725)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__9726 = this;
  var inode__9727 = this;
  return cljs.core.create_array_node_seq.call(null, this__9726.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9728 = this;
  var inode__9729 = this;
  var idx__9730 = hash >>> shift & 31;
  var node__9731 = this__9728.arr[idx__9730];
  if(node__9731 == null) {
    return inode__9729
  }else {
    var n__9732 = node__9731.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__9732 === node__9731) {
      return inode__9729
    }else {
      if(n__9732 == null) {
        if(this__9728.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9729, edit, idx__9730)
        }else {
          var editable__9733 = cljs.core.edit_and_set.call(null, inode__9729, edit, idx__9730, n__9732);
          editable__9733.cnt = editable__9733.cnt - 1;
          return editable__9733
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__9729, edit, idx__9730, n__9732)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__9734 = this;
  var inode__9735 = this;
  if(e === this__9734.edit) {
    return inode__9735
  }else {
    return new cljs.core.ArrayNode(e, this__9734.cnt, this__9734.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__9736 = this;
  var inode__9737 = this;
  var len__9738 = this__9736.arr.length;
  var i__9739 = 0;
  var init__9740 = init;
  while(true) {
    if(i__9739 < len__9738) {
      var node__9741 = this__9736.arr[i__9739];
      if(!(node__9741 == null)) {
        var init__9742 = node__9741.kv_reduce(f, init__9740);
        if(cljs.core.reduced_QMARK_.call(null, init__9742)) {
          return cljs.core.deref.call(null, init__9742)
        }else {
          var G__9761 = i__9739 + 1;
          var G__9762 = init__9742;
          i__9739 = G__9761;
          init__9740 = G__9762;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__9740
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9743 = this;
  var inode__9744 = this;
  var idx__9745 = hash >>> shift & 31;
  var node__9746 = this__9743.arr[idx__9745];
  if(!(node__9746 == null)) {
    return node__9746.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__9747 = this;
  var inode__9748 = this;
  var idx__9749 = hash >>> shift & 31;
  var node__9750 = this__9747.arr[idx__9749];
  if(!(node__9750 == null)) {
    var n__9751 = node__9750.inode_without(shift + 5, hash, key);
    if(n__9751 === node__9750) {
      return inode__9748
    }else {
      if(n__9751 == null) {
        if(this__9747.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9748, null, idx__9749)
        }else {
          return new cljs.core.ArrayNode(null, this__9747.cnt - 1, cljs.core.clone_and_set.call(null, this__9747.arr, idx__9749, n__9751))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__9747.cnt, cljs.core.clone_and_set.call(null, this__9747.arr, idx__9749, n__9751))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__9748
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9752 = this;
  var inode__9753 = this;
  var idx__9754 = hash >>> shift & 31;
  var node__9755 = this__9752.arr[idx__9754];
  if(node__9755 == null) {
    return new cljs.core.ArrayNode(null, this__9752.cnt + 1, cljs.core.clone_and_set.call(null, this__9752.arr, idx__9754, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__9756 = node__9755.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9756 === node__9755) {
      return inode__9753
    }else {
      return new cljs.core.ArrayNode(null, this__9752.cnt, cljs.core.clone_and_set.call(null, this__9752.arr, idx__9754, n__9756))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9757 = this;
  var inode__9758 = this;
  var idx__9759 = hash >>> shift & 31;
  var node__9760 = this__9757.arr[idx__9759];
  if(!(node__9760 == null)) {
    return node__9760.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__9765 = 2 * cnt;
  var i__9766 = 0;
  while(true) {
    if(i__9766 < lim__9765) {
      if(cljs.core.key_test.call(null, key, arr[i__9766])) {
        return i__9766
      }else {
        var G__9767 = i__9766 + 2;
        i__9766 = G__9767;
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
  var this__9768 = this;
  var inode__9769 = this;
  if(hash === this__9768.collision_hash) {
    var idx__9770 = cljs.core.hash_collision_node_find_index.call(null, this__9768.arr, this__9768.cnt, key);
    if(idx__9770 === -1) {
      if(this__9768.arr.length > 2 * this__9768.cnt) {
        var editable__9771 = cljs.core.edit_and_set.call(null, inode__9769, edit, 2 * this__9768.cnt, key, 2 * this__9768.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__9771.cnt = editable__9771.cnt + 1;
        return editable__9771
      }else {
        var len__9772 = this__9768.arr.length;
        var new_arr__9773 = cljs.core.make_array.call(null, len__9772 + 2);
        cljs.core.array_copy.call(null, this__9768.arr, 0, new_arr__9773, 0, len__9772);
        new_arr__9773[len__9772] = key;
        new_arr__9773[len__9772 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__9769.ensure_editable_array(edit, this__9768.cnt + 1, new_arr__9773)
      }
    }else {
      if(this__9768.arr[idx__9770 + 1] === val) {
        return inode__9769
      }else {
        return cljs.core.edit_and_set.call(null, inode__9769, edit, idx__9770 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__9768.collision_hash >>> shift & 31), [null, inode__9769, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__9774 = this;
  var inode__9775 = this;
  return cljs.core.create_inode_seq.call(null, this__9774.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9776 = this;
  var inode__9777 = this;
  var idx__9778 = cljs.core.hash_collision_node_find_index.call(null, this__9776.arr, this__9776.cnt, key);
  if(idx__9778 === -1) {
    return inode__9777
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__9776.cnt === 1) {
      return null
    }else {
      var editable__9779 = inode__9777.ensure_editable(edit);
      var earr__9780 = editable__9779.arr;
      earr__9780[idx__9778] = earr__9780[2 * this__9776.cnt - 2];
      earr__9780[idx__9778 + 1] = earr__9780[2 * this__9776.cnt - 1];
      earr__9780[2 * this__9776.cnt - 1] = null;
      earr__9780[2 * this__9776.cnt - 2] = null;
      editable__9779.cnt = editable__9779.cnt - 1;
      return editable__9779
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__9781 = this;
  var inode__9782 = this;
  if(e === this__9781.edit) {
    return inode__9782
  }else {
    var new_arr__9783 = cljs.core.make_array.call(null, 2 * (this__9781.cnt + 1));
    cljs.core.array_copy.call(null, this__9781.arr, 0, new_arr__9783, 0, 2 * this__9781.cnt);
    return new cljs.core.HashCollisionNode(e, this__9781.collision_hash, this__9781.cnt, new_arr__9783)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__9784 = this;
  var inode__9785 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9784.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9786 = this;
  var inode__9787 = this;
  var idx__9788 = cljs.core.hash_collision_node_find_index.call(null, this__9786.arr, this__9786.cnt, key);
  if(idx__9788 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9786.arr[idx__9788])) {
      return cljs.core.PersistentVector.fromArray([this__9786.arr[idx__9788], this__9786.arr[idx__9788 + 1]], true)
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
  var this__9789 = this;
  var inode__9790 = this;
  var idx__9791 = cljs.core.hash_collision_node_find_index.call(null, this__9789.arr, this__9789.cnt, key);
  if(idx__9791 === -1) {
    return inode__9790
  }else {
    if(this__9789.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__9789.collision_hash, this__9789.cnt - 1, cljs.core.remove_pair.call(null, this__9789.arr, cljs.core.quot.call(null, idx__9791, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9792 = this;
  var inode__9793 = this;
  if(hash === this__9792.collision_hash) {
    var idx__9794 = cljs.core.hash_collision_node_find_index.call(null, this__9792.arr, this__9792.cnt, key);
    if(idx__9794 === -1) {
      var len__9795 = this__9792.arr.length;
      var new_arr__9796 = cljs.core.make_array.call(null, len__9795 + 2);
      cljs.core.array_copy.call(null, this__9792.arr, 0, new_arr__9796, 0, len__9795);
      new_arr__9796[len__9795] = key;
      new_arr__9796[len__9795 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__9792.collision_hash, this__9792.cnt + 1, new_arr__9796)
    }else {
      if(cljs.core._EQ_.call(null, this__9792.arr[idx__9794], val)) {
        return inode__9793
      }else {
        return new cljs.core.HashCollisionNode(null, this__9792.collision_hash, this__9792.cnt, cljs.core.clone_and_set.call(null, this__9792.arr, idx__9794 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__9792.collision_hash >>> shift & 31), [null, inode__9793])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9797 = this;
  var inode__9798 = this;
  var idx__9799 = cljs.core.hash_collision_node_find_index.call(null, this__9797.arr, this__9797.cnt, key);
  if(idx__9799 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9797.arr[idx__9799])) {
      return this__9797.arr[idx__9799 + 1]
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
  var this__9800 = this;
  var inode__9801 = this;
  if(e === this__9800.edit) {
    this__9800.arr = array;
    this__9800.cnt = count;
    return inode__9801
  }else {
    return new cljs.core.HashCollisionNode(this__9800.edit, this__9800.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9806 = cljs.core.hash.call(null, key1);
    if(key1hash__9806 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9806, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9807 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__9806, key1, val1, added_leaf_QMARK___9807).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___9807)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9808 = cljs.core.hash.call(null, key1);
    if(key1hash__9808 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9808, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9809 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__9808, key1, val1, added_leaf_QMARK___9809).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___9809)
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
  var this__9810 = this;
  var h__2192__auto____9811 = this__9810.__hash;
  if(!(h__2192__auto____9811 == null)) {
    return h__2192__auto____9811
  }else {
    var h__2192__auto____9812 = cljs.core.hash_coll.call(null, coll);
    this__9810.__hash = h__2192__auto____9812;
    return h__2192__auto____9812
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9813 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__9814 = this;
  var this__9815 = this;
  return cljs.core.pr_str.call(null, this__9815)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9816 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9817 = this;
  if(this__9817.s == null) {
    return cljs.core.PersistentVector.fromArray([this__9817.nodes[this__9817.i], this__9817.nodes[this__9817.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__9817.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9818 = this;
  if(this__9818.s == null) {
    return cljs.core.create_inode_seq.call(null, this__9818.nodes, this__9818.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__9818.nodes, this__9818.i, cljs.core.next.call(null, this__9818.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9819 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9820 = this;
  return new cljs.core.NodeSeq(meta, this__9820.nodes, this__9820.i, this__9820.s, this__9820.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9821 = this;
  return this__9821.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9822 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9822.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__9829 = nodes.length;
      var j__9830 = i;
      while(true) {
        if(j__9830 < len__9829) {
          if(!(nodes[j__9830] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__9830, null, null)
          }else {
            var temp__3971__auto____9831 = nodes[j__9830 + 1];
            if(cljs.core.truth_(temp__3971__auto____9831)) {
              var node__9832 = temp__3971__auto____9831;
              var temp__3971__auto____9833 = node__9832.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____9833)) {
                var node_seq__9834 = temp__3971__auto____9833;
                return new cljs.core.NodeSeq(null, nodes, j__9830 + 2, node_seq__9834, null)
              }else {
                var G__9835 = j__9830 + 2;
                j__9830 = G__9835;
                continue
              }
            }else {
              var G__9836 = j__9830 + 2;
              j__9830 = G__9836;
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
  var this__9837 = this;
  var h__2192__auto____9838 = this__9837.__hash;
  if(!(h__2192__auto____9838 == null)) {
    return h__2192__auto____9838
  }else {
    var h__2192__auto____9839 = cljs.core.hash_coll.call(null, coll);
    this__9837.__hash = h__2192__auto____9839;
    return h__2192__auto____9839
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9840 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__9841 = this;
  var this__9842 = this;
  return cljs.core.pr_str.call(null, this__9842)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9843 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9844 = this;
  return cljs.core.first.call(null, this__9844.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9845 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__9845.nodes, this__9845.i, cljs.core.next.call(null, this__9845.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9846 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9847 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9847.nodes, this__9847.i, this__9847.s, this__9847.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9848 = this;
  return this__9848.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9849 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9849.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9856 = nodes.length;
      var j__9857 = i;
      while(true) {
        if(j__9857 < len__9856) {
          var temp__3971__auto____9858 = nodes[j__9857];
          if(cljs.core.truth_(temp__3971__auto____9858)) {
            var nj__9859 = temp__3971__auto____9858;
            var temp__3971__auto____9860 = nj__9859.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9860)) {
              var ns__9861 = temp__3971__auto____9860;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9857 + 1, ns__9861, null)
            }else {
              var G__9862 = j__9857 + 1;
              j__9857 = G__9862;
              continue
            }
          }else {
            var G__9863 = j__9857 + 1;
            j__9857 = G__9863;
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
  var this__9866 = this;
  return new cljs.core.TransientHashMap({}, this__9866.root, this__9866.cnt, this__9866.has_nil_QMARK_, this__9866.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9867 = this;
  var h__2192__auto____9868 = this__9867.__hash;
  if(!(h__2192__auto____9868 == null)) {
    return h__2192__auto____9868
  }else {
    var h__2192__auto____9869 = cljs.core.hash_imap.call(null, coll);
    this__9867.__hash = h__2192__auto____9869;
    return h__2192__auto____9869
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9870 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9871 = this;
  if(k == null) {
    if(this__9871.has_nil_QMARK_) {
      return this__9871.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9871.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9871.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9872 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9873 = this__9872.has_nil_QMARK_;
      if(and__3822__auto____9873) {
        return v === this__9872.nil_val
      }else {
        return and__3822__auto____9873
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9872.meta, this__9872.has_nil_QMARK_ ? this__9872.cnt : this__9872.cnt + 1, this__9872.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9874 = new cljs.core.Box(false);
    var new_root__9875 = (this__9872.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9872.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9874);
    if(new_root__9875 === this__9872.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9872.meta, added_leaf_QMARK___9874.val ? this__9872.cnt + 1 : this__9872.cnt, new_root__9875, this__9872.has_nil_QMARK_, this__9872.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9876 = this;
  if(k == null) {
    return this__9876.has_nil_QMARK_
  }else {
    if(this__9876.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9876.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9899 = null;
  var G__9899__2 = function(this_sym9877, k) {
    var this__9879 = this;
    var this_sym9877__9880 = this;
    var coll__9881 = this_sym9877__9880;
    return coll__9881.cljs$core$ILookup$_lookup$arity$2(coll__9881, k)
  };
  var G__9899__3 = function(this_sym9878, k, not_found) {
    var this__9879 = this;
    var this_sym9878__9882 = this;
    var coll__9883 = this_sym9878__9882;
    return coll__9883.cljs$core$ILookup$_lookup$arity$3(coll__9883, k, not_found)
  };
  G__9899 = function(this_sym9878, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9899__2.call(this, this_sym9878, k);
      case 3:
        return G__9899__3.call(this, this_sym9878, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9899
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9864, args9865) {
  var this__9884 = this;
  return this_sym9864.call.apply(this_sym9864, [this_sym9864].concat(args9865.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9885 = this;
  var init__9886 = this__9885.has_nil_QMARK_ ? f.call(null, init, null, this__9885.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9886)) {
    return cljs.core.deref.call(null, init__9886)
  }else {
    if(!(this__9885.root == null)) {
      return this__9885.root.kv_reduce(f, init__9886)
    }else {
      if("\ufdd0'else") {
        return init__9886
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9887 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9888 = this;
  var this__9889 = this;
  return cljs.core.pr_str.call(null, this__9889)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9890 = this;
  if(this__9890.cnt > 0) {
    var s__9891 = !(this__9890.root == null) ? this__9890.root.inode_seq() : null;
    if(this__9890.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9890.nil_val], true), s__9891)
    }else {
      return s__9891
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9892 = this;
  return this__9892.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9893 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9894 = this;
  return new cljs.core.PersistentHashMap(meta, this__9894.cnt, this__9894.root, this__9894.has_nil_QMARK_, this__9894.nil_val, this__9894.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9895 = this;
  return this__9895.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9896 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9896.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9897 = this;
  if(k == null) {
    if(this__9897.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9897.meta, this__9897.cnt - 1, this__9897.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9897.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9898 = this__9897.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9898 === this__9897.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9897.meta, this__9897.cnt - 1, new_root__9898, this__9897.has_nil_QMARK_, this__9897.nil_val, null)
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
  var len__9900 = ks.length;
  var i__9901 = 0;
  var out__9902 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9901 < len__9900) {
      var G__9903 = i__9901 + 1;
      var G__9904 = cljs.core.assoc_BANG_.call(null, out__9902, ks[i__9901], vs[i__9901]);
      i__9901 = G__9903;
      out__9902 = G__9904;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9902)
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
  var this__9905 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9906 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9907 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9908 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9909 = this;
  if(k == null) {
    if(this__9909.has_nil_QMARK_) {
      return this__9909.nil_val
    }else {
      return null
    }
  }else {
    if(this__9909.root == null) {
      return null
    }else {
      return this__9909.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9910 = this;
  if(k == null) {
    if(this__9910.has_nil_QMARK_) {
      return this__9910.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9910.root == null) {
      return not_found
    }else {
      return this__9910.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9911 = this;
  if(this__9911.edit) {
    return this__9911.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9912 = this;
  var tcoll__9913 = this;
  if(this__9912.edit) {
    if(function() {
      var G__9914__9915 = o;
      if(G__9914__9915) {
        if(function() {
          var or__3824__auto____9916 = G__9914__9915.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9916) {
            return or__3824__auto____9916
          }else {
            return G__9914__9915.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9914__9915.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9914__9915)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9914__9915)
      }
    }()) {
      return tcoll__9913.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9917 = cljs.core.seq.call(null, o);
      var tcoll__9918 = tcoll__9913;
      while(true) {
        var temp__3971__auto____9919 = cljs.core.first.call(null, es__9917);
        if(cljs.core.truth_(temp__3971__auto____9919)) {
          var e__9920 = temp__3971__auto____9919;
          var G__9931 = cljs.core.next.call(null, es__9917);
          var G__9932 = tcoll__9918.assoc_BANG_(cljs.core.key.call(null, e__9920), cljs.core.val.call(null, e__9920));
          es__9917 = G__9931;
          tcoll__9918 = G__9932;
          continue
        }else {
          return tcoll__9918
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9921 = this;
  var tcoll__9922 = this;
  if(this__9921.edit) {
    if(k == null) {
      if(this__9921.nil_val === v) {
      }else {
        this__9921.nil_val = v
      }
      if(this__9921.has_nil_QMARK_) {
      }else {
        this__9921.count = this__9921.count + 1;
        this__9921.has_nil_QMARK_ = true
      }
      return tcoll__9922
    }else {
      var added_leaf_QMARK___9923 = new cljs.core.Box(false);
      var node__9924 = (this__9921.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9921.root).inode_assoc_BANG_(this__9921.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9923);
      if(node__9924 === this__9921.root) {
      }else {
        this__9921.root = node__9924
      }
      if(added_leaf_QMARK___9923.val) {
        this__9921.count = this__9921.count + 1
      }else {
      }
      return tcoll__9922
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9925 = this;
  var tcoll__9926 = this;
  if(this__9925.edit) {
    if(k == null) {
      if(this__9925.has_nil_QMARK_) {
        this__9925.has_nil_QMARK_ = false;
        this__9925.nil_val = null;
        this__9925.count = this__9925.count - 1;
        return tcoll__9926
      }else {
        return tcoll__9926
      }
    }else {
      if(this__9925.root == null) {
        return tcoll__9926
      }else {
        var removed_leaf_QMARK___9927 = new cljs.core.Box(false);
        var node__9928 = this__9925.root.inode_without_BANG_(this__9925.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9927);
        if(node__9928 === this__9925.root) {
        }else {
          this__9925.root = node__9928
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9927[0])) {
          this__9925.count = this__9925.count - 1
        }else {
        }
        return tcoll__9926
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9929 = this;
  var tcoll__9930 = this;
  if(this__9929.edit) {
    this__9929.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9929.count, this__9929.root, this__9929.has_nil_QMARK_, this__9929.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9935 = node;
  var stack__9936 = stack;
  while(true) {
    if(!(t__9935 == null)) {
      var G__9937 = ascending_QMARK_ ? t__9935.left : t__9935.right;
      var G__9938 = cljs.core.conj.call(null, stack__9936, t__9935);
      t__9935 = G__9937;
      stack__9936 = G__9938;
      continue
    }else {
      return stack__9936
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
  var this__9939 = this;
  var h__2192__auto____9940 = this__9939.__hash;
  if(!(h__2192__auto____9940 == null)) {
    return h__2192__auto____9940
  }else {
    var h__2192__auto____9941 = cljs.core.hash_coll.call(null, coll);
    this__9939.__hash = h__2192__auto____9941;
    return h__2192__auto____9941
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9942 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9943 = this;
  var this__9944 = this;
  return cljs.core.pr_str.call(null, this__9944)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9945 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9946 = this;
  if(this__9946.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9946.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9947 = this;
  return cljs.core.peek.call(null, this__9947.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9948 = this;
  var t__9949 = cljs.core.first.call(null, this__9948.stack);
  var next_stack__9950 = cljs.core.tree_map_seq_push.call(null, this__9948.ascending_QMARK_ ? t__9949.right : t__9949.left, cljs.core.next.call(null, this__9948.stack), this__9948.ascending_QMARK_);
  if(!(next_stack__9950 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9950, this__9948.ascending_QMARK_, this__9948.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9951 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9952 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9952.stack, this__9952.ascending_QMARK_, this__9952.cnt, this__9952.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9953 = this;
  return this__9953.meta
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
        var and__3822__auto____9955 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9955) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9955
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
        var and__3822__auto____9957 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9957) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9957
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
  var init__9961 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9961)) {
    return cljs.core.deref.call(null, init__9961)
  }else {
    var init__9962 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9961) : init__9961;
    if(cljs.core.reduced_QMARK_.call(null, init__9962)) {
      return cljs.core.deref.call(null, init__9962)
    }else {
      var init__9963 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9962) : init__9962;
      if(cljs.core.reduced_QMARK_.call(null, init__9963)) {
        return cljs.core.deref.call(null, init__9963)
      }else {
        return init__9963
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
  var this__9966 = this;
  var h__2192__auto____9967 = this__9966.__hash;
  if(!(h__2192__auto____9967 == null)) {
    return h__2192__auto____9967
  }else {
    var h__2192__auto____9968 = cljs.core.hash_coll.call(null, coll);
    this__9966.__hash = h__2192__auto____9968;
    return h__2192__auto____9968
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9969 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9970 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9971 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9971.key, this__9971.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__10019 = null;
  var G__10019__2 = function(this_sym9972, k) {
    var this__9974 = this;
    var this_sym9972__9975 = this;
    var node__9976 = this_sym9972__9975;
    return node__9976.cljs$core$ILookup$_lookup$arity$2(node__9976, k)
  };
  var G__10019__3 = function(this_sym9973, k, not_found) {
    var this__9974 = this;
    var this_sym9973__9977 = this;
    var node__9978 = this_sym9973__9977;
    return node__9978.cljs$core$ILookup$_lookup$arity$3(node__9978, k, not_found)
  };
  G__10019 = function(this_sym9973, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10019__2.call(this, this_sym9973, k);
      case 3:
        return G__10019__3.call(this, this_sym9973, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10019
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9964, args9965) {
  var this__9979 = this;
  return this_sym9964.call.apply(this_sym9964, [this_sym9964].concat(args9965.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9980 = this;
  return cljs.core.PersistentVector.fromArray([this__9980.key, this__9980.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9981 = this;
  return this__9981.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9982 = this;
  return this__9982.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9983 = this;
  var node__9984 = this;
  return ins.balance_right(node__9984)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9985 = this;
  var node__9986 = this;
  return new cljs.core.RedNode(this__9985.key, this__9985.val, this__9985.left, this__9985.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9987 = this;
  var node__9988 = this;
  return cljs.core.balance_right_del.call(null, this__9987.key, this__9987.val, this__9987.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9989 = this;
  var node__9990 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9991 = this;
  var node__9992 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9992, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9993 = this;
  var node__9994 = this;
  return cljs.core.balance_left_del.call(null, this__9993.key, this__9993.val, del, this__9993.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9995 = this;
  var node__9996 = this;
  return ins.balance_left(node__9996)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9997 = this;
  var node__9998 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9998, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__10020 = null;
  var G__10020__0 = function() {
    var this__9999 = this;
    var this__10001 = this;
    return cljs.core.pr_str.call(null, this__10001)
  };
  G__10020 = function() {
    switch(arguments.length) {
      case 0:
        return G__10020__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10020
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__10002 = this;
  var node__10003 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10003, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__10004 = this;
  var node__10005 = this;
  return node__10005
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10006 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10007 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10008 = this;
  return cljs.core.list.call(null, this__10008.key, this__10008.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10009 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10010 = this;
  return this__10010.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10011 = this;
  return cljs.core.PersistentVector.fromArray([this__10011.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10012 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10012.key, this__10012.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10013 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10014 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10014.key, this__10014.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10015 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10016 = this;
  if(n === 0) {
    return this__10016.key
  }else {
    if(n === 1) {
      return this__10016.val
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
  var this__10017 = this;
  if(n === 0) {
    return this__10017.key
  }else {
    if(n === 1) {
      return this__10017.val
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
  var this__10018 = this;
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
  var this__10023 = this;
  var h__2192__auto____10024 = this__10023.__hash;
  if(!(h__2192__auto____10024 == null)) {
    return h__2192__auto____10024
  }else {
    var h__2192__auto____10025 = cljs.core.hash_coll.call(null, coll);
    this__10023.__hash = h__2192__auto____10025;
    return h__2192__auto____10025
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__10026 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__10027 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__10028 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__10028.key, this__10028.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__10076 = null;
  var G__10076__2 = function(this_sym10029, k) {
    var this__10031 = this;
    var this_sym10029__10032 = this;
    var node__10033 = this_sym10029__10032;
    return node__10033.cljs$core$ILookup$_lookup$arity$2(node__10033, k)
  };
  var G__10076__3 = function(this_sym10030, k, not_found) {
    var this__10031 = this;
    var this_sym10030__10034 = this;
    var node__10035 = this_sym10030__10034;
    return node__10035.cljs$core$ILookup$_lookup$arity$3(node__10035, k, not_found)
  };
  G__10076 = function(this_sym10030, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10076__2.call(this, this_sym10030, k);
      case 3:
        return G__10076__3.call(this, this_sym10030, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10076
}();
cljs.core.RedNode.prototype.apply = function(this_sym10021, args10022) {
  var this__10036 = this;
  return this_sym10021.call.apply(this_sym10021, [this_sym10021].concat(args10022.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__10037 = this;
  return cljs.core.PersistentVector.fromArray([this__10037.key, this__10037.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10038 = this;
  return this__10038.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10039 = this;
  return this__10039.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__10040 = this;
  var node__10041 = this;
  return new cljs.core.RedNode(this__10040.key, this__10040.val, this__10040.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__10042 = this;
  var node__10043 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__10044 = this;
  var node__10045 = this;
  return new cljs.core.RedNode(this__10044.key, this__10044.val, this__10044.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__10046 = this;
  var node__10047 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__10048 = this;
  var node__10049 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10049, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__10050 = this;
  var node__10051 = this;
  return new cljs.core.RedNode(this__10050.key, this__10050.val, del, this__10050.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__10052 = this;
  var node__10053 = this;
  return new cljs.core.RedNode(this__10052.key, this__10052.val, ins, this__10052.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__10054 = this;
  var node__10055 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10054.left)) {
    return new cljs.core.RedNode(this__10054.key, this__10054.val, this__10054.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__10054.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10054.right)) {
      return new cljs.core.RedNode(this__10054.right.key, this__10054.right.val, new cljs.core.BlackNode(this__10054.key, this__10054.val, this__10054.left, this__10054.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__10054.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__10055, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__10077 = null;
  var G__10077__0 = function() {
    var this__10056 = this;
    var this__10058 = this;
    return cljs.core.pr_str.call(null, this__10058)
  };
  G__10077 = function() {
    switch(arguments.length) {
      case 0:
        return G__10077__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10077
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__10059 = this;
  var node__10060 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10059.right)) {
    return new cljs.core.RedNode(this__10059.key, this__10059.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10059.left, null), this__10059.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10059.left)) {
      return new cljs.core.RedNode(this__10059.left.key, this__10059.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10059.left.left, null), new cljs.core.BlackNode(this__10059.key, this__10059.val, this__10059.left.right, this__10059.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10060, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__10061 = this;
  var node__10062 = this;
  return new cljs.core.BlackNode(this__10061.key, this__10061.val, this__10061.left, this__10061.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10063 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10064 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10065 = this;
  return cljs.core.list.call(null, this__10065.key, this__10065.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10066 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10067 = this;
  return this__10067.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10068 = this;
  return cljs.core.PersistentVector.fromArray([this__10068.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10069 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10069.key, this__10069.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10070 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10071 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10071.key, this__10071.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10072 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10073 = this;
  if(n === 0) {
    return this__10073.key
  }else {
    if(n === 1) {
      return this__10073.val
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
  var this__10074 = this;
  if(n === 0) {
    return this__10074.key
  }else {
    if(n === 1) {
      return this__10074.val
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
  var this__10075 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__10081 = comp.call(null, k, tree.key);
    if(c__10081 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__10081 < 0) {
        var ins__10082 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__10082 == null)) {
          return tree.add_left(ins__10082)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__10083 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__10083 == null)) {
            return tree.add_right(ins__10083)
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
          var app__10086 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10086)) {
            return new cljs.core.RedNode(app__10086.key, app__10086.val, new cljs.core.RedNode(left.key, left.val, left.left, app__10086.left, null), new cljs.core.RedNode(right.key, right.val, app__10086.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__10086, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__10087 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10087)) {
              return new cljs.core.RedNode(app__10087.key, app__10087.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__10087.left, null), new cljs.core.BlackNode(right.key, right.val, app__10087.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__10087, right.right, null))
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
    var c__10093 = comp.call(null, k, tree.key);
    if(c__10093 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__10093 < 0) {
        var del__10094 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____10095 = !(del__10094 == null);
          if(or__3824__auto____10095) {
            return or__3824__auto____10095
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__10094, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__10094, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__10096 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____10097 = !(del__10096 == null);
            if(or__3824__auto____10097) {
              return or__3824__auto____10097
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__10096)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__10096, null)
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
  var tk__10100 = tree.key;
  var c__10101 = comp.call(null, k, tk__10100);
  if(c__10101 === 0) {
    return tree.replace(tk__10100, v, tree.left, tree.right)
  }else {
    if(c__10101 < 0) {
      return tree.replace(tk__10100, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__10100, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__10104 = this;
  var h__2192__auto____10105 = this__10104.__hash;
  if(!(h__2192__auto____10105 == null)) {
    return h__2192__auto____10105
  }else {
    var h__2192__auto____10106 = cljs.core.hash_imap.call(null, coll);
    this__10104.__hash = h__2192__auto____10106;
    return h__2192__auto____10106
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10107 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10108 = this;
  var n__10109 = coll.entry_at(k);
  if(!(n__10109 == null)) {
    return n__10109.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10110 = this;
  var found__10111 = [null];
  var t__10112 = cljs.core.tree_map_add.call(null, this__10110.comp, this__10110.tree, k, v, found__10111);
  if(t__10112 == null) {
    var found_node__10113 = cljs.core.nth.call(null, found__10111, 0);
    if(cljs.core._EQ_.call(null, v, found_node__10113.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10110.comp, cljs.core.tree_map_replace.call(null, this__10110.comp, this__10110.tree, k, v), this__10110.cnt, this__10110.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10110.comp, t__10112.blacken(), this__10110.cnt + 1, this__10110.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10114 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__10148 = null;
  var G__10148__2 = function(this_sym10115, k) {
    var this__10117 = this;
    var this_sym10115__10118 = this;
    var coll__10119 = this_sym10115__10118;
    return coll__10119.cljs$core$ILookup$_lookup$arity$2(coll__10119, k)
  };
  var G__10148__3 = function(this_sym10116, k, not_found) {
    var this__10117 = this;
    var this_sym10116__10120 = this;
    var coll__10121 = this_sym10116__10120;
    return coll__10121.cljs$core$ILookup$_lookup$arity$3(coll__10121, k, not_found)
  };
  G__10148 = function(this_sym10116, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10148__2.call(this, this_sym10116, k);
      case 3:
        return G__10148__3.call(this, this_sym10116, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10148
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym10102, args10103) {
  var this__10122 = this;
  return this_sym10102.call.apply(this_sym10102, [this_sym10102].concat(args10103.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10123 = this;
  if(!(this__10123.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__10123.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10124 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10125 = this;
  if(this__10125.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10125.tree, false, this__10125.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__10126 = this;
  var this__10127 = this;
  return cljs.core.pr_str.call(null, this__10127)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__10128 = this;
  var coll__10129 = this;
  var t__10130 = this__10128.tree;
  while(true) {
    if(!(t__10130 == null)) {
      var c__10131 = this__10128.comp.call(null, k, t__10130.key);
      if(c__10131 === 0) {
        return t__10130
      }else {
        if(c__10131 < 0) {
          var G__10149 = t__10130.left;
          t__10130 = G__10149;
          continue
        }else {
          if("\ufdd0'else") {
            var G__10150 = t__10130.right;
            t__10130 = G__10150;
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
  var this__10132 = this;
  if(this__10132.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10132.tree, ascending_QMARK_, this__10132.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__10133 = this;
  if(this__10133.cnt > 0) {
    var stack__10134 = null;
    var t__10135 = this__10133.tree;
    while(true) {
      if(!(t__10135 == null)) {
        var c__10136 = this__10133.comp.call(null, k, t__10135.key);
        if(c__10136 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__10134, t__10135), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__10136 < 0) {
              var G__10151 = cljs.core.conj.call(null, stack__10134, t__10135);
              var G__10152 = t__10135.left;
              stack__10134 = G__10151;
              t__10135 = G__10152;
              continue
            }else {
              var G__10153 = stack__10134;
              var G__10154 = t__10135.right;
              stack__10134 = G__10153;
              t__10135 = G__10154;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__10136 > 0) {
                var G__10155 = cljs.core.conj.call(null, stack__10134, t__10135);
                var G__10156 = t__10135.right;
                stack__10134 = G__10155;
                t__10135 = G__10156;
                continue
              }else {
                var G__10157 = stack__10134;
                var G__10158 = t__10135.left;
                stack__10134 = G__10157;
                t__10135 = G__10158;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__10134 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__10134, ascending_QMARK_, -1, null)
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
  var this__10137 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__10138 = this;
  return this__10138.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10139 = this;
  if(this__10139.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10139.tree, true, this__10139.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10140 = this;
  return this__10140.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10141 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10142 = this;
  return new cljs.core.PersistentTreeMap(this__10142.comp, this__10142.tree, this__10142.cnt, meta, this__10142.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10143 = this;
  return this__10143.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10144 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__10144.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10145 = this;
  var found__10146 = [null];
  var t__10147 = cljs.core.tree_map_remove.call(null, this__10145.comp, this__10145.tree, k, found__10146);
  if(t__10147 == null) {
    if(cljs.core.nth.call(null, found__10146, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10145.comp, null, 0, this__10145.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10145.comp, t__10147.blacken(), this__10145.cnt - 1, this__10145.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__10161 = cljs.core.seq.call(null, keyvals);
    var out__10162 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__10161) {
        var G__10163 = cljs.core.nnext.call(null, in__10161);
        var G__10164 = cljs.core.assoc_BANG_.call(null, out__10162, cljs.core.first.call(null, in__10161), cljs.core.second.call(null, in__10161));
        in__10161 = G__10163;
        out__10162 = G__10164;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__10162)
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
  hash_map.cljs$lang$applyTo = function(arglist__10165) {
    var keyvals = cljs.core.seq(arglist__10165);
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
  array_map.cljs$lang$applyTo = function(arglist__10166) {
    var keyvals = cljs.core.seq(arglist__10166);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__10170 = [];
    var obj__10171 = {};
    var kvs__10172 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__10172) {
        ks__10170.push(cljs.core.first.call(null, kvs__10172));
        obj__10171[cljs.core.first.call(null, kvs__10172)] = cljs.core.second.call(null, kvs__10172);
        var G__10173 = cljs.core.nnext.call(null, kvs__10172);
        kvs__10172 = G__10173;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__10170, obj__10171)
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
  obj_map.cljs$lang$applyTo = function(arglist__10174) {
    var keyvals = cljs.core.seq(arglist__10174);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__10177 = cljs.core.seq.call(null, keyvals);
    var out__10178 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__10177) {
        var G__10179 = cljs.core.nnext.call(null, in__10177);
        var G__10180 = cljs.core.assoc.call(null, out__10178, cljs.core.first.call(null, in__10177), cljs.core.second.call(null, in__10177));
        in__10177 = G__10179;
        out__10178 = G__10180;
        continue
      }else {
        return out__10178
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
  sorted_map.cljs$lang$applyTo = function(arglist__10181) {
    var keyvals = cljs.core.seq(arglist__10181);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__10184 = cljs.core.seq.call(null, keyvals);
    var out__10185 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__10184) {
        var G__10186 = cljs.core.nnext.call(null, in__10184);
        var G__10187 = cljs.core.assoc.call(null, out__10185, cljs.core.first.call(null, in__10184), cljs.core.second.call(null, in__10184));
        in__10184 = G__10186;
        out__10185 = G__10187;
        continue
      }else {
        return out__10185
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__10188) {
    var comparator = cljs.core.first(arglist__10188);
    var keyvals = cljs.core.rest(arglist__10188);
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
      return cljs.core.reduce.call(null, function(p1__10189_SHARP_, p2__10190_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____10192 = p1__10189_SHARP_;
          if(cljs.core.truth_(or__3824__auto____10192)) {
            return or__3824__auto____10192
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__10190_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__10193) {
    var maps = cljs.core.seq(arglist__10193);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__10201 = function(m, e) {
        var k__10199 = cljs.core.first.call(null, e);
        var v__10200 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__10199)) {
          return cljs.core.assoc.call(null, m, k__10199, f.call(null, cljs.core._lookup.call(null, m, k__10199, null), v__10200))
        }else {
          return cljs.core.assoc.call(null, m, k__10199, v__10200)
        }
      };
      var merge2__10203 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__10201, function() {
          var or__3824__auto____10202 = m1;
          if(cljs.core.truth_(or__3824__auto____10202)) {
            return or__3824__auto____10202
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__10203, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__10204) {
    var f = cljs.core.first(arglist__10204);
    var maps = cljs.core.rest(arglist__10204);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__10209 = cljs.core.ObjMap.EMPTY;
  var keys__10210 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__10210) {
      var key__10211 = cljs.core.first.call(null, keys__10210);
      var entry__10212 = cljs.core._lookup.call(null, map, key__10211, "\ufdd0'cljs.core/not-found");
      var G__10213 = cljs.core.not_EQ_.call(null, entry__10212, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__10209, key__10211, entry__10212) : ret__10209;
      var G__10214 = cljs.core.next.call(null, keys__10210);
      ret__10209 = G__10213;
      keys__10210 = G__10214;
      continue
    }else {
      return ret__10209
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
  var this__10218 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__10218.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10219 = this;
  var h__2192__auto____10220 = this__10219.__hash;
  if(!(h__2192__auto____10220 == null)) {
    return h__2192__auto____10220
  }else {
    var h__2192__auto____10221 = cljs.core.hash_iset.call(null, coll);
    this__10219.__hash = h__2192__auto____10221;
    return h__2192__auto____10221
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__10222 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__10223 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__10223.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__10244 = null;
  var G__10244__2 = function(this_sym10224, k) {
    var this__10226 = this;
    var this_sym10224__10227 = this;
    var coll__10228 = this_sym10224__10227;
    return coll__10228.cljs$core$ILookup$_lookup$arity$2(coll__10228, k)
  };
  var G__10244__3 = function(this_sym10225, k, not_found) {
    var this__10226 = this;
    var this_sym10225__10229 = this;
    var coll__10230 = this_sym10225__10229;
    return coll__10230.cljs$core$ILookup$_lookup$arity$3(coll__10230, k, not_found)
  };
  G__10244 = function(this_sym10225, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10244__2.call(this, this_sym10225, k);
      case 3:
        return G__10244__3.call(this, this_sym10225, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10244
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym10216, args10217) {
  var this__10231 = this;
  return this_sym10216.call.apply(this_sym10216, [this_sym10216].concat(args10217.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10232 = this;
  return new cljs.core.PersistentHashSet(this__10232.meta, cljs.core.assoc.call(null, this__10232.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__10233 = this;
  var this__10234 = this;
  return cljs.core.pr_str.call(null, this__10234)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10235 = this;
  return cljs.core.keys.call(null, this__10235.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__10236 = this;
  return new cljs.core.PersistentHashSet(this__10236.meta, cljs.core.dissoc.call(null, this__10236.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10237 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10238 = this;
  var and__3822__auto____10239 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____10239) {
    var and__3822__auto____10240 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____10240) {
      return cljs.core.every_QMARK_.call(null, function(p1__10215_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__10215_SHARP_)
      }, other)
    }else {
      return and__3822__auto____10240
    }
  }else {
    return and__3822__auto____10239
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10241 = this;
  return new cljs.core.PersistentHashSet(meta, this__10241.hash_map, this__10241.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10242 = this;
  return this__10242.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10243 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__10243.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__10245 = cljs.core.count.call(null, items);
  var i__10246 = 0;
  var out__10247 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__10246 < len__10245) {
      var G__10248 = i__10246 + 1;
      var G__10249 = cljs.core.conj_BANG_.call(null, out__10247, items[i__10246]);
      i__10246 = G__10248;
      out__10247 = G__10249;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10247)
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
  var G__10267 = null;
  var G__10267__2 = function(this_sym10253, k) {
    var this__10255 = this;
    var this_sym10253__10256 = this;
    var tcoll__10257 = this_sym10253__10256;
    if(cljs.core._lookup.call(null, this__10255.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__10267__3 = function(this_sym10254, k, not_found) {
    var this__10255 = this;
    var this_sym10254__10258 = this;
    var tcoll__10259 = this_sym10254__10258;
    if(cljs.core._lookup.call(null, this__10255.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__10267 = function(this_sym10254, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10267__2.call(this, this_sym10254, k);
      case 3:
        return G__10267__3.call(this, this_sym10254, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10267
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym10251, args10252) {
  var this__10260 = this;
  return this_sym10251.call.apply(this_sym10251, [this_sym10251].concat(args10252.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__10261 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__10262 = this;
  if(cljs.core._lookup.call(null, this__10262.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__10263 = this;
  return cljs.core.count.call(null, this__10263.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__10264 = this;
  this__10264.transient_map = cljs.core.dissoc_BANG_.call(null, this__10264.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10265 = this;
  this__10265.transient_map = cljs.core.assoc_BANG_.call(null, this__10265.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10266 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__10266.transient_map), null)
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
  var this__10270 = this;
  var h__2192__auto____10271 = this__10270.__hash;
  if(!(h__2192__auto____10271 == null)) {
    return h__2192__auto____10271
  }else {
    var h__2192__auto____10272 = cljs.core.hash_iset.call(null, coll);
    this__10270.__hash = h__2192__auto____10272;
    return h__2192__auto____10272
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__10273 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__10274 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__10274.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__10300 = null;
  var G__10300__2 = function(this_sym10275, k) {
    var this__10277 = this;
    var this_sym10275__10278 = this;
    var coll__10279 = this_sym10275__10278;
    return coll__10279.cljs$core$ILookup$_lookup$arity$2(coll__10279, k)
  };
  var G__10300__3 = function(this_sym10276, k, not_found) {
    var this__10277 = this;
    var this_sym10276__10280 = this;
    var coll__10281 = this_sym10276__10280;
    return coll__10281.cljs$core$ILookup$_lookup$arity$3(coll__10281, k, not_found)
  };
  G__10300 = function(this_sym10276, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10300__2.call(this, this_sym10276, k);
      case 3:
        return G__10300__3.call(this, this_sym10276, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10300
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym10268, args10269) {
  var this__10282 = this;
  return this_sym10268.call.apply(this_sym10268, [this_sym10268].concat(args10269.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10283 = this;
  return new cljs.core.PersistentTreeSet(this__10283.meta, cljs.core.assoc.call(null, this__10283.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10284 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__10284.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__10285 = this;
  var this__10286 = this;
  return cljs.core.pr_str.call(null, this__10286)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__10287 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__10287.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__10288 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__10288.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__10289 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__10290 = this;
  return cljs.core._comparator.call(null, this__10290.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10291 = this;
  return cljs.core.keys.call(null, this__10291.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__10292 = this;
  return new cljs.core.PersistentTreeSet(this__10292.meta, cljs.core.dissoc.call(null, this__10292.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10293 = this;
  return cljs.core.count.call(null, this__10293.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10294 = this;
  var and__3822__auto____10295 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____10295) {
    var and__3822__auto____10296 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____10296) {
      return cljs.core.every_QMARK_.call(null, function(p1__10250_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__10250_SHARP_)
      }, other)
    }else {
      return and__3822__auto____10296
    }
  }else {
    return and__3822__auto____10295
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10297 = this;
  return new cljs.core.PersistentTreeSet(meta, this__10297.tree_map, this__10297.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10298 = this;
  return this__10298.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10299 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__10299.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__10305__delegate = function(keys) {
      var in__10303 = cljs.core.seq.call(null, keys);
      var out__10304 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__10303)) {
          var G__10306 = cljs.core.next.call(null, in__10303);
          var G__10307 = cljs.core.conj_BANG_.call(null, out__10304, cljs.core.first.call(null, in__10303));
          in__10303 = G__10306;
          out__10304 = G__10307;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__10304)
        }
        break
      }
    };
    var G__10305 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10305__delegate.call(this, keys)
    };
    G__10305.cljs$lang$maxFixedArity = 0;
    G__10305.cljs$lang$applyTo = function(arglist__10308) {
      var keys = cljs.core.seq(arglist__10308);
      return G__10305__delegate(keys)
    };
    G__10305.cljs$lang$arity$variadic = G__10305__delegate;
    return G__10305
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
  sorted_set.cljs$lang$applyTo = function(arglist__10309) {
    var keys = cljs.core.seq(arglist__10309);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__10311) {
    var comparator = cljs.core.first(arglist__10311);
    var keys = cljs.core.rest(arglist__10311);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__10317 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____10318 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____10318)) {
        var e__10319 = temp__3971__auto____10318;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__10319))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__10317, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__10310_SHARP_) {
      var temp__3971__auto____10320 = cljs.core.find.call(null, smap, p1__10310_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____10320)) {
        var e__10321 = temp__3971__auto____10320;
        return cljs.core.second.call(null, e__10321)
      }else {
        return p1__10310_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__10351 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__10344, seen) {
        while(true) {
          var vec__10345__10346 = p__10344;
          var f__10347 = cljs.core.nth.call(null, vec__10345__10346, 0, null);
          var xs__10348 = vec__10345__10346;
          var temp__3974__auto____10349 = cljs.core.seq.call(null, xs__10348);
          if(temp__3974__auto____10349) {
            var s__10350 = temp__3974__auto____10349;
            if(cljs.core.contains_QMARK_.call(null, seen, f__10347)) {
              var G__10352 = cljs.core.rest.call(null, s__10350);
              var G__10353 = seen;
              p__10344 = G__10352;
              seen = G__10353;
              continue
            }else {
              return cljs.core.cons.call(null, f__10347, step.call(null, cljs.core.rest.call(null, s__10350), cljs.core.conj.call(null, seen, f__10347)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__10351.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__10356 = cljs.core.PersistentVector.EMPTY;
  var s__10357 = s;
  while(true) {
    if(cljs.core.next.call(null, s__10357)) {
      var G__10358 = cljs.core.conj.call(null, ret__10356, cljs.core.first.call(null, s__10357));
      var G__10359 = cljs.core.next.call(null, s__10357);
      ret__10356 = G__10358;
      s__10357 = G__10359;
      continue
    }else {
      return cljs.core.seq.call(null, ret__10356)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____10362 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____10362) {
        return or__3824__auto____10362
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__10363 = x.lastIndexOf("/");
      if(i__10363 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__10363 + 1)
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
    var or__3824__auto____10366 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____10366) {
      return or__3824__auto____10366
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__10367 = x.lastIndexOf("/");
    if(i__10367 > -1) {
      return cljs.core.subs.call(null, x, 2, i__10367)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__10374 = cljs.core.ObjMap.EMPTY;
  var ks__10375 = cljs.core.seq.call(null, keys);
  var vs__10376 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____10377 = ks__10375;
      if(and__3822__auto____10377) {
        return vs__10376
      }else {
        return and__3822__auto____10377
      }
    }()) {
      var G__10378 = cljs.core.assoc.call(null, map__10374, cljs.core.first.call(null, ks__10375), cljs.core.first.call(null, vs__10376));
      var G__10379 = cljs.core.next.call(null, ks__10375);
      var G__10380 = cljs.core.next.call(null, vs__10376);
      map__10374 = G__10378;
      ks__10375 = G__10379;
      vs__10376 = G__10380;
      continue
    }else {
      return map__10374
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
    var G__10383__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__10368_SHARP_, p2__10369_SHARP_) {
        return max_key.call(null, k, p1__10368_SHARP_, p2__10369_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__10383 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10383__delegate.call(this, k, x, y, more)
    };
    G__10383.cljs$lang$maxFixedArity = 3;
    G__10383.cljs$lang$applyTo = function(arglist__10384) {
      var k = cljs.core.first(arglist__10384);
      var x = cljs.core.first(cljs.core.next(arglist__10384));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10384)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10384)));
      return G__10383__delegate(k, x, y, more)
    };
    G__10383.cljs$lang$arity$variadic = G__10383__delegate;
    return G__10383
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
    var G__10385__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__10381_SHARP_, p2__10382_SHARP_) {
        return min_key.call(null, k, p1__10381_SHARP_, p2__10382_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__10385 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10385__delegate.call(this, k, x, y, more)
    };
    G__10385.cljs$lang$maxFixedArity = 3;
    G__10385.cljs$lang$applyTo = function(arglist__10386) {
      var k = cljs.core.first(arglist__10386);
      var x = cljs.core.first(cljs.core.next(arglist__10386));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10386)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10386)));
      return G__10385__delegate(k, x, y, more)
    };
    G__10385.cljs$lang$arity$variadic = G__10385__delegate;
    return G__10385
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
      var temp__3974__auto____10389 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10389) {
        var s__10390 = temp__3974__auto____10389;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__10390), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__10390)))
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
    var temp__3974__auto____10393 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10393) {
      var s__10394 = temp__3974__auto____10393;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__10394)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__10394), take_while.call(null, pred, cljs.core.rest.call(null, s__10394)))
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
    var comp__10396 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__10396.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__10408 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____10409 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____10409)) {
        var vec__10410__10411 = temp__3974__auto____10409;
        var e__10412 = cljs.core.nth.call(null, vec__10410__10411, 0, null);
        var s__10413 = vec__10410__10411;
        if(cljs.core.truth_(include__10408.call(null, e__10412))) {
          return s__10413
        }else {
          return cljs.core.next.call(null, s__10413)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10408, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10414 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____10414)) {
      var vec__10415__10416 = temp__3974__auto____10414;
      var e__10417 = cljs.core.nth.call(null, vec__10415__10416, 0, null);
      var s__10418 = vec__10415__10416;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__10417)) ? s__10418 : cljs.core.next.call(null, s__10418))
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
    var include__10430 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____10431 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____10431)) {
        var vec__10432__10433 = temp__3974__auto____10431;
        var e__10434 = cljs.core.nth.call(null, vec__10432__10433, 0, null);
        var s__10435 = vec__10432__10433;
        if(cljs.core.truth_(include__10430.call(null, e__10434))) {
          return s__10435
        }else {
          return cljs.core.next.call(null, s__10435)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10430, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10436 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____10436)) {
      var vec__10437__10438 = temp__3974__auto____10436;
      var e__10439 = cljs.core.nth.call(null, vec__10437__10438, 0, null);
      var s__10440 = vec__10437__10438;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__10439)) ? s__10440 : cljs.core.next.call(null, s__10440))
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
  var this__10441 = this;
  var h__2192__auto____10442 = this__10441.__hash;
  if(!(h__2192__auto____10442 == null)) {
    return h__2192__auto____10442
  }else {
    var h__2192__auto____10443 = cljs.core.hash_coll.call(null, rng);
    this__10441.__hash = h__2192__auto____10443;
    return h__2192__auto____10443
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__10444 = this;
  if(this__10444.step > 0) {
    if(this__10444.start + this__10444.step < this__10444.end) {
      return new cljs.core.Range(this__10444.meta, this__10444.start + this__10444.step, this__10444.end, this__10444.step, null)
    }else {
      return null
    }
  }else {
    if(this__10444.start + this__10444.step > this__10444.end) {
      return new cljs.core.Range(this__10444.meta, this__10444.start + this__10444.step, this__10444.end, this__10444.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__10445 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__10446 = this;
  var this__10447 = this;
  return cljs.core.pr_str.call(null, this__10447)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__10448 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__10449 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__10450 = this;
  if(this__10450.step > 0) {
    if(this__10450.start < this__10450.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__10450.start > this__10450.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__10451 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__10451.end - this__10451.start) / this__10451.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__10452 = this;
  return this__10452.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__10453 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__10453.meta, this__10453.start + this__10453.step, this__10453.end, this__10453.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__10454 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__10455 = this;
  return new cljs.core.Range(meta, this__10455.start, this__10455.end, this__10455.step, this__10455.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__10456 = this;
  return this__10456.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__10457 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10457.start + n * this__10457.step
  }else {
    if(function() {
      var and__3822__auto____10458 = this__10457.start > this__10457.end;
      if(and__3822__auto____10458) {
        return this__10457.step === 0
      }else {
        return and__3822__auto____10458
      }
    }()) {
      return this__10457.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__10459 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10459.start + n * this__10459.step
  }else {
    if(function() {
      var and__3822__auto____10460 = this__10459.start > this__10459.end;
      if(and__3822__auto____10460) {
        return this__10459.step === 0
      }else {
        return and__3822__auto____10460
      }
    }()) {
      return this__10459.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__10461 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10461.meta)
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
    var temp__3974__auto____10464 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10464) {
      var s__10465 = temp__3974__auto____10464;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__10465), take_nth.call(null, n, cljs.core.drop.call(null, n, s__10465)))
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
    var temp__3974__auto____10472 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10472) {
      var s__10473 = temp__3974__auto____10472;
      var fst__10474 = cljs.core.first.call(null, s__10473);
      var fv__10475 = f.call(null, fst__10474);
      var run__10476 = cljs.core.cons.call(null, fst__10474, cljs.core.take_while.call(null, function(p1__10466_SHARP_) {
        return cljs.core._EQ_.call(null, fv__10475, f.call(null, p1__10466_SHARP_))
      }, cljs.core.next.call(null, s__10473)));
      return cljs.core.cons.call(null, run__10476, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__10476), s__10473))))
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
      var temp__3971__auto____10491 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____10491) {
        var s__10492 = temp__3971__auto____10491;
        return reductions.call(null, f, cljs.core.first.call(null, s__10492), cljs.core.rest.call(null, s__10492))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10493 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10493) {
        var s__10494 = temp__3974__auto____10493;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__10494)), cljs.core.rest.call(null, s__10494))
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
      var G__10497 = null;
      var G__10497__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__10497__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__10497__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__10497__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__10497__4 = function() {
        var G__10498__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__10498 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10498__delegate.call(this, x, y, z, args)
        };
        G__10498.cljs$lang$maxFixedArity = 3;
        G__10498.cljs$lang$applyTo = function(arglist__10499) {
          var x = cljs.core.first(arglist__10499);
          var y = cljs.core.first(cljs.core.next(arglist__10499));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10499)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10499)));
          return G__10498__delegate(x, y, z, args)
        };
        G__10498.cljs$lang$arity$variadic = G__10498__delegate;
        return G__10498
      }();
      G__10497 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10497__0.call(this);
          case 1:
            return G__10497__1.call(this, x);
          case 2:
            return G__10497__2.call(this, x, y);
          case 3:
            return G__10497__3.call(this, x, y, z);
          default:
            return G__10497__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10497.cljs$lang$maxFixedArity = 3;
      G__10497.cljs$lang$applyTo = G__10497__4.cljs$lang$applyTo;
      return G__10497
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__10500 = null;
      var G__10500__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__10500__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__10500__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__10500__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__10500__4 = function() {
        var G__10501__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__10501 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10501__delegate.call(this, x, y, z, args)
        };
        G__10501.cljs$lang$maxFixedArity = 3;
        G__10501.cljs$lang$applyTo = function(arglist__10502) {
          var x = cljs.core.first(arglist__10502);
          var y = cljs.core.first(cljs.core.next(arglist__10502));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10502)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10502)));
          return G__10501__delegate(x, y, z, args)
        };
        G__10501.cljs$lang$arity$variadic = G__10501__delegate;
        return G__10501
      }();
      G__10500 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10500__0.call(this);
          case 1:
            return G__10500__1.call(this, x);
          case 2:
            return G__10500__2.call(this, x, y);
          case 3:
            return G__10500__3.call(this, x, y, z);
          default:
            return G__10500__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10500.cljs$lang$maxFixedArity = 3;
      G__10500.cljs$lang$applyTo = G__10500__4.cljs$lang$applyTo;
      return G__10500
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__10503 = null;
      var G__10503__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__10503__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__10503__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__10503__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__10503__4 = function() {
        var G__10504__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__10504 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10504__delegate.call(this, x, y, z, args)
        };
        G__10504.cljs$lang$maxFixedArity = 3;
        G__10504.cljs$lang$applyTo = function(arglist__10505) {
          var x = cljs.core.first(arglist__10505);
          var y = cljs.core.first(cljs.core.next(arglist__10505));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10505)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10505)));
          return G__10504__delegate(x, y, z, args)
        };
        G__10504.cljs$lang$arity$variadic = G__10504__delegate;
        return G__10504
      }();
      G__10503 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10503__0.call(this);
          case 1:
            return G__10503__1.call(this, x);
          case 2:
            return G__10503__2.call(this, x, y);
          case 3:
            return G__10503__3.call(this, x, y, z);
          default:
            return G__10503__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10503.cljs$lang$maxFixedArity = 3;
      G__10503.cljs$lang$applyTo = G__10503__4.cljs$lang$applyTo;
      return G__10503
    }()
  };
  var juxt__4 = function() {
    var G__10506__delegate = function(f, g, h, fs) {
      var fs__10496 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__10507 = null;
        var G__10507__0 = function() {
          return cljs.core.reduce.call(null, function(p1__10477_SHARP_, p2__10478_SHARP_) {
            return cljs.core.conj.call(null, p1__10477_SHARP_, p2__10478_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__10496)
        };
        var G__10507__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__10479_SHARP_, p2__10480_SHARP_) {
            return cljs.core.conj.call(null, p1__10479_SHARP_, p2__10480_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__10496)
        };
        var G__10507__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__10481_SHARP_, p2__10482_SHARP_) {
            return cljs.core.conj.call(null, p1__10481_SHARP_, p2__10482_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__10496)
        };
        var G__10507__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__10483_SHARP_, p2__10484_SHARP_) {
            return cljs.core.conj.call(null, p1__10483_SHARP_, p2__10484_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__10496)
        };
        var G__10507__4 = function() {
          var G__10508__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__10485_SHARP_, p2__10486_SHARP_) {
              return cljs.core.conj.call(null, p1__10485_SHARP_, cljs.core.apply.call(null, p2__10486_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__10496)
          };
          var G__10508 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10508__delegate.call(this, x, y, z, args)
          };
          G__10508.cljs$lang$maxFixedArity = 3;
          G__10508.cljs$lang$applyTo = function(arglist__10509) {
            var x = cljs.core.first(arglist__10509);
            var y = cljs.core.first(cljs.core.next(arglist__10509));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10509)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10509)));
            return G__10508__delegate(x, y, z, args)
          };
          G__10508.cljs$lang$arity$variadic = G__10508__delegate;
          return G__10508
        }();
        G__10507 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__10507__0.call(this);
            case 1:
              return G__10507__1.call(this, x);
            case 2:
              return G__10507__2.call(this, x, y);
            case 3:
              return G__10507__3.call(this, x, y, z);
            default:
              return G__10507__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__10507.cljs$lang$maxFixedArity = 3;
        G__10507.cljs$lang$applyTo = G__10507__4.cljs$lang$applyTo;
        return G__10507
      }()
    };
    var G__10506 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10506__delegate.call(this, f, g, h, fs)
    };
    G__10506.cljs$lang$maxFixedArity = 3;
    G__10506.cljs$lang$applyTo = function(arglist__10510) {
      var f = cljs.core.first(arglist__10510);
      var g = cljs.core.first(cljs.core.next(arglist__10510));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10510)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10510)));
      return G__10506__delegate(f, g, h, fs)
    };
    G__10506.cljs$lang$arity$variadic = G__10506__delegate;
    return G__10506
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
        var G__10513 = cljs.core.next.call(null, coll);
        coll = G__10513;
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
        var and__3822__auto____10512 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____10512) {
          return n > 0
        }else {
          return and__3822__auto____10512
        }
      }())) {
        var G__10514 = n - 1;
        var G__10515 = cljs.core.next.call(null, coll);
        n = G__10514;
        coll = G__10515;
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
  var matches__10517 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__10517), s)) {
    if(cljs.core.count.call(null, matches__10517) === 1) {
      return cljs.core.first.call(null, matches__10517)
    }else {
      return cljs.core.vec.call(null, matches__10517)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__10519 = re.exec(s);
  if(matches__10519 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__10519) === 1) {
      return cljs.core.first.call(null, matches__10519)
    }else {
      return cljs.core.vec.call(null, matches__10519)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__10524 = cljs.core.re_find.call(null, re, s);
  var match_idx__10525 = s.search(re);
  var match_str__10526 = cljs.core.coll_QMARK_.call(null, match_data__10524) ? cljs.core.first.call(null, match_data__10524) : match_data__10524;
  var post_match__10527 = cljs.core.subs.call(null, s, match_idx__10525 + cljs.core.count.call(null, match_str__10526));
  if(cljs.core.truth_(match_data__10524)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__10524, re_seq.call(null, re, post_match__10527))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__10534__10535 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___10536 = cljs.core.nth.call(null, vec__10534__10535, 0, null);
  var flags__10537 = cljs.core.nth.call(null, vec__10534__10535, 1, null);
  var pattern__10538 = cljs.core.nth.call(null, vec__10534__10535, 2, null);
  return new RegExp(pattern__10538, flags__10537)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__10528_SHARP_) {
    return print_one.call(null, p1__10528_SHARP_, opts)
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
          var and__3822__auto____10548 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____10548)) {
            var and__3822__auto____10552 = function() {
              var G__10549__10550 = obj;
              if(G__10549__10550) {
                if(function() {
                  var or__3824__auto____10551 = G__10549__10550.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____10551) {
                    return or__3824__auto____10551
                  }else {
                    return G__10549__10550.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__10549__10550.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10549__10550)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10549__10550)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____10552)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____10552
            }
          }else {
            return and__3822__auto____10548
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____10553 = !(obj == null);
          if(and__3822__auto____10553) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____10553
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__10554__10555 = obj;
          if(G__10554__10555) {
            if(function() {
              var or__3824__auto____10556 = G__10554__10555.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____10556) {
                return or__3824__auto____10556
              }else {
                return G__10554__10555.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__10554__10555.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10554__10555)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10554__10555)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__10576 = new goog.string.StringBuffer;
  var G__10577__10578 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10577__10578) {
    var string__10579 = cljs.core.first.call(null, G__10577__10578);
    var G__10577__10580 = G__10577__10578;
    while(true) {
      sb__10576.append(string__10579);
      var temp__3974__auto____10581 = cljs.core.next.call(null, G__10577__10580);
      if(temp__3974__auto____10581) {
        var G__10577__10582 = temp__3974__auto____10581;
        var G__10595 = cljs.core.first.call(null, G__10577__10582);
        var G__10596 = G__10577__10582;
        string__10579 = G__10595;
        G__10577__10580 = G__10596;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10583__10584 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10583__10584) {
    var obj__10585 = cljs.core.first.call(null, G__10583__10584);
    var G__10583__10586 = G__10583__10584;
    while(true) {
      sb__10576.append(" ");
      var G__10587__10588 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10585, opts));
      if(G__10587__10588) {
        var string__10589 = cljs.core.first.call(null, G__10587__10588);
        var G__10587__10590 = G__10587__10588;
        while(true) {
          sb__10576.append(string__10589);
          var temp__3974__auto____10591 = cljs.core.next.call(null, G__10587__10590);
          if(temp__3974__auto____10591) {
            var G__10587__10592 = temp__3974__auto____10591;
            var G__10597 = cljs.core.first.call(null, G__10587__10592);
            var G__10598 = G__10587__10592;
            string__10589 = G__10597;
            G__10587__10590 = G__10598;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10593 = cljs.core.next.call(null, G__10583__10586);
      if(temp__3974__auto____10593) {
        var G__10583__10594 = temp__3974__auto____10593;
        var G__10599 = cljs.core.first.call(null, G__10583__10594);
        var G__10600 = G__10583__10594;
        obj__10585 = G__10599;
        G__10583__10586 = G__10600;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__10576
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__10602 = cljs.core.pr_sb.call(null, objs, opts);
  sb__10602.append("\n");
  return[cljs.core.str(sb__10602)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__10621__10622 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10621__10622) {
    var string__10623 = cljs.core.first.call(null, G__10621__10622);
    var G__10621__10624 = G__10621__10622;
    while(true) {
      cljs.core.string_print.call(null, string__10623);
      var temp__3974__auto____10625 = cljs.core.next.call(null, G__10621__10624);
      if(temp__3974__auto____10625) {
        var G__10621__10626 = temp__3974__auto____10625;
        var G__10639 = cljs.core.first.call(null, G__10621__10626);
        var G__10640 = G__10621__10626;
        string__10623 = G__10639;
        G__10621__10624 = G__10640;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10627__10628 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10627__10628) {
    var obj__10629 = cljs.core.first.call(null, G__10627__10628);
    var G__10627__10630 = G__10627__10628;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__10631__10632 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10629, opts));
      if(G__10631__10632) {
        var string__10633 = cljs.core.first.call(null, G__10631__10632);
        var G__10631__10634 = G__10631__10632;
        while(true) {
          cljs.core.string_print.call(null, string__10633);
          var temp__3974__auto____10635 = cljs.core.next.call(null, G__10631__10634);
          if(temp__3974__auto____10635) {
            var G__10631__10636 = temp__3974__auto____10635;
            var G__10641 = cljs.core.first.call(null, G__10631__10636);
            var G__10642 = G__10631__10636;
            string__10633 = G__10641;
            G__10631__10634 = G__10642;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10637 = cljs.core.next.call(null, G__10627__10630);
      if(temp__3974__auto____10637) {
        var G__10627__10638 = temp__3974__auto____10637;
        var G__10643 = cljs.core.first.call(null, G__10627__10638);
        var G__10644 = G__10627__10638;
        obj__10629 = G__10643;
        G__10627__10630 = G__10644;
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
  pr_str.cljs$lang$applyTo = function(arglist__10645) {
    var objs = cljs.core.seq(arglist__10645);
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
  prn_str.cljs$lang$applyTo = function(arglist__10646) {
    var objs = cljs.core.seq(arglist__10646);
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
  pr.cljs$lang$applyTo = function(arglist__10647) {
    var objs = cljs.core.seq(arglist__10647);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__10648) {
    var objs = cljs.core.seq(arglist__10648);
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
  print_str.cljs$lang$applyTo = function(arglist__10649) {
    var objs = cljs.core.seq(arglist__10649);
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
  println.cljs$lang$applyTo = function(arglist__10650) {
    var objs = cljs.core.seq(arglist__10650);
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
  println_str.cljs$lang$applyTo = function(arglist__10651) {
    var objs = cljs.core.seq(arglist__10651);
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
  prn.cljs$lang$applyTo = function(arglist__10652) {
    var objs = cljs.core.seq(arglist__10652);
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
  printf.cljs$lang$applyTo = function(arglist__10653) {
    var fmt = cljs.core.first(arglist__10653);
    var args = cljs.core.rest(arglist__10653);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10654 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10654, "{", ", ", "}", opts, coll)
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
  var pr_pair__10655 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10655, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10656 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10656, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____10657 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____10657)) {
        var nspc__10658 = temp__3974__auto____10657;
        return[cljs.core.str(nspc__10658), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____10659 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____10659)) {
          var nspc__10660 = temp__3974__auto____10659;
          return[cljs.core.str(nspc__10660), cljs.core.str("/")].join("")
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
  var pr_pair__10661 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10661, "{", ", ", "}", opts, coll)
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
  var normalize__10663 = function(n, len) {
    var ns__10662 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__10662) < len) {
        var G__10665 = [cljs.core.str("0"), cljs.core.str(ns__10662)].join("");
        ns__10662 = G__10665;
        continue
      }else {
        return ns__10662
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__10663.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__10663.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__10663.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10663.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10663.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__10663.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__10664 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10664, "{", ", ", "}", opts, coll)
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
  var this__10666 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__10667 = this;
  var G__10668__10669 = cljs.core.seq.call(null, this__10667.watches);
  if(G__10668__10669) {
    var G__10671__10673 = cljs.core.first.call(null, G__10668__10669);
    var vec__10672__10674 = G__10671__10673;
    var key__10675 = cljs.core.nth.call(null, vec__10672__10674, 0, null);
    var f__10676 = cljs.core.nth.call(null, vec__10672__10674, 1, null);
    var G__10668__10677 = G__10668__10669;
    var G__10671__10678 = G__10671__10673;
    var G__10668__10679 = G__10668__10677;
    while(true) {
      var vec__10680__10681 = G__10671__10678;
      var key__10682 = cljs.core.nth.call(null, vec__10680__10681, 0, null);
      var f__10683 = cljs.core.nth.call(null, vec__10680__10681, 1, null);
      var G__10668__10684 = G__10668__10679;
      f__10683.call(null, key__10682, this$, oldval, newval);
      var temp__3974__auto____10685 = cljs.core.next.call(null, G__10668__10684);
      if(temp__3974__auto____10685) {
        var G__10668__10686 = temp__3974__auto____10685;
        var G__10693 = cljs.core.first.call(null, G__10668__10686);
        var G__10694 = G__10668__10686;
        G__10671__10678 = G__10693;
        G__10668__10679 = G__10694;
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
  var this__10687 = this;
  return this$.watches = cljs.core.assoc.call(null, this__10687.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__10688 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__10688.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__10689 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__10689.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__10690 = this;
  return this__10690.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10691 = this;
  return this__10691.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__10692 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__10706__delegate = function(x, p__10695) {
      var map__10701__10702 = p__10695;
      var map__10701__10703 = cljs.core.seq_QMARK_.call(null, map__10701__10702) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10701__10702) : map__10701__10702;
      var validator__10704 = cljs.core._lookup.call(null, map__10701__10703, "\ufdd0'validator", null);
      var meta__10705 = cljs.core._lookup.call(null, map__10701__10703, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__10705, validator__10704, null)
    };
    var G__10706 = function(x, var_args) {
      var p__10695 = null;
      if(goog.isDef(var_args)) {
        p__10695 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10706__delegate.call(this, x, p__10695)
    };
    G__10706.cljs$lang$maxFixedArity = 1;
    G__10706.cljs$lang$applyTo = function(arglist__10707) {
      var x = cljs.core.first(arglist__10707);
      var p__10695 = cljs.core.rest(arglist__10707);
      return G__10706__delegate(x, p__10695)
    };
    G__10706.cljs$lang$arity$variadic = G__10706__delegate;
    return G__10706
  }();
  atom = function(x, var_args) {
    var p__10695 = var_args;
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
  var temp__3974__auto____10711 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____10711)) {
    var validate__10712 = temp__3974__auto____10711;
    if(cljs.core.truth_(validate__10712.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__10713 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__10713, new_value);
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
    var G__10714__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__10714 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__10714__delegate.call(this, a, f, x, y, z, more)
    };
    G__10714.cljs$lang$maxFixedArity = 5;
    G__10714.cljs$lang$applyTo = function(arglist__10715) {
      var a = cljs.core.first(arglist__10715);
      var f = cljs.core.first(cljs.core.next(arglist__10715));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10715)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10715))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10715)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10715)))));
      return G__10714__delegate(a, f, x, y, z, more)
    };
    G__10714.cljs$lang$arity$variadic = G__10714__delegate;
    return G__10714
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__10716) {
    var iref = cljs.core.first(arglist__10716);
    var f = cljs.core.first(cljs.core.next(arglist__10716));
    var args = cljs.core.rest(cljs.core.next(arglist__10716));
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
  var this__10717 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__10717.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10718 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__10718.state, function(p__10719) {
    var map__10720__10721 = p__10719;
    var map__10720__10722 = cljs.core.seq_QMARK_.call(null, map__10720__10721) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10720__10721) : map__10720__10721;
    var curr_state__10723 = map__10720__10722;
    var done__10724 = cljs.core._lookup.call(null, map__10720__10722, "\ufdd0'done", null);
    if(cljs.core.truth_(done__10724)) {
      return curr_state__10723
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__10718.f.call(null)})
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
    var map__10745__10746 = options;
    var map__10745__10747 = cljs.core.seq_QMARK_.call(null, map__10745__10746) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10745__10746) : map__10745__10746;
    var keywordize_keys__10748 = cljs.core._lookup.call(null, map__10745__10747, "\ufdd0'keywordize-keys", null);
    var keyfn__10749 = cljs.core.truth_(keywordize_keys__10748) ? cljs.core.keyword : cljs.core.str;
    var f__10764 = function thisfn(x) {
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
                var iter__2462__auto____10763 = function iter__10757(s__10758) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__10758__10761 = s__10758;
                    while(true) {
                      if(cljs.core.seq.call(null, s__10758__10761)) {
                        var k__10762 = cljs.core.first.call(null, s__10758__10761);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__10749.call(null, k__10762), thisfn.call(null, x[k__10762])], true), iter__10757.call(null, cljs.core.rest.call(null, s__10758__10761)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____10763.call(null, cljs.core.js_keys.call(null, x))
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
    return f__10764.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__10765) {
    var x = cljs.core.first(arglist__10765);
    var options = cljs.core.rest(arglist__10765);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__10770 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__10774__delegate = function(args) {
      var temp__3971__auto____10771 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__10770), args, null);
      if(cljs.core.truth_(temp__3971__auto____10771)) {
        var v__10772 = temp__3971__auto____10771;
        return v__10772
      }else {
        var ret__10773 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__10770, cljs.core.assoc, args, ret__10773);
        return ret__10773
      }
    };
    var G__10774 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10774__delegate.call(this, args)
    };
    G__10774.cljs$lang$maxFixedArity = 0;
    G__10774.cljs$lang$applyTo = function(arglist__10775) {
      var args = cljs.core.seq(arglist__10775);
      return G__10774__delegate(args)
    };
    G__10774.cljs$lang$arity$variadic = G__10774__delegate;
    return G__10774
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__10777 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__10777)) {
        var G__10778 = ret__10777;
        f = G__10778;
        continue
      }else {
        return ret__10777
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__10779__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__10779 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10779__delegate.call(this, f, args)
    };
    G__10779.cljs$lang$maxFixedArity = 1;
    G__10779.cljs$lang$applyTo = function(arglist__10780) {
      var f = cljs.core.first(arglist__10780);
      var args = cljs.core.rest(arglist__10780);
      return G__10779__delegate(f, args)
    };
    G__10779.cljs$lang$arity$variadic = G__10779__delegate;
    return G__10779
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
    var k__10782 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__10782, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__10782, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____10791 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____10791) {
      return or__3824__auto____10791
    }else {
      var or__3824__auto____10792 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____10792) {
        return or__3824__auto____10792
      }else {
        var and__3822__auto____10793 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____10793) {
          var and__3822__auto____10794 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____10794) {
            var and__3822__auto____10795 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____10795) {
              var ret__10796 = true;
              var i__10797 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____10798 = cljs.core.not.call(null, ret__10796);
                  if(or__3824__auto____10798) {
                    return or__3824__auto____10798
                  }else {
                    return i__10797 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__10796
                }else {
                  var G__10799 = isa_QMARK_.call(null, h, child.call(null, i__10797), parent.call(null, i__10797));
                  var G__10800 = i__10797 + 1;
                  ret__10796 = G__10799;
                  i__10797 = G__10800;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____10795
            }
          }else {
            return and__3822__auto____10794
          }
        }else {
          return and__3822__auto____10793
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
    var tp__10809 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__10810 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__10811 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__10812 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____10813 = cljs.core.contains_QMARK_.call(null, tp__10809.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__10811.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__10811.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__10809, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__10812.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__10810, parent, ta__10811), "\ufdd0'descendants":tf__10812.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__10811, tag, td__10810)})
    }();
    if(cljs.core.truth_(or__3824__auto____10813)) {
      return or__3824__auto____10813
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
    var parentMap__10818 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__10819 = cljs.core.truth_(parentMap__10818.call(null, tag)) ? cljs.core.disj.call(null, parentMap__10818.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__10820 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__10819)) ? cljs.core.assoc.call(null, parentMap__10818, tag, childsParents__10819) : cljs.core.dissoc.call(null, parentMap__10818, tag);
    var deriv_seq__10821 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__10801_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__10801_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__10801_SHARP_), cljs.core.second.call(null, p1__10801_SHARP_)))
    }, cljs.core.seq.call(null, newParents__10820)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__10818.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__10802_SHARP_, p2__10803_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__10802_SHARP_, p2__10803_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__10821))
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
  var xprefs__10829 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____10831 = cljs.core.truth_(function() {
    var and__3822__auto____10830 = xprefs__10829;
    if(cljs.core.truth_(and__3822__auto____10830)) {
      return xprefs__10829.call(null, y)
    }else {
      return and__3822__auto____10830
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____10831)) {
    return or__3824__auto____10831
  }else {
    var or__3824__auto____10833 = function() {
      var ps__10832 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__10832) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__10832), prefer_table))) {
          }else {
          }
          var G__10836 = cljs.core.rest.call(null, ps__10832);
          ps__10832 = G__10836;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____10833)) {
      return or__3824__auto____10833
    }else {
      var or__3824__auto____10835 = function() {
        var ps__10834 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__10834) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__10834), y, prefer_table))) {
            }else {
            }
            var G__10837 = cljs.core.rest.call(null, ps__10834);
            ps__10834 = G__10837;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____10835)) {
        return or__3824__auto____10835
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____10839 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____10839)) {
    return or__3824__auto____10839
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10857 = cljs.core.reduce.call(null, function(be, p__10849) {
    var vec__10850__10851 = p__10849;
    var k__10852 = cljs.core.nth.call(null, vec__10850__10851, 0, null);
    var ___10853 = cljs.core.nth.call(null, vec__10850__10851, 1, null);
    var e__10854 = vec__10850__10851;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10852)) {
      var be2__10856 = cljs.core.truth_(function() {
        var or__3824__auto____10855 = be == null;
        if(or__3824__auto____10855) {
          return or__3824__auto____10855
        }else {
          return cljs.core.dominates.call(null, k__10852, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10854 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10856), k__10852, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10852), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10856)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10856
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10857)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10857));
      return cljs.core.second.call(null, best_entry__10857)
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
    var and__3822__auto____10862 = mf;
    if(and__3822__auto____10862) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10862
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____10863 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10864 = cljs.core._reset[goog.typeOf(x__2363__auto____10863)];
      if(or__3824__auto____10864) {
        return or__3824__auto____10864
      }else {
        var or__3824__auto____10865 = cljs.core._reset["_"];
        if(or__3824__auto____10865) {
          return or__3824__auto____10865
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10870 = mf;
    if(and__3822__auto____10870) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10870
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____10871 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10872 = cljs.core._add_method[goog.typeOf(x__2363__auto____10871)];
      if(or__3824__auto____10872) {
        return or__3824__auto____10872
      }else {
        var or__3824__auto____10873 = cljs.core._add_method["_"];
        if(or__3824__auto____10873) {
          return or__3824__auto____10873
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10878 = mf;
    if(and__3822__auto____10878) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10878
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____10879 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10880 = cljs.core._remove_method[goog.typeOf(x__2363__auto____10879)];
      if(or__3824__auto____10880) {
        return or__3824__auto____10880
      }else {
        var or__3824__auto____10881 = cljs.core._remove_method["_"];
        if(or__3824__auto____10881) {
          return or__3824__auto____10881
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10886 = mf;
    if(and__3822__auto____10886) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10886
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____10887 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10888 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____10887)];
      if(or__3824__auto____10888) {
        return or__3824__auto____10888
      }else {
        var or__3824__auto____10889 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10889) {
          return or__3824__auto____10889
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10894 = mf;
    if(and__3822__auto____10894) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10894
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____10895 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10896 = cljs.core._get_method[goog.typeOf(x__2363__auto____10895)];
      if(or__3824__auto____10896) {
        return or__3824__auto____10896
      }else {
        var or__3824__auto____10897 = cljs.core._get_method["_"];
        if(or__3824__auto____10897) {
          return or__3824__auto____10897
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10902 = mf;
    if(and__3822__auto____10902) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10902
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____10903 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10904 = cljs.core._methods[goog.typeOf(x__2363__auto____10903)];
      if(or__3824__auto____10904) {
        return or__3824__auto____10904
      }else {
        var or__3824__auto____10905 = cljs.core._methods["_"];
        if(or__3824__auto____10905) {
          return or__3824__auto____10905
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10910 = mf;
    if(and__3822__auto____10910) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10910
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____10911 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10912 = cljs.core._prefers[goog.typeOf(x__2363__auto____10911)];
      if(or__3824__auto____10912) {
        return or__3824__auto____10912
      }else {
        var or__3824__auto____10913 = cljs.core._prefers["_"];
        if(or__3824__auto____10913) {
          return or__3824__auto____10913
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10918 = mf;
    if(and__3822__auto____10918) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10918
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____10919 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10920 = cljs.core._dispatch[goog.typeOf(x__2363__auto____10919)];
      if(or__3824__auto____10920) {
        return or__3824__auto____10920
      }else {
        var or__3824__auto____10921 = cljs.core._dispatch["_"];
        if(or__3824__auto____10921) {
          return or__3824__auto____10921
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10924 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10925 = cljs.core._get_method.call(null, mf, dispatch_val__10924);
  if(cljs.core.truth_(target_fn__10925)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10924)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10925, args)
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
  var this__10926 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10927 = this;
  cljs.core.swap_BANG_.call(null, this__10927.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10927.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10927.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10927.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10928 = this;
  cljs.core.swap_BANG_.call(null, this__10928.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10928.method_cache, this__10928.method_table, this__10928.cached_hierarchy, this__10928.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10929 = this;
  cljs.core.swap_BANG_.call(null, this__10929.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10929.method_cache, this__10929.method_table, this__10929.cached_hierarchy, this__10929.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10930 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10930.cached_hierarchy), cljs.core.deref.call(null, this__10930.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10930.method_cache, this__10930.method_table, this__10930.cached_hierarchy, this__10930.hierarchy)
  }
  var temp__3971__auto____10931 = cljs.core.deref.call(null, this__10930.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10931)) {
    var target_fn__10932 = temp__3971__auto____10931;
    return target_fn__10932
  }else {
    var temp__3971__auto____10933 = cljs.core.find_and_cache_best_method.call(null, this__10930.name, dispatch_val, this__10930.hierarchy, this__10930.method_table, this__10930.prefer_table, this__10930.method_cache, this__10930.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10933)) {
      var target_fn__10934 = temp__3971__auto____10933;
      return target_fn__10934
    }else {
      return cljs.core.deref.call(null, this__10930.method_table).call(null, this__10930.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10935 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10935.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10935.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10935.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10935.method_cache, this__10935.method_table, this__10935.cached_hierarchy, this__10935.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10936 = this;
  return cljs.core.deref.call(null, this__10936.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10937 = this;
  return cljs.core.deref.call(null, this__10937.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10938 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10938.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10940__delegate = function(_, args) {
    var self__10939 = this;
    return cljs.core._dispatch.call(null, self__10939, args)
  };
  var G__10940 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10940__delegate.call(this, _, args)
  };
  G__10940.cljs$lang$maxFixedArity = 1;
  G__10940.cljs$lang$applyTo = function(arglist__10941) {
    var _ = cljs.core.first(arglist__10941);
    var args = cljs.core.rest(arglist__10941);
    return G__10940__delegate(_, args)
  };
  G__10940.cljs$lang$arity$variadic = G__10940__delegate;
  return G__10940
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10942 = this;
  return cljs.core._dispatch.call(null, self__10942, args)
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
  var this__10943 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10945, _) {
  var this__10944 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10944.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10946 = this;
  var and__3822__auto____10947 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10947) {
    return this__10946.uuid === other.uuid
  }else {
    return and__3822__auto____10947
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10948 = this;
  var this__10949 = this;
  return cljs.core.pr_str.call(null, this__10949)
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
  var or__3824__auto____6103 = cljs.core._EQ_.call(null, x, "\t");
  if(or__3824__auto____6103) {
    return or__3824__auto____6103
  }else {
    var or__3824__auto____6104 = cljs.core._EQ_.call(null, x, " ");
    if(or__3824__auto____6104) {
      return or__3824__auto____6104
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
  var and__3822__auto____6108 = function() {
    var and__3822__auto____6107 = 0 <= i;
    if(and__3822__auto____6107) {
      return i <= cljs.core.count.call(null, (new cljs.core.Keyword("\ufdd0'chars")).call(null, p))
    }else {
      return and__3822__auto____6107
    }
  }();
  if(cljs.core.truth_(and__3822__auto____6108)) {
    return cljs.core._EQ_.call(null, mode, subpar.core.get_mode.call(null, p, i))
  }else {
    return and__3822__auto____6108
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
  var and__3822__auto____6112 = i;
  if(cljs.core.truth_(and__3822__auto____6112)) {
    var and__3822__auto____6113 = j;
    if(cljs.core.truth_(and__3822__auto____6113)) {
      return cljs.core.count.call(null, cljs.core.filter.call(null, function(p1__6109_SHARP_) {
        return cljs.core._EQ_.call(null, "\n", p1__6109_SHARP_)
      }, cljs.core.drop.call(null, i, cljs.core.drop_last.call(null, cljs.core.count.call(null, s) - j - 1, cljs.core.take.call(null, cljs.core.count.call(null, s), s))))) + 1
    }else {
      return and__3822__auto____6113
    }
  }else {
    return and__3822__auto____6112
  }
};
subpar.core.escaped_QMARK_ = function escaped_QMARK_(s, i) {
  return cljs.core.odd_QMARK_.call(null, function() {
    var c__6117 = 0;
    var j__6118 = i - 1;
    while(true) {
      var a__6119 = cljs.core.nth.call(null, s, j__6118, null);
      if(j__6118 < 0) {
        return c__6117
      }else {
        if(a__6119 == null) {
          return c__6117
        }else {
          if(cljs.core.not_EQ_.call(null, "\\", a__6119)) {
            return c__6117
          }else {
            if(true) {
              var G__6120 = c__6117 + 1;
              var G__6121 = j__6118 - 1;
              c__6117 = G__6120;
              j__6118 = G__6121;
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
  var vec__6126__6127 = subpar.core.get_wrapper.call(null, subpar.core.parse.call(null, s), i);
  var o__6128 = cljs.core.nth.call(null, vec__6126__6127, 0, null);
  var c__6129 = cljs.core.nth.call(null, vec__6126__6127, 1, null);
  if(cljs.core._EQ_.call(null, -1, o__6128)) {
    return i
  }else {
    return o__6128
  }
};
goog.exportSymbol("subpar.core.backward_up_fn", subpar.core.backward_up_fn);
subpar.core.forward_delete_action = function forward_delete_action(s, i) {
  var p__6134 = subpar.core.parse.call(null, s);
  var h__6135 = i - 1;
  var j__6136 = i + 1;
  var c__6137 = cljs.core.nth.call(null, s, i, null);
  if(i >= cljs.core.count.call(null, s)) {
    return 0
  }else {
    if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, i))) {
      return 2
    }else {
      if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, j__6136))) {
        return 3
      }else {
        if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([h__6135, i], true), subpar.core.get_wrapper.call(null, p__6134, i))) {
          return 2
        }else {
          if(cljs.core.truth_(subpar.core.closes_list_QMARK_.call(null, p__6134, i))) {
            return 0
          }else {
            if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([i, j__6136], true), subpar.core.get_wrapper.call(null, p__6134, j__6136))) {
              return 3
            }else {
              if(cljs.core.truth_(subpar.core.opens_list_QMARK_.call(null, p__6134, i))) {
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
  var p__6141 = subpar.core.parse.call(null, s);
  var g__6142 = i - 2;
  var h__6143 = i - 1;
  if(i <= 0) {
    return 0
  }else {
    if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, h__6143))) {
      return 3
    }else {
      if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, i))) {
        return 2
      }else {
        if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([g__6142, h__6143], true), subpar.core.get_wrapper.call(null, p__6141, h__6143))) {
          return 3
        }else {
          if(cljs.core.truth_(subpar.core.closes_list_QMARK_.call(null, p__6141, h__6143))) {
            return 4
          }else {
            if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([h__6143, i], true), subpar.core.get_wrapper.call(null, p__6141, i))) {
              return 2
            }else {
              if(cljs.core.truth_(subpar.core.opens_list_QMARK_.call(null, p__6141, h__6143))) {
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
  var p__6145 = subpar.core.parse.call(null, s);
  if(i < 0) {
    return 0
  }else {
    if(i >= cljs.core.count.call(null, s)) {
      return 0
    }else {
      if(cljs.core.truth_(subpar.core.in_comment_QMARK_.call(null, p__6145, i))) {
        return 3
      }else {
        if(cljs.core.truth_(subpar.core.n_str_QMARK_.call(null, p__6145, i))) {
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
  var vec__6155__6156 = subpar.core.get_wrapper.call(null, p, i);
  var o__6157 = cljs.core.nth.call(null, vec__6155__6156, 0, null);
  var c__6158 = cljs.core.nth.call(null, vec__6155__6156, 1, null);
  if(cljs.core._EQ_.call(null, -1, o__6157)) {
    return cljs.core.PersistentVector.EMPTY
  }else {
    var start__6160 = function() {
      var or__3824__auto____6159 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, cljs.core.identity, p));
      if(cljs.core.truth_(or__3824__auto____6159)) {
        return or__3824__auto____6159
      }else {
        return o__6157
      }
    }() + 1;
    var delete__6161 = cljs.core.not_EQ_.call(null, start__6160, c__6158);
    var dest__6162 = delete__6161 ? start__6160 + 1 : c__6158 + 1;
    return cljs.core.PersistentVector.fromArray([delete__6161, start__6160, c__6158, dest__6162], true)
  }
};
goog.exportSymbol("subpar.core.close_expression_vals", subpar.core.close_expression_vals);
subpar.core.get_start_of_next_list = function get_start_of_next_list(s, i) {
  var p__6166 = subpar.core.parse.call(null, s);
  var r__6168 = cljs.core.first.call(null, subpar.core.get_siblings.call(null, i, cljs.core.keys, function(p1__6146_SHARP_) {
    var and__3822__auto____6167 = p1__6146_SHARP_ >= i;
    if(and__3822__auto____6167) {
      return cljs.core.get_in.call(null, p__6166, cljs.core.PersistentVector.fromArray(["\ufdd0'families", p1__6146_SHARP_], true))
    }else {
      return and__3822__auto____6167
    }
  }, p__6166));
  if(r__6168 == null) {
    return false
  }else {
    return r__6168
  }
};
subpar.core.forward_down_fn = function forward_down_fn(s, i) {
  var r__6171 = subpar.core.get_start_of_next_list.call(null, s, i);
  if(cljs.core.truth_(r__6171)) {
    return r__6171 + 1
  }else {
    return i
  }
};
goog.exportSymbol("subpar.core.forward_down_fn", subpar.core.forward_down_fn);
subpar.core.backward_fn = function backward_fn(s, i) {
  var p__6177 = subpar.core.parse.call(null, s);
  var b__6178 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.keys, function(p1__6169_SHARP_) {
    return p1__6169_SHARP_ < i
  }, p__6177));
  var o__6179 = subpar.core.get_opening_delimiter_index_with_parse.call(null, p__6177, i);
  var or__3824__auto____6180 = b__6178;
  if(cljs.core.truth_(or__3824__auto____6180)) {
    return or__3824__auto____6180
  }else {
    if(o__6179 < 0) {
      return 0
    }else {
      return o__6179
    }
  }
};
goog.exportSymbol("subpar.core.backward_fn", subpar.core.backward_fn);
subpar.core.backward_down_fn = function backward_down_fn(s, i) {
  var p__6185 = subpar.core.parse.call(null, s);
  var b__6187 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, function(p1__6172_SHARP_) {
    var and__3822__auto____6186 = p1__6172_SHARP_ < i;
    if(and__3822__auto____6186) {
      return subpar.core.closes_list_QMARK_.call(null, p__6185, p1__6172_SHARP_)
    }else {
      return and__3822__auto____6186
    }
  }, p__6185));
  var or__3824__auto____6188 = b__6187;
  if(cljs.core.truth_(or__3824__auto____6188)) {
    return or__3824__auto____6188
  }else {
    return i
  }
};
goog.exportSymbol("subpar.core.backward_down_fn", subpar.core.backward_down_fn);
subpar.core.forward_up_fn = function forward_up_fn(s, i) {
  var p__6197 = subpar.core.parse.call(null, s);
  var vec__6196__6198 = subpar.core.get_wrapper.call(null, p__6197, i);
  var o__6199 = cljs.core.nth.call(null, vec__6196__6198, 0, null);
  var c__6200 = cljs.core.nth.call(null, vec__6196__6198, 1, null);
  var in_list__6201 = cljs.core.not_EQ_.call(null, -1, o__6199);
  if(in_list__6201) {
    return c__6200 + 1
  }else {
    return i
  }
};
goog.exportSymbol("subpar.core.forward_up_fn", subpar.core.forward_up_fn);
subpar.core.forward_fn = function forward_fn(s, i) {
  var p__6207 = subpar.core.parse.call(null, s);
  var b__6208 = cljs.core.first.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, function(p1__6189_SHARP_) {
    return p1__6189_SHARP_ >= i
  }, p__6207));
  var c__6209 = subpar.core.get_closing_delimiter_index_with_parse.call(null, p__6207, i);
  var l__6210 = cljs.core.count.call(null, s);
  if(cljs.core.truth_(b__6208)) {
    return b__6208 + 1
  }else {
    if(cljs.core.truth_(c__6209)) {
      return c__6209 + 1 < l__6210 ? c__6209 + 1 : l__6210
    }else {
      if(true) {
        return l__6210
      }else {
        return null
      }
    }
  }
};
goog.exportSymbol("subpar.core.forward_fn", subpar.core.forward_fn);
subpar.core.forward_slurp_vals = function forward_slurp_vals(s, i) {
  var p__6225 = subpar.core.parse.call(null, s);
  var vec__6224__6226 = subpar.core.get_wrapper.call(null, p__6225, i);
  var o__6227 = cljs.core.nth.call(null, vec__6224__6226, 0, null);
  var c__6228 = cljs.core.nth.call(null, vec__6224__6226, 1, null);
  var in_list__6229 = cljs.core.not_EQ_.call(null, -1, o__6227);
  var a__6231 = function() {
    var and__3822__auto____6230 = in_list__6229;
    if(and__3822__auto____6230) {
      return cljs.core.nth.call(null, s, c__6228, false)
    }else {
      return and__3822__auto____6230
    }
  }();
  var d__6233 = function() {
    var and__3822__auto____6232 = in_list__6229;
    if(and__3822__auto____6232) {
      return cljs.core.first.call(null, subpar.core.get_siblings.call(null, o__6227, cljs.core.vals, function(p1__6202_SHARP_) {
        return p1__6202_SHARP_ > c__6228
      }, p__6225))
    }else {
      return and__3822__auto____6232
    }
  }();
  if(cljs.core.truth_(function() {
    var and__3822__auto____6234 = a__6231;
    if(cljs.core.truth_(and__3822__auto____6234)) {
      var and__3822__auto____6235 = c__6228;
      if(cljs.core.truth_(and__3822__auto____6235)) {
        return d__6233
      }else {
        return and__3822__auto____6235
      }
    }else {
      return and__3822__auto____6234
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([a__6231, c__6228, d__6233 + 1, subpar.core.count_lines.call(null, s, o__6227, d__6233 + 1)], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
goog.exportSymbol("subpar.core.forward_slurp_vals", subpar.core.forward_slurp_vals);
subpar.core.backward_slurp_vals = function backward_slurp_vals(s, i) {
  var p__6248 = subpar.core.parse.call(null, s);
  var vec__6247__6249 = subpar.core.get_wrapper.call(null, p__6248, i);
  var o__6250 = cljs.core.nth.call(null, vec__6247__6249, 0, null);
  var c__6251 = cljs.core.nth.call(null, vec__6247__6249, 1, null);
  var in_list__6252 = cljs.core.not_EQ_.call(null, -1, o__6250);
  var d__6254 = function() {
    var and__3822__auto____6253 = in_list__6252;
    if(and__3822__auto____6253) {
      return cljs.core.last.call(null, subpar.core.get_siblings.call(null, o__6250, cljs.core.keys, function(p1__6211_SHARP_) {
        return p1__6211_SHARP_ < o__6250
      }, p__6248))
    }else {
      return and__3822__auto____6253
    }
  }();
  var a__6256 = function() {
    var and__3822__auto____6255 = in_list__6252;
    if(and__3822__auto____6255) {
      return cljs.core.nth.call(null, s, o__6250, false)
    }else {
      return and__3822__auto____6255
    }
  }();
  if(cljs.core.truth_(function() {
    var and__3822__auto____6257 = a__6256;
    if(cljs.core.truth_(and__3822__auto____6257)) {
      return d__6254
    }else {
      return and__3822__auto____6257
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([a__6256, o__6250, d__6254, subpar.core.count_lines.call(null, s, d__6254, c__6251)], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
goog.exportSymbol("subpar.core.backward_slurp_vals", subpar.core.backward_slurp_vals);
subpar.core.forward_barf_vals = function forward_barf_vals(s, i) {
  var p__6273 = subpar.core.parse.call(null, s);
  var vec__6272__6274 = subpar.core.get_wrapper.call(null, p__6273, i);
  var o__6275 = cljs.core.nth.call(null, vec__6272__6274, 0, null);
  var c__6276 = cljs.core.nth.call(null, vec__6272__6274, 1, null);
  var in_list__6277 = cljs.core.not_EQ_.call(null, -1, o__6275);
  var endings__6279 = function() {
    var and__3822__auto____6278 = in_list__6277;
    if(and__3822__auto____6278) {
      return subpar.core.get_siblings.call(null, i, cljs.core.vals, cljs.core.constantly.call(null, true), p__6273)
    }else {
      return and__3822__auto____6278
    }
  }();
  var a__6282 = function() {
    var and__3822__auto____6280 = c__6276;
    if(cljs.core.truth_(and__3822__auto____6280)) {
      var and__3822__auto____6281 = in_list__6277;
      if(and__3822__auto____6281) {
        return cljs.core.nth.call(null, s, c__6276, null)
      }else {
        return and__3822__auto____6281
      }
    }else {
      return and__3822__auto____6280
    }
  }();
  var r__6284 = function() {
    var or__3824__auto____6283 = subpar.core.count_lines.call(null, s, o__6275, c__6276);
    if(cljs.core.truth_(or__3824__auto____6283)) {
      return or__3824__auto____6283
    }else {
      return 1
    }
  }();
  var num__6285 = cljs.core.truth_(endings__6279) ? cljs.core.count.call(null, endings__6279) : 0;
  if(num__6285 > 1) {
    return cljs.core.PersistentVector.fromArray([a__6282, c__6276, cljs.core.nth.call(null, endings__6279, num__6285 - 2) + 1, false, r__6284, o__6275], true)
  }else {
    if(cljs.core._EQ_.call(null, num__6285, 1)) {
      return cljs.core.PersistentVector.fromArray([a__6282, c__6276, o__6275 + 1, true, r__6284, o__6275], true)
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
  var p__6301 = subpar.core.parse.call(null, s);
  var vec__6300__6302 = subpar.core.get_wrapper.call(null, p__6301, i);
  var o__6303 = cljs.core.nth.call(null, vec__6300__6302, 0, null);
  var c__6304 = cljs.core.nth.call(null, vec__6300__6302, 1, null);
  var in_list__6305 = cljs.core.not_EQ_.call(null, -1, o__6303);
  var starts__6307 = function() {
    var and__3822__auto____6306 = in_list__6305;
    if(and__3822__auto____6306) {
      return subpar.core.get_siblings.call(null, i, cljs.core.keys, cljs.core.constantly.call(null, true), p__6301)
    }else {
      return and__3822__auto____6306
    }
  }();
  var a__6310 = function() {
    var and__3822__auto____6308 = o__6303;
    if(cljs.core.truth_(and__3822__auto____6308)) {
      var and__3822__auto____6309 = in_list__6305;
      if(and__3822__auto____6309) {
        return cljs.core.nth.call(null, s, o__6303, null)
      }else {
        return and__3822__auto____6309
      }
    }else {
      return and__3822__auto____6308
    }
  }();
  var r__6312 = function() {
    var or__3824__auto____6311 = subpar.core.count_lines.call(null, s, o__6303, c__6304);
    if(cljs.core.truth_(or__3824__auto____6311)) {
      return or__3824__auto____6311
    }else {
      return 1
    }
  }();
  var num__6313 = cljs.core.truth_(starts__6307) ? cljs.core.count.call(null, starts__6307) : 0;
  if(num__6313 > 1) {
    return cljs.core.PersistentVector.fromArray([a__6310, o__6303, cljs.core.second.call(null, starts__6307), false, r__6312], true)
  }else {
    if(cljs.core._EQ_.call(null, num__6313, 1)) {
      return cljs.core.PersistentVector.fromArray([a__6310, o__6303, c__6304, true, r__6312], true)
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
  var p__6326 = subpar.core.parse.call(null, s);
  var vec__6325__6327 = subpar.core.get_wrapper.call(null, p__6326, i);
  var o__6328 = cljs.core.nth.call(null, vec__6325__6327, 0, null);
  var c__6329 = cljs.core.nth.call(null, vec__6325__6327, 1, null);
  var in_list__6330 = cljs.core.not_EQ_.call(null, -1, o__6328);
  if(in_list__6330) {
    var vec__6331__6332 = subpar.core.get_wrapper.call(null, p__6326, o__6328);
    var n__6333 = cljs.core.nth.call(null, vec__6331__6332, 0, null);
    var d__6334 = cljs.core.nth.call(null, vec__6331__6332, 1, null);
    var r__6335 = subpar.core.count_lines.call(null, s, n__6333, d__6334);
    return[o__6328, c__6329, 0 > n__6333 ? 0 : n__6333, r__6335]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.splice_vals", subpar.core.splice_vals);
subpar.core.splice_killing_backward = function splice_killing_backward(s, i) {
  var p__6348 = subpar.core.parse.call(null, s);
  var vec__6347__6349 = subpar.core.get_wrapper.call(null, p__6348, i);
  var o__6350 = cljs.core.nth.call(null, vec__6347__6349, 0, null);
  var c__6351 = cljs.core.nth.call(null, vec__6347__6349, 1, null);
  var in_list__6352 = cljs.core.not_EQ_.call(null, -1, o__6350);
  if(in_list__6352) {
    var vec__6353__6354 = subpar.core.get_wrapper.call(null, p__6348, o__6350);
    var n__6355 = cljs.core.nth.call(null, vec__6353__6354, 0, null);
    var d__6356 = cljs.core.nth.call(null, vec__6353__6354, 1, null);
    var r__6357 = subpar.core.count_lines.call(null, s, n__6355, d__6356);
    return[o__6350, o__6350 > i ? o__6350 : i, c__6351, 0 > n__6355 ? 0 : n__6355, r__6357]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.splice_killing_backward", subpar.core.splice_killing_backward);
subpar.core.splice_killing_forward = function splice_killing_forward(s, i) {
  var p__6370 = subpar.core.parse.call(null, s);
  var vec__6369__6371 = subpar.core.get_wrapper.call(null, p__6370, i);
  var o__6372 = cljs.core.nth.call(null, vec__6369__6371, 0, null);
  var c__6373 = cljs.core.nth.call(null, vec__6369__6371, 1, null);
  var in_list__6374 = cljs.core.not_EQ_.call(null, -1, o__6372);
  if(in_list__6374) {
    var vec__6375__6376 = subpar.core.get_wrapper.call(null, p__6370, o__6372);
    var n__6377 = cljs.core.nth.call(null, vec__6375__6376, 0, null);
    var d__6378 = cljs.core.nth.call(null, vec__6375__6376, 1, null);
    var r__6379 = subpar.core.count_lines.call(null, s, n__6377, d__6378);
    return[o__6372, i, c__6373 + 1, 0 > n__6377 ? 0 : n__6377, r__6379]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.splice_killing_forward", subpar.core.splice_killing_forward);
subpar.core.parse = function parse(ss) {
  var s__6418 = [cljs.core.str(ss), cljs.core.str(" ")].join("");
  var i__6419 = 0;
  var mode__6420 = subpar.core.code;
  var openings__6421 = cljs.core.list.call(null, -1);
  var start__6422 = -1;
  var t__6423 = cljs.core.PersistentVector.EMPTY;
  var families__6424 = cljs.core.PersistentArrayMap.fromArrays([-1], [cljs.core.ObjMap.fromObject(["\ufdd0'children"], {"\ufdd0'children":cljs.core.ObjMap.EMPTY})]);
  var escaping__6425 = false;
  var in_word__6426 = false;
  while(true) {
    var a__6427 = cljs.core.nth.call(null, s__6418, i__6419, null);
    var j__6428 = i__6419 + 1;
    var o__6429 = cljs.core.peek.call(null, openings__6421);
    if(cljs.core.truth_(function() {
      var and__3822__auto____6430 = a__6427 == null;
      if(and__3822__auto____6430) {
        return in_word__6426
      }else {
        return and__3822__auto____6430
      }
    }())) {
      return cljs.core.ObjMap.fromObject(["\ufdd0'chars", "\ufdd0'families"], {"\ufdd0'chars":t__6423, "\ufdd0'families":cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([-1, "\ufdd0'closer"], true), i__6419 - 1), cljs.core.PersistentVector.fromArray([-1, "\ufdd0'children", start__6422], true), i__6419 - 1)})
    }else {
      if(a__6427 == null) {
        return cljs.core.ObjMap.fromObject(["\ufdd0'chars", "\ufdd0'families"], {"\ufdd0'chars":t__6423, "\ufdd0'families":cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([-1, "\ufdd0'closer"], true), i__6419 - 1)})
      }else {
        if(function() {
          var and__3822__auto____6431 = cljs.core.not_EQ_.call(null, subpar.core.cmmnt, mode__6420);
          if(and__3822__auto____6431) {
            var and__3822__auto____6432 = cljs.core._EQ_.call(null, "\\", a__6427);
            if(and__3822__auto____6432) {
              var and__3822__auto____6433 = cljs.core.not.call(null, escaping__6425);
              if(and__3822__auto____6433) {
                return cljs.core.not.call(null, in_word__6426)
              }else {
                return and__3822__auto____6433
              }
            }else {
              return and__3822__auto____6432
            }
          }else {
            return and__3822__auto____6431
          }
        }()) {
          var G__6456 = j__6428;
          var G__6457 = mode__6420;
          var G__6458 = openings__6421;
          var G__6459 = i__6419;
          var G__6460 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
          var G__6461 = cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'children", i__6419], true), j__6428);
          var G__6462 = true;
          var G__6463 = true;
          i__6419 = G__6456;
          mode__6420 = G__6457;
          openings__6421 = G__6458;
          start__6422 = G__6459;
          t__6423 = G__6460;
          families__6424 = G__6461;
          escaping__6425 = G__6462;
          in_word__6426 = G__6463;
          continue
        }else {
          if(function() {
            var and__3822__auto____6434 = cljs.core.not_EQ_.call(null, subpar.core.cmmnt, mode__6420);
            if(and__3822__auto____6434) {
              var and__3822__auto____6435 = cljs.core._EQ_.call(null, "\\", a__6427);
              if(and__3822__auto____6435) {
                return cljs.core.not.call(null, escaping__6425)
              }else {
                return and__3822__auto____6435
              }
            }else {
              return and__3822__auto____6434
            }
          }()) {
            var G__6464 = j__6428;
            var G__6465 = mode__6420;
            var G__6466 = openings__6421;
            var G__6467 = i__6419;
            var G__6468 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
            var G__6469 = families__6424;
            var G__6470 = true;
            var G__6471 = true;
            i__6419 = G__6464;
            mode__6420 = G__6465;
            openings__6421 = G__6466;
            start__6422 = G__6467;
            t__6423 = G__6468;
            families__6424 = G__6469;
            escaping__6425 = G__6470;
            in_word__6426 = G__6471;
            continue
          }else {
            if(function() {
              var and__3822__auto____6436 = cljs.core._EQ_.call(null, subpar.core.code, mode__6420);
              if(and__3822__auto____6436) {
                var and__3822__auto____6437 = cljs.core._EQ_.call(null, ";", a__6427);
                if(and__3822__auto____6437) {
                  return cljs.core.not.call(null, escaping__6425)
                }else {
                  return and__3822__auto____6437
                }
              }else {
                return and__3822__auto____6436
              }
            }()) {
              var G__6472 = j__6428;
              var G__6473 = subpar.core.cmmnt;
              var G__6474 = openings__6421;
              var G__6475 = start__6422;
              var G__6476 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
              var G__6477 = families__6424;
              var G__6478 = false;
              var G__6479 = false;
              i__6419 = G__6472;
              mode__6420 = G__6473;
              openings__6421 = G__6474;
              start__6422 = G__6475;
              t__6423 = G__6476;
              families__6424 = G__6477;
              escaping__6425 = G__6478;
              in_word__6426 = G__6479;
              continue
            }else {
              if(function() {
                var and__3822__auto____6438 = cljs.core._EQ_.call(null, subpar.core.cmmnt, mode__6420);
                if(and__3822__auto____6438) {
                  return cljs.core._EQ_.call(null, "\n", a__6427)
                }else {
                  return and__3822__auto____6438
                }
              }()) {
                var G__6480 = j__6428;
                var G__6481 = subpar.core.code;
                var G__6482 = openings__6421;
                var G__6483 = start__6422;
                var G__6484 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                var G__6485 = families__6424;
                var G__6486 = false;
                var G__6487 = false;
                i__6419 = G__6480;
                mode__6420 = G__6481;
                openings__6421 = G__6482;
                start__6422 = G__6483;
                t__6423 = G__6484;
                families__6424 = G__6485;
                escaping__6425 = G__6486;
                in_word__6426 = G__6487;
                continue
              }else {
                if(cljs.core._EQ_.call(null, subpar.core.cmmnt, mode__6420)) {
                  var G__6488 = j__6428;
                  var G__6489 = subpar.core.cmmnt;
                  var G__6490 = openings__6421;
                  var G__6491 = start__6422;
                  var G__6492 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                  var G__6493 = families__6424;
                  var G__6494 = false;
                  var G__6495 = false;
                  i__6419 = G__6488;
                  mode__6420 = G__6489;
                  openings__6421 = G__6490;
                  start__6422 = G__6491;
                  t__6423 = G__6492;
                  families__6424 = G__6493;
                  escaping__6425 = G__6494;
                  in_word__6426 = G__6495;
                  continue
                }else {
                  if(function() {
                    var and__3822__auto____6439 = cljs.core._EQ_.call(null, subpar.core.code, mode__6420);
                    if(and__3822__auto____6439) {
                      var and__3822__auto____6440 = cljs.core._EQ_.call(null, '"', a__6427);
                      if(and__3822__auto____6440) {
                        return cljs.core.not.call(null, escaping__6425)
                      }else {
                        return and__3822__auto____6440
                      }
                    }else {
                      return and__3822__auto____6439
                    }
                  }()) {
                    var G__6496 = j__6428;
                    var G__6497 = subpar.core.string;
                    var G__6498 = cljs.core.conj.call(null, openings__6421, i__6419);
                    var G__6499 = -1;
                    var G__6500 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                    var G__6501 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([i__6419, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY), cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'children", i__6419], true), j__6428);
                    var G__6502 = false;
                    var G__6503 = false;
                    i__6419 = G__6496;
                    mode__6420 = G__6497;
                    openings__6421 = G__6498;
                    start__6422 = G__6499;
                    t__6423 = G__6500;
                    families__6424 = G__6501;
                    escaping__6425 = G__6502;
                    in_word__6426 = G__6503;
                    continue
                  }else {
                    if(cljs.core.truth_(function() {
                      var and__3822__auto____6441 = cljs.core._EQ_.call(null, subpar.core.string, mode__6420);
                      if(and__3822__auto____6441) {
                        var and__3822__auto____6442 = cljs.core._EQ_.call(null, '"', a__6427);
                        if(and__3822__auto____6442) {
                          var and__3822__auto____6443 = cljs.core.not.call(null, escaping__6425);
                          if(and__3822__auto____6443) {
                            return in_word__6426
                          }else {
                            return and__3822__auto____6443
                          }
                        }else {
                          return and__3822__auto____6442
                        }
                      }else {
                        return and__3822__auto____6441
                      }
                    }())) {
                      var G__6504 = j__6428;
                      var G__6505 = subpar.core.code;
                      var G__6506 = cljs.core.pop.call(null, openings__6421);
                      var G__6507 = -1;
                      var G__6508 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                      var G__6509 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'closer"], true), i__6419), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__6421), "\ufdd0'children", o__6429], true), i__6419), cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'children", start__6422], true), i__6419 - 1);
                      var G__6510 = false;
                      var G__6511 = false;
                      i__6419 = G__6504;
                      mode__6420 = G__6505;
                      openings__6421 = G__6506;
                      start__6422 = G__6507;
                      t__6423 = G__6508;
                      families__6424 = G__6509;
                      escaping__6425 = G__6510;
                      in_word__6426 = G__6511;
                      continue
                    }else {
                      if(function() {
                        var and__3822__auto____6444 = cljs.core._EQ_.call(null, subpar.core.string, mode__6420);
                        if(and__3822__auto____6444) {
                          var and__3822__auto____6445 = cljs.core._EQ_.call(null, '"', a__6427);
                          if(and__3822__auto____6445) {
                            return cljs.core.not.call(null, escaping__6425)
                          }else {
                            return and__3822__auto____6445
                          }
                        }else {
                          return and__3822__auto____6444
                        }
                      }()) {
                        var G__6512 = j__6428;
                        var G__6513 = subpar.core.code;
                        var G__6514 = cljs.core.pop.call(null, openings__6421);
                        var G__6515 = -1;
                        var G__6516 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                        var G__6517 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'closer"], true), i__6419), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__6421), "\ufdd0'children", o__6429], true), i__6419);
                        var G__6518 = false;
                        var G__6519 = false;
                        i__6419 = G__6512;
                        mode__6420 = G__6513;
                        openings__6421 = G__6514;
                        start__6422 = G__6515;
                        t__6423 = G__6516;
                        families__6424 = G__6517;
                        escaping__6425 = G__6518;
                        in_word__6426 = G__6519;
                        continue
                      }else {
                        if(function() {
                          var and__3822__auto____6446 = cljs.core._EQ_.call(null, subpar.core.string, mode__6420);
                          if(and__3822__auto____6446) {
                            var and__3822__auto____6447 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__6427));
                            if(and__3822__auto____6447) {
                              return cljs.core.not.call(null, in_word__6426)
                            }else {
                              return and__3822__auto____6447
                            }
                          }else {
                            return and__3822__auto____6446
                          }
                        }()) {
                          var G__6520 = j__6428;
                          var G__6521 = subpar.core.string;
                          var G__6522 = openings__6421;
                          var G__6523 = i__6419;
                          var G__6524 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                          var G__6525 = cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'children", i__6419], true), i__6419);
                          var G__6526 = false;
                          var G__6527 = true;
                          i__6419 = G__6520;
                          mode__6420 = G__6521;
                          openings__6421 = G__6522;
                          start__6422 = G__6523;
                          t__6423 = G__6524;
                          families__6424 = G__6525;
                          escaping__6425 = G__6526;
                          in_word__6426 = G__6527;
                          continue
                        }else {
                          if(cljs.core.truth_(function() {
                            var and__3822__auto____6448 = cljs.core._EQ_.call(null, subpar.core.string, mode__6420);
                            if(and__3822__auto____6448) {
                              var and__3822__auto____6449 = subpar.core.whitespace_QMARK_.call(null, a__6427);
                              if(cljs.core.truth_(and__3822__auto____6449)) {
                                return in_word__6426
                              }else {
                                return and__3822__auto____6449
                              }
                            }else {
                              return and__3822__auto____6448
                            }
                          }())) {
                            var G__6528 = j__6428;
                            var G__6529 = subpar.core.string;
                            var G__6530 = openings__6421;
                            var G__6531 = -1;
                            var G__6532 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                            var G__6533 = cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'children", start__6422], true), i__6419 - 1);
                            var G__6534 = false;
                            var G__6535 = false;
                            i__6419 = G__6528;
                            mode__6420 = G__6529;
                            openings__6421 = G__6530;
                            start__6422 = G__6531;
                            t__6423 = G__6532;
                            families__6424 = G__6533;
                            escaping__6425 = G__6534;
                            in_word__6426 = G__6535;
                            continue
                          }else {
                            if(cljs.core._EQ_.call(null, subpar.core.string, mode__6420)) {
                              var G__6536 = j__6428;
                              var G__6537 = subpar.core.string;
                              var G__6538 = openings__6421;
                              var G__6539 = start__6422;
                              var G__6540 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                              var G__6541 = families__6424;
                              var G__6542 = false;
                              var G__6543 = in_word__6426;
                              i__6419 = G__6536;
                              mode__6420 = G__6537;
                              openings__6421 = G__6538;
                              start__6422 = G__6539;
                              t__6423 = G__6540;
                              families__6424 = G__6541;
                              escaping__6425 = G__6542;
                              in_word__6426 = G__6543;
                              continue
                            }else {
                              if(cljs.core.truth_(function() {
                                var and__3822__auto____6450 = subpar.core.opener_QMARK_.call(null, a__6427);
                                if(cljs.core.truth_(and__3822__auto____6450)) {
                                  return in_word__6426
                                }else {
                                  return and__3822__auto____6450
                                }
                              }())) {
                                var G__6544 = j__6428;
                                var G__6545 = subpar.core.code;
                                var G__6546 = cljs.core.conj.call(null, openings__6421, i__6419);
                                var G__6547 = -1;
                                var G__6548 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                                var G__6549 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'children", start__6422], true), i__6419 - 1), cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'children", i__6419], true), i__6419), cljs.core.PersistentVector.fromArray([i__6419, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY);
                                var G__6550 = false;
                                var G__6551 = false;
                                i__6419 = G__6544;
                                mode__6420 = G__6545;
                                openings__6421 = G__6546;
                                start__6422 = G__6547;
                                t__6423 = G__6548;
                                families__6424 = G__6549;
                                escaping__6425 = G__6550;
                                in_word__6426 = G__6551;
                                continue
                              }else {
                                if(cljs.core.truth_(subpar.core.opener_QMARK_.call(null, a__6427))) {
                                  var G__6552 = j__6428;
                                  var G__6553 = subpar.core.code;
                                  var G__6554 = cljs.core.conj.call(null, openings__6421, i__6419);
                                  var G__6555 = -1;
                                  var G__6556 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                                  var G__6557 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'children", i__6419], true), i__6419), cljs.core.PersistentVector.fromArray([i__6419, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY);
                                  var G__6558 = false;
                                  var G__6559 = false;
                                  i__6419 = G__6552;
                                  mode__6420 = G__6553;
                                  openings__6421 = G__6554;
                                  start__6422 = G__6555;
                                  t__6423 = G__6556;
                                  families__6424 = G__6557;
                                  escaping__6425 = G__6558;
                                  in_word__6426 = G__6559;
                                  continue
                                }else {
                                  if(cljs.core.truth_(function() {
                                    var and__3822__auto____6451 = subpar.core.closer_QMARK_.call(null, a__6427);
                                    if(cljs.core.truth_(and__3822__auto____6451)) {
                                      return in_word__6426
                                    }else {
                                      return and__3822__auto____6451
                                    }
                                  }())) {
                                    var G__6560 = j__6428;
                                    var G__6561 = subpar.core.code;
                                    var G__6562 = cljs.core.pop.call(null, openings__6421);
                                    var G__6563 = -1;
                                    var G__6564 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                                    var G__6565 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'children", start__6422], true), i__6419 - 1), cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'closer"], true), i__6419), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__6421), "\ufdd0'children", o__6429], true), i__6419);
                                    var G__6566 = false;
                                    var G__6567 = false;
                                    i__6419 = G__6560;
                                    mode__6420 = G__6561;
                                    openings__6421 = G__6562;
                                    start__6422 = G__6563;
                                    t__6423 = G__6564;
                                    families__6424 = G__6565;
                                    escaping__6425 = G__6566;
                                    in_word__6426 = G__6567;
                                    continue
                                  }else {
                                    if(cljs.core.truth_(subpar.core.closer_QMARK_.call(null, a__6427))) {
                                      var G__6568 = j__6428;
                                      var G__6569 = subpar.core.code;
                                      var G__6570 = cljs.core.pop.call(null, openings__6421);
                                      var G__6571 = -1;
                                      var G__6572 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                                      var G__6573 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'closer"], true), i__6419), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__6421), "\ufdd0'children", o__6429], true), i__6419);
                                      var G__6574 = false;
                                      var G__6575 = false;
                                      i__6419 = G__6568;
                                      mode__6420 = G__6569;
                                      openings__6421 = G__6570;
                                      start__6422 = G__6571;
                                      t__6423 = G__6572;
                                      families__6424 = G__6573;
                                      escaping__6425 = G__6574;
                                      in_word__6426 = G__6575;
                                      continue
                                    }else {
                                      if(function() {
                                        var and__3822__auto____6452 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__6427));
                                        if(and__3822__auto____6452) {
                                          return cljs.core.not.call(null, in_word__6426)
                                        }else {
                                          return and__3822__auto____6452
                                        }
                                      }()) {
                                        var G__6576 = j__6428;
                                        var G__6577 = subpar.core.code;
                                        var G__6578 = openings__6421;
                                        var G__6579 = i__6419;
                                        var G__6580 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                                        var G__6581 = cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'children", i__6419], true), i__6419);
                                        var G__6582 = false;
                                        var G__6583 = true;
                                        i__6419 = G__6576;
                                        mode__6420 = G__6577;
                                        openings__6421 = G__6578;
                                        start__6422 = G__6579;
                                        t__6423 = G__6580;
                                        families__6424 = G__6581;
                                        escaping__6425 = G__6582;
                                        in_word__6426 = G__6583;
                                        continue
                                      }else {
                                        if(cljs.core.truth_(function() {
                                          var and__3822__auto____6453 = subpar.core.whitespace_QMARK_.call(null, a__6427);
                                          if(cljs.core.truth_(and__3822__auto____6453)) {
                                            return in_word__6426
                                          }else {
                                            return and__3822__auto____6453
                                          }
                                        }())) {
                                          var G__6584 = j__6428;
                                          var G__6585 = subpar.core.code;
                                          var G__6586 = openings__6421;
                                          var G__6587 = -1;
                                          var G__6588 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                                          var G__6589 = cljs.core.assoc_in.call(null, families__6424, cljs.core.PersistentVector.fromArray([o__6429, "\ufdd0'children", start__6422], true), i__6419 - 1);
                                          var G__6590 = false;
                                          var G__6591 = false;
                                          i__6419 = G__6584;
                                          mode__6420 = G__6585;
                                          openings__6421 = G__6586;
                                          start__6422 = G__6587;
                                          t__6423 = G__6588;
                                          families__6424 = G__6589;
                                          escaping__6425 = G__6590;
                                          in_word__6426 = G__6591;
                                          continue
                                        }else {
                                          if(cljs.core.truth_(function() {
                                            var and__3822__auto____6454 = subpar.core.whitespace_QMARK_.call(null, a__6427);
                                            if(cljs.core.truth_(and__3822__auto____6454)) {
                                              return cljs.core.not.call(null, in_word__6426)
                                            }else {
                                              return and__3822__auto____6454
                                            }
                                          }())) {
                                            var G__6592 = j__6428;
                                            var G__6593 = subpar.core.code;
                                            var G__6594 = openings__6421;
                                            var G__6595 = -1;
                                            var G__6596 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                                            var G__6597 = families__6424;
                                            var G__6598 = false;
                                            var G__6599 = false;
                                            i__6419 = G__6592;
                                            mode__6420 = G__6593;
                                            openings__6421 = G__6594;
                                            start__6422 = G__6595;
                                            t__6423 = G__6596;
                                            families__6424 = G__6597;
                                            escaping__6425 = G__6598;
                                            in_word__6426 = G__6599;
                                            continue
                                          }else {
                                            if(cljs.core.truth_(function() {
                                              var and__3822__auto____6455 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__6427));
                                              if(and__3822__auto____6455) {
                                                return in_word__6426
                                              }else {
                                                return and__3822__auto____6455
                                              }
                                            }())) {
                                              var G__6600 = j__6428;
                                              var G__6601 = subpar.core.code;
                                              var G__6602 = openings__6421;
                                              var G__6603 = start__6422;
                                              var G__6604 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray([mode__6420, o__6429], true));
                                              var G__6605 = families__6424;
                                              var G__6606 = false;
                                              var G__6607 = true;
                                              i__6419 = G__6600;
                                              mode__6420 = G__6601;
                                              openings__6421 = G__6602;
                                              start__6422 = G__6603;
                                              t__6423 = G__6604;
                                              families__6424 = G__6605;
                                              escaping__6425 = G__6606;
                                              in_word__6426 = G__6607;
                                              continue
                                            }else {
                                              if("\ufdd0'default") {
                                                var G__6608 = j__6428;
                                                var G__6609 = subpar.core.code;
                                                var G__6610 = openings__6421;
                                                var G__6611 = start__6422;
                                                var G__6612 = cljs.core.conj.call(null, t__6423, cljs.core.PersistentVector.fromArray(["?", o__6429], true));
                                                var G__6613 = families__6424;
                                                var G__6614 = escaping__6425;
                                                var G__6615 = in_word__6426;
                                                i__6419 = G__6608;
                                                mode__6420 = G__6609;
                                                openings__6421 = G__6610;
                                                start__6422 = G__6611;
                                                t__6423 = G__6612;
                                                families__6424 = G__6613;
                                                escaping__6425 = G__6614;
                                                in_word__6426 = G__6615;
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
  var vec__6621__6622 = subpar.core.get_info.call(null, cm);
  var cur__6623 = cljs.core.nth.call(null, vec__6621__6622, 0, null);
  var i__6624 = cljs.core.nth.call(null, vec__6621__6622, 1, null);
  var s__6625 = cljs.core.nth.call(null, vec__6621__6622, 2, null);
  if(cljs.core.truth_(subpar.core.in_string.call(null, s__6625, i__6624))) {
    cm.replaceRange(cljs.core.nth.call(null, pair, 0), cur__6623);
    return cm.setCursor(cur__6623.line, cur__6623.ch + 1)
  }else {
    return cm.compoundChange(function() {
      cm.replaceRange(pair, cur__6623);
      cm.setCursor(cur__6623.line, cur__6623.ch + 1);
      return cm.indentLine(cur__6623.line)
    })
  }
};
goog.exportSymbol("subpar.core.open_expression", subpar.core.open_expression);
subpar.core.forward_delete = function forward_delete(cm) {
  if(cljs.core.truth_(subpar.core.nothing_selected_QMARK_.call(null, cm))) {
    var vec__6643__6644 = subpar.core.get_info.call(null, cm);
    var cur__6645 = cljs.core.nth.call(null, vec__6643__6644, 0, null);
    var i__6646 = cljs.core.nth.call(null, vec__6643__6644, 1, null);
    var s__6647 = cljs.core.nth.call(null, vec__6643__6644, 2, null);
    var act__6648 = subpar.core.forward_delete_action.call(null, s__6647, i__6646);
    var s1__6649 = cm.posFromIndex(i__6646);
    var e1__6650 = cm.posFromIndex(i__6646 + 1);
    var s2__6651 = cm.posFromIndex(i__6646 - 1);
    var e2__6652 = e1__6650;
    var s3__6653 = s1__6649;
    var e3__6654 = cm.posFromIndex(i__6646 + 2);
    var pred__6655__6658 = cljs.core._EQ_;
    var expr__6656__6659 = act__6648;
    if(pred__6655__6658.call(null, 1, expr__6656__6659)) {
      return cm.replaceRange("", s1__6649, e1__6650)
    }else {
      if(pred__6655__6658.call(null, 2, expr__6656__6659)) {
        return cm.replaceRange("", s2__6651, e2__6652)
      }else {
        if(pred__6655__6658.call(null, 3, expr__6656__6659)) {
          return cm.replaceRange("", s3__6653, e3__6654)
        }else {
          if(pred__6655__6658.call(null, 4, expr__6656__6659)) {
            return cm.setCursor(e1__6650)
          }else {
            throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__6656__6659)].join(""));
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
    var vec__6677__6678 = subpar.core.get_info.call(null, cm);
    var cur__6679 = cljs.core.nth.call(null, vec__6677__6678, 0, null);
    var i__6680 = cljs.core.nth.call(null, vec__6677__6678, 1, null);
    var s__6681 = cljs.core.nth.call(null, vec__6677__6678, 2, null);
    var act__6682 = subpar.core.backward_delete_action.call(null, s__6681, i__6680);
    var s1__6683 = cm.posFromIndex(i__6680 - 1);
    var e1__6684 = cm.posFromIndex(i__6680);
    var s2__6685 = s1__6683;
    var e2__6686 = cm.posFromIndex(i__6680 + 1);
    var s3__6687 = cm.posFromIndex(i__6680 - 2);
    var e3__6688 = e1__6684;
    var pred__6689__6692 = cljs.core._EQ_;
    var expr__6690__6693 = act__6682;
    if(pred__6689__6692.call(null, 1, expr__6690__6693)) {
      return cm.replaceRange("", s1__6683, e1__6684)
    }else {
      if(pred__6689__6692.call(null, 2, expr__6690__6693)) {
        return cm.replaceRange("", s2__6685, e2__6686)
      }else {
        if(pred__6689__6692.call(null, 3, expr__6690__6693)) {
          return cm.replaceRange("", s3__6687, e3__6688)
        }else {
          if(pred__6689__6692.call(null, 4, expr__6690__6693)) {
            return cm.setCursor(s1__6683)
          }else {
            throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__6690__6693)].join(""));
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
  var vec__6705__6706 = subpar.core.get_info.call(null, cm);
  var cur__6707 = cljs.core.nth.call(null, vec__6705__6706, 0, null);
  var i__6708 = cljs.core.nth.call(null, vec__6705__6706, 1, null);
  var s__6709 = cljs.core.nth.call(null, vec__6705__6706, 2, null);
  var act__6710 = subpar.core.double_quote_action.call(null, s__6709, i__6708);
  var pred__6711__6714 = cljs.core._EQ_;
  var expr__6712__6715 = act__6710;
  if(pred__6711__6714.call(null, 0, expr__6712__6715)) {
    return subpar.core.open_expression.call(null, cm, '""')
  }else {
    if(pred__6711__6714.call(null, 1, expr__6712__6715)) {
      return cm.replaceRange('\\"', cur__6707)
    }else {
      if(pred__6711__6714.call(null, 2, expr__6712__6715)) {
        return subpar.core.go_to_index.call(null, cm, i__6708, i__6708 + 1)
      }else {
        if(pred__6711__6714.call(null, 3, expr__6712__6715)) {
          return cm.replaceRange('"', cur__6707)
        }else {
          throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__6712__6715)].join(""));
        }
      }
    }
  }
};
goog.exportSymbol("subpar.core.double_quote", subpar.core.double_quote);
subpar.core.close_expression = function close_expression(cm, c) {
  var vec__6728__6729 = subpar.core.get_info.call(null, cm);
  var cur__6730 = cljs.core.nth.call(null, vec__6728__6729, 0, null);
  var i__6731 = cljs.core.nth.call(null, vec__6728__6729, 1, null);
  var s__6732 = cljs.core.nth.call(null, vec__6728__6729, 2, null);
  var p__6733 = subpar.core.parse.call(null, s__6732);
  if(cljs.core.truth_(subpar.core.in_string_QMARK_.call(null, p__6733, i__6731))) {
    cm.replaceRange(c, cur__6730);
    return cm.setCursor(cur__6730.line, cur__6730.ch + 1)
  }else {
    var vec__6734__6735 = subpar.core.close_expression_vals.call(null, p__6733, i__6731);
    var del__6736 = cljs.core.nth.call(null, vec__6734__6735, 0, null);
    var beg__6737 = cljs.core.nth.call(null, vec__6734__6735, 1, null);
    var end__6738 = cljs.core.nth.call(null, vec__6734__6735, 2, null);
    var dst__6739 = cljs.core.nth.call(null, vec__6734__6735, 3, null);
    if(cljs.core.truth_(dst__6739)) {
      if(cljs.core.truth_(del__6736)) {
        cm.replaceRange("", cm.posFromIndex(beg__6737), cm.posFromIndex(end__6738))
      }else {
      }
      return subpar.core.go_to_index.call(null, cm, i__6731, dst__6739)
    }else {
      return null
    }
  }
};
goog.exportSymbol("subpar.core.close_expression", subpar.core.close_expression);
subpar.core.go = function go(cm, f) {
  var vec__6746__6747 = subpar.core.get_info.call(null, cm);
  var cur__6748 = cljs.core.nth.call(null, vec__6746__6747, 0, null);
  var i__6749 = cljs.core.nth.call(null, vec__6746__6747, 1, null);
  var s__6750 = cljs.core.nth.call(null, vec__6746__6747, 2, null);
  var j__6751 = f.call(null, s__6750, i__6749);
  return subpar.core.go_to_index.call(null, cm, i__6749, j__6751)
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
  var vec__6770__6772 = subpar.core.get_info.call(null, cm);
  var cur__6773 = cljs.core.nth.call(null, vec__6770__6772, 0, null);
  var i__6774 = cljs.core.nth.call(null, vec__6770__6772, 1, null);
  var s__6775 = cljs.core.nth.call(null, vec__6770__6772, 2, null);
  var vec__6771__6776 = subpar.core.forward_slurp_vals.call(null, s__6775, i__6774);
  var delimiter__6777 = cljs.core.nth.call(null, vec__6771__6776, 0, null);
  var si__6778 = cljs.core.nth.call(null, vec__6771__6776, 1, null);
  var di__6779 = cljs.core.nth.call(null, vec__6771__6776, 2, null);
  var ri__6780 = cljs.core.nth.call(null, vec__6771__6776, 3, null);
  if(cljs.core.truth_(ri__6780)) {
    var start__6781 = cm.posFromIndex(si__6778);
    var end__6782 = cm.posFromIndex(si__6778 + 1);
    var destination__6783 = cm.posFromIndex(di__6779);
    var line__6784 = start__6781.line;
    var update__6785 = function() {
      cm.replaceRange(delimiter__6777, destination__6783);
      cm.replaceRange("", start__6781, end__6782);
      return cljs.core.map.call(null, function(p1__6752_SHARP_) {
        return cm.indentLine(p1__6752_SHARP_)
      }, cljs.core.range.call(null, line__6784, line__6784 + ri__6780))
    };
    return cm.compoundChange(update__6785)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.forward_slurp", subpar.core.forward_slurp);
subpar.core.backward_slurp = function backward_slurp(cm) {
  var vec__6803__6805 = subpar.core.get_info.call(null, cm);
  var cur__6806 = cljs.core.nth.call(null, vec__6803__6805, 0, null);
  var i__6807 = cljs.core.nth.call(null, vec__6803__6805, 1, null);
  var s__6808 = cljs.core.nth.call(null, vec__6803__6805, 2, null);
  var vec__6804__6809 = subpar.core.backward_slurp_vals.call(null, s__6808, i__6807);
  var delimiter__6810 = cljs.core.nth.call(null, vec__6804__6809, 0, null);
  var si__6811 = cljs.core.nth.call(null, vec__6804__6809, 1, null);
  var di__6812 = cljs.core.nth.call(null, vec__6804__6809, 2, null);
  var ri__6813 = cljs.core.nth.call(null, vec__6804__6809, 3, null);
  if(cljs.core.truth_(ri__6813)) {
    var start__6814 = cm.posFromIndex(si__6811);
    var end__6815 = cm.posFromIndex(si__6811 + 1);
    var destination__6816 = cm.posFromIndex(di__6812);
    var line__6817 = start__6814.line;
    var update__6818 = function() {
      cm.replaceRange("", start__6814, end__6815);
      cm.replaceRange(delimiter__6810, destination__6816);
      return cljs.core.map.call(null, function(p1__6753_SHARP_) {
        return cm.indentLine(p1__6753_SHARP_)
      }, cljs.core.range.call(null, line__6817, line__6817 + ri__6813))
    };
    return cm.compoundChange(update__6818)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.backward_slurp", subpar.core.backward_slurp);
subpar.core.backward_barf = function backward_barf(cm) {
  var vec__6838__6840 = subpar.core.get_info.call(null, cm);
  var cur__6841 = cljs.core.nth.call(null, vec__6838__6840, 0, null);
  var i__6842 = cljs.core.nth.call(null, vec__6838__6840, 1, null);
  var s__6843 = cljs.core.nth.call(null, vec__6838__6840, 2, null);
  var vec__6839__6844 = subpar.core.backward_barf_vals.call(null, s__6843, i__6842);
  var delimiter__6845 = cljs.core.nth.call(null, vec__6839__6844, 0, null);
  var si__6846 = cljs.core.nth.call(null, vec__6839__6844, 1, null);
  var di__6847 = cljs.core.nth.call(null, vec__6839__6844, 2, null);
  var pad__6848 = cljs.core.nth.call(null, vec__6839__6844, 3, null);
  var ri__6849 = cljs.core.nth.call(null, vec__6839__6844, 4, null);
  if(cljs.core.truth_(ri__6849)) {
    var delimiter__6850 = cljs.core.truth_(pad__6848) ? [cljs.core.str(" "), cljs.core.str(delimiter__6845)].join("") : delimiter__6845;
    var destination__6851 = cm.posFromIndex(di__6847);
    var start__6852 = cm.posFromIndex(si__6846);
    var end__6853 = cm.posFromIndex(si__6846 + 1);
    var line__6854 = start__6852.line;
    var update__6855 = function() {
      cm.replaceRange(delimiter__6850, destination__6851);
      cm.replaceRange("", start__6852, end__6853);
      return cljs.core.map.call(null, function(p1__6786_SHARP_) {
        return cm.indentLine(p1__6786_SHARP_)
      }, cljs.core.range.call(null, line__6854, line__6854 + ri__6849))
    };
    return cm.compoundChange(update__6855)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.backward_barf", subpar.core.backward_barf);
subpar.core.forward_barf = function forward_barf(cm) {
  var vec__6876__6878 = subpar.core.get_info.call(null, cm);
  var cur__6879 = cljs.core.nth.call(null, vec__6876__6878, 0, null);
  var i__6880 = cljs.core.nth.call(null, vec__6876__6878, 1, null);
  var s__6881 = cljs.core.nth.call(null, vec__6876__6878, 2, null);
  var vec__6877__6882 = subpar.core.forward_barf_vals.call(null, s__6881, i__6880);
  var delimiter__6883 = cljs.core.nth.call(null, vec__6877__6882, 0, null);
  var si__6884 = cljs.core.nth.call(null, vec__6877__6882, 1, null);
  var di__6885 = cljs.core.nth.call(null, vec__6877__6882, 2, null);
  var pad__6886 = cljs.core.nth.call(null, vec__6877__6882, 3, null);
  var ri__6887 = cljs.core.nth.call(null, vec__6877__6882, 4, null);
  var i0__6888 = cljs.core.nth.call(null, vec__6877__6882, 5, null);
  if(cljs.core.truth_(ri__6887)) {
    var delimiter__6889 = cljs.core.truth_(pad__6886) ? [cljs.core.str(" "), cljs.core.str(delimiter__6883)].join("") : delimiter__6883;
    var destination__6890 = cm.posFromIndex(di__6885);
    var start__6891 = cm.posFromIndex(si__6884);
    var end__6892 = cm.posFromIndex(si__6884 + 1);
    var line__6893 = cm.posFromIndex(i0__6888).line;
    var update__6894 = function() {
      cm.replaceRange("", start__6891, end__6892);
      cm.replaceRange(delimiter__6889, destination__6890);
      return cljs.core.map.call(null, function(p1__6819_SHARP_) {
        return cm.indentLine(p1__6819_SHARP_)
      }, cljs.core.range.call(null, line__6893, line__6893 + ri__6887))
    };
    return cm.compoundChange(update__6894)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.forward_barf", subpar.core.forward_barf);
subpar.core.splice_delete_backward = function splice_delete_backward(cm) {
  var vec__6914__6916 = subpar.core.get_info.call(null, cm);
  var cur__6917 = cljs.core.nth.call(null, vec__6914__6916, 0, null);
  var i__6918 = cljs.core.nth.call(null, vec__6914__6916, 1, null);
  var s__6919 = cljs.core.nth.call(null, vec__6914__6916, 2, null);
  var vec__6915__6920 = subpar.core.splice_killing_backward.call(null, s__6919, i__6918);
  var start__6921 = cljs.core.nth.call(null, vec__6915__6920, 0, null);
  var end__6922 = cljs.core.nth.call(null, vec__6915__6920, 1, null);
  var closer__6923 = cljs.core.nth.call(null, vec__6915__6920, 2, null);
  var reindent__6924 = cljs.core.nth.call(null, vec__6915__6920, 3, null);
  var num__6925 = cljs.core.nth.call(null, vec__6915__6920, 4, null);
  if(cljs.core.truth_(reindent__6924)) {
    var line__6926 = cm.posFromIndex(reindent__6924).line;
    var c0__6927 = cm.posFromIndex(closer__6923);
    var c1__6928 = cm.posFromIndex(closer__6923 + 1);
    var s0__6929 = cm.posFromIndex(start__6921);
    var s1__6930 = cm.posFromIndex(end__6922);
    var update__6931 = function() {
      cm.replaceRange("", c0__6927, c1__6928);
      cm.replaceRange("", s0__6929, s1__6930);
      return cljs.core.map.call(null, function(p1__6856_SHARP_) {
        return cm.indentLine(p1__6856_SHARP_)
      }, cljs.core.range.call(null, line__6926, line__6926 + num__6925))
    };
    return cm.compoundChange(update__6931)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.splice_delete_backward", subpar.core.splice_delete_backward);
subpar.core.splice_delete_forward = function splice_delete_forward(cm) {
  var vec__6951__6953 = subpar.core.get_info.call(null, cm);
  var cur__6954 = cljs.core.nth.call(null, vec__6951__6953, 0, null);
  var i__6955 = cljs.core.nth.call(null, vec__6951__6953, 1, null);
  var s__6956 = cljs.core.nth.call(null, vec__6951__6953, 2, null);
  var vec__6952__6957 = subpar.core.splice_killing_forward.call(null, s__6956, i__6955);
  var opener__6958 = cljs.core.nth.call(null, vec__6952__6957, 0, null);
  var start__6959 = cljs.core.nth.call(null, vec__6952__6957, 1, null);
  var end__6960 = cljs.core.nth.call(null, vec__6952__6957, 2, null);
  var reindent__6961 = cljs.core.nth.call(null, vec__6952__6957, 3, null);
  var num__6962 = cljs.core.nth.call(null, vec__6952__6957, 4, null);
  if(cljs.core.truth_(reindent__6961)) {
    var line__6963 = cm.posFromIndex(reindent__6961).line;
    var o0__6964 = cm.posFromIndex(opener__6958);
    var o1__6965 = cm.posFromIndex(opener__6958 + 1);
    var s0__6966 = cm.posFromIndex(start__6959);
    var s1__6967 = cm.posFromIndex(end__6960);
    var update__6968 = function() {
      cm.replaceRange("", s0__6966, s1__6967);
      cm.replaceRange("", o0__6964, o1__6965);
      return cljs.core.map.call(null, function(p1__6895_SHARP_) {
        return cm.indentLine(p1__6895_SHARP_)
      }, cljs.core.range.call(null, line__6963, line__6963 + num__6962))
    };
    return cm.compoundChange(update__6968)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.splice_delete_forward", subpar.core.splice_delete_forward);
subpar.core.splice = function splice(cm) {
  var vec__6987__6989 = subpar.core.get_info.call(null, cm);
  var cur__6990 = cljs.core.nth.call(null, vec__6987__6989, 0, null);
  var i__6991 = cljs.core.nth.call(null, vec__6987__6989, 1, null);
  var s__6992 = cljs.core.nth.call(null, vec__6987__6989, 2, null);
  var vec__6988__6993 = subpar.core.splice_vals.call(null, s__6992, i__6991);
  var opener__6994 = cljs.core.nth.call(null, vec__6988__6993, 0, null);
  var closer__6995 = cljs.core.nth.call(null, vec__6988__6993, 1, null);
  var reindent__6996 = cljs.core.nth.call(null, vec__6988__6993, 2, null);
  var num__6997 = cljs.core.nth.call(null, vec__6988__6993, 3, null);
  if(cljs.core.truth_(reindent__6996)) {
    var line__6998 = cm.posFromIndex(reindent__6996).line;
    var o0__6999 = cm.posFromIndex(opener__6994);
    var o1__7000 = cm.posFromIndex(opener__6994 + 1);
    var c0__7001 = cm.posFromIndex(closer__6995);
    var c1__7002 = cm.posFromIndex(closer__6995 + 1);
    var update__7003 = function() {
      cm.replaceRange("", c0__7001, c1__7002);
      cm.replaceRange("", o0__6999, o1__7000);
      return cljs.core.map.call(null, function(p1__6932_SHARP_) {
        return cm.indentLine(p1__6932_SHARP_)
      }, cljs.core.range.call(null, line__6998, line__6998 + num__6997))
    };
    return cm.compoundChange(update__7003)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.splice", subpar.core.splice);
subpar.core.indent_selection = function indent_selection(cm) {
  if(cljs.core.truth_(cm.somethingSelected())) {
    var start__7007 = cm.getCursor(true).line;
    var end__7008 = cm.getCursor(false).line;
    var f__7009 = function() {
      return cljs.core.map.call(null, function(p1__6969_SHARP_) {
        return cm.indentLine(p1__6969_SHARP_)
      }, cljs.core.range.call(null, start__7007, end__7008 + 1))
    };
    return cm.compoundChange(f__7009)
  }else {
    return cm.indentLine(cm.getCursor().line)
  }
};
goog.exportSymbol("subpar.core.indent_selection", subpar.core.indent_selection);
