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
  var x__20046 = x == null ? null : x;
  if(p[goog.typeOf(x__20046)]) {
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
    var G__20047__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__20047 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__20047__delegate.call(this, array, i, idxs)
    };
    G__20047.cljs$lang$maxFixedArity = 2;
    G__20047.cljs$lang$applyTo = function(arglist__20048) {
      var array = cljs.core.first(arglist__20048);
      var i = cljs.core.first(cljs.core.next(arglist__20048));
      var idxs = cljs.core.rest(cljs.core.next(arglist__20048));
      return G__20047__delegate(array, i, idxs)
    };
    G__20047.cljs$lang$arity$variadic = G__20047__delegate;
    return G__20047
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
      var and__3822__auto____20133 = this$;
      if(and__3822__auto____20133) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____20133
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____20134 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20135 = cljs.core._invoke[goog.typeOf(x__2363__auto____20134)];
        if(or__3824__auto____20135) {
          return or__3824__auto____20135
        }else {
          var or__3824__auto____20136 = cljs.core._invoke["_"];
          if(or__3824__auto____20136) {
            return or__3824__auto____20136
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____20137 = this$;
      if(and__3822__auto____20137) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____20137
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____20138 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20139 = cljs.core._invoke[goog.typeOf(x__2363__auto____20138)];
        if(or__3824__auto____20139) {
          return or__3824__auto____20139
        }else {
          var or__3824__auto____20140 = cljs.core._invoke["_"];
          if(or__3824__auto____20140) {
            return or__3824__auto____20140
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____20141 = this$;
      if(and__3822__auto____20141) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____20141
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____20142 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20143 = cljs.core._invoke[goog.typeOf(x__2363__auto____20142)];
        if(or__3824__auto____20143) {
          return or__3824__auto____20143
        }else {
          var or__3824__auto____20144 = cljs.core._invoke["_"];
          if(or__3824__auto____20144) {
            return or__3824__auto____20144
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____20145 = this$;
      if(and__3822__auto____20145) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____20145
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____20146 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20147 = cljs.core._invoke[goog.typeOf(x__2363__auto____20146)];
        if(or__3824__auto____20147) {
          return or__3824__auto____20147
        }else {
          var or__3824__auto____20148 = cljs.core._invoke["_"];
          if(or__3824__auto____20148) {
            return or__3824__auto____20148
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____20149 = this$;
      if(and__3822__auto____20149) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____20149
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____20150 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20151 = cljs.core._invoke[goog.typeOf(x__2363__auto____20150)];
        if(or__3824__auto____20151) {
          return or__3824__auto____20151
        }else {
          var or__3824__auto____20152 = cljs.core._invoke["_"];
          if(or__3824__auto____20152) {
            return or__3824__auto____20152
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____20153 = this$;
      if(and__3822__auto____20153) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____20153
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____20154 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20155 = cljs.core._invoke[goog.typeOf(x__2363__auto____20154)];
        if(or__3824__auto____20155) {
          return or__3824__auto____20155
        }else {
          var or__3824__auto____20156 = cljs.core._invoke["_"];
          if(or__3824__auto____20156) {
            return or__3824__auto____20156
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____20157 = this$;
      if(and__3822__auto____20157) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____20157
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____20158 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20159 = cljs.core._invoke[goog.typeOf(x__2363__auto____20158)];
        if(or__3824__auto____20159) {
          return or__3824__auto____20159
        }else {
          var or__3824__auto____20160 = cljs.core._invoke["_"];
          if(or__3824__auto____20160) {
            return or__3824__auto____20160
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____20161 = this$;
      if(and__3822__auto____20161) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____20161
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____20162 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20163 = cljs.core._invoke[goog.typeOf(x__2363__auto____20162)];
        if(or__3824__auto____20163) {
          return or__3824__auto____20163
        }else {
          var or__3824__auto____20164 = cljs.core._invoke["_"];
          if(or__3824__auto____20164) {
            return or__3824__auto____20164
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____20165 = this$;
      if(and__3822__auto____20165) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____20165
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____20166 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20167 = cljs.core._invoke[goog.typeOf(x__2363__auto____20166)];
        if(or__3824__auto____20167) {
          return or__3824__auto____20167
        }else {
          var or__3824__auto____20168 = cljs.core._invoke["_"];
          if(or__3824__auto____20168) {
            return or__3824__auto____20168
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____20169 = this$;
      if(and__3822__auto____20169) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____20169
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____20170 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20171 = cljs.core._invoke[goog.typeOf(x__2363__auto____20170)];
        if(or__3824__auto____20171) {
          return or__3824__auto____20171
        }else {
          var or__3824__auto____20172 = cljs.core._invoke["_"];
          if(or__3824__auto____20172) {
            return or__3824__auto____20172
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____20173 = this$;
      if(and__3822__auto____20173) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____20173
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____20174 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20175 = cljs.core._invoke[goog.typeOf(x__2363__auto____20174)];
        if(or__3824__auto____20175) {
          return or__3824__auto____20175
        }else {
          var or__3824__auto____20176 = cljs.core._invoke["_"];
          if(or__3824__auto____20176) {
            return or__3824__auto____20176
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____20177 = this$;
      if(and__3822__auto____20177) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____20177
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____20178 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20179 = cljs.core._invoke[goog.typeOf(x__2363__auto____20178)];
        if(or__3824__auto____20179) {
          return or__3824__auto____20179
        }else {
          var or__3824__auto____20180 = cljs.core._invoke["_"];
          if(or__3824__auto____20180) {
            return or__3824__auto____20180
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____20181 = this$;
      if(and__3822__auto____20181) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____20181
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____20182 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20183 = cljs.core._invoke[goog.typeOf(x__2363__auto____20182)];
        if(or__3824__auto____20183) {
          return or__3824__auto____20183
        }else {
          var or__3824__auto____20184 = cljs.core._invoke["_"];
          if(or__3824__auto____20184) {
            return or__3824__auto____20184
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____20185 = this$;
      if(and__3822__auto____20185) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____20185
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____20186 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20187 = cljs.core._invoke[goog.typeOf(x__2363__auto____20186)];
        if(or__3824__auto____20187) {
          return or__3824__auto____20187
        }else {
          var or__3824__auto____20188 = cljs.core._invoke["_"];
          if(or__3824__auto____20188) {
            return or__3824__auto____20188
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____20189 = this$;
      if(and__3822__auto____20189) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____20189
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____20190 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20191 = cljs.core._invoke[goog.typeOf(x__2363__auto____20190)];
        if(or__3824__auto____20191) {
          return or__3824__auto____20191
        }else {
          var or__3824__auto____20192 = cljs.core._invoke["_"];
          if(or__3824__auto____20192) {
            return or__3824__auto____20192
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____20193 = this$;
      if(and__3822__auto____20193) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____20193
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____20194 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20195 = cljs.core._invoke[goog.typeOf(x__2363__auto____20194)];
        if(or__3824__auto____20195) {
          return or__3824__auto____20195
        }else {
          var or__3824__auto____20196 = cljs.core._invoke["_"];
          if(or__3824__auto____20196) {
            return or__3824__auto____20196
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____20197 = this$;
      if(and__3822__auto____20197) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____20197
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____20198 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20199 = cljs.core._invoke[goog.typeOf(x__2363__auto____20198)];
        if(or__3824__auto____20199) {
          return or__3824__auto____20199
        }else {
          var or__3824__auto____20200 = cljs.core._invoke["_"];
          if(or__3824__auto____20200) {
            return or__3824__auto____20200
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____20201 = this$;
      if(and__3822__auto____20201) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____20201
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____20202 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20203 = cljs.core._invoke[goog.typeOf(x__2363__auto____20202)];
        if(or__3824__auto____20203) {
          return or__3824__auto____20203
        }else {
          var or__3824__auto____20204 = cljs.core._invoke["_"];
          if(or__3824__auto____20204) {
            return or__3824__auto____20204
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____20205 = this$;
      if(and__3822__auto____20205) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____20205
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____20206 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20207 = cljs.core._invoke[goog.typeOf(x__2363__auto____20206)];
        if(or__3824__auto____20207) {
          return or__3824__auto____20207
        }else {
          var or__3824__auto____20208 = cljs.core._invoke["_"];
          if(or__3824__auto____20208) {
            return or__3824__auto____20208
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____20209 = this$;
      if(and__3822__auto____20209) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____20209
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____20210 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20211 = cljs.core._invoke[goog.typeOf(x__2363__auto____20210)];
        if(or__3824__auto____20211) {
          return or__3824__auto____20211
        }else {
          var or__3824__auto____20212 = cljs.core._invoke["_"];
          if(or__3824__auto____20212) {
            return or__3824__auto____20212
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____20213 = this$;
      if(and__3822__auto____20213) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____20213
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____20214 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____20215 = cljs.core._invoke[goog.typeOf(x__2363__auto____20214)];
        if(or__3824__auto____20215) {
          return or__3824__auto____20215
        }else {
          var or__3824__auto____20216 = cljs.core._invoke["_"];
          if(or__3824__auto____20216) {
            return or__3824__auto____20216
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
    var and__3822__auto____20221 = coll;
    if(and__3822__auto____20221) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____20221
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____20222 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20223 = cljs.core._count[goog.typeOf(x__2363__auto____20222)];
      if(or__3824__auto____20223) {
        return or__3824__auto____20223
      }else {
        var or__3824__auto____20224 = cljs.core._count["_"];
        if(or__3824__auto____20224) {
          return or__3824__auto____20224
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
    var and__3822__auto____20229 = coll;
    if(and__3822__auto____20229) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____20229
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____20230 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20231 = cljs.core._empty[goog.typeOf(x__2363__auto____20230)];
      if(or__3824__auto____20231) {
        return or__3824__auto____20231
      }else {
        var or__3824__auto____20232 = cljs.core._empty["_"];
        if(or__3824__auto____20232) {
          return or__3824__auto____20232
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
    var and__3822__auto____20237 = coll;
    if(and__3822__auto____20237) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____20237
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____20238 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20239 = cljs.core._conj[goog.typeOf(x__2363__auto____20238)];
      if(or__3824__auto____20239) {
        return or__3824__auto____20239
      }else {
        var or__3824__auto____20240 = cljs.core._conj["_"];
        if(or__3824__auto____20240) {
          return or__3824__auto____20240
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
      var and__3822__auto____20249 = coll;
      if(and__3822__auto____20249) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____20249
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____20250 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____20251 = cljs.core._nth[goog.typeOf(x__2363__auto____20250)];
        if(or__3824__auto____20251) {
          return or__3824__auto____20251
        }else {
          var or__3824__auto____20252 = cljs.core._nth["_"];
          if(or__3824__auto____20252) {
            return or__3824__auto____20252
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____20253 = coll;
      if(and__3822__auto____20253) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____20253
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____20254 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____20255 = cljs.core._nth[goog.typeOf(x__2363__auto____20254)];
        if(or__3824__auto____20255) {
          return or__3824__auto____20255
        }else {
          var or__3824__auto____20256 = cljs.core._nth["_"];
          if(or__3824__auto____20256) {
            return or__3824__auto____20256
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
    var and__3822__auto____20261 = coll;
    if(and__3822__auto____20261) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____20261
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____20262 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20263 = cljs.core._first[goog.typeOf(x__2363__auto____20262)];
      if(or__3824__auto____20263) {
        return or__3824__auto____20263
      }else {
        var or__3824__auto____20264 = cljs.core._first["_"];
        if(or__3824__auto____20264) {
          return or__3824__auto____20264
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____20269 = coll;
    if(and__3822__auto____20269) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____20269
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____20270 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20271 = cljs.core._rest[goog.typeOf(x__2363__auto____20270)];
      if(or__3824__auto____20271) {
        return or__3824__auto____20271
      }else {
        var or__3824__auto____20272 = cljs.core._rest["_"];
        if(or__3824__auto____20272) {
          return or__3824__auto____20272
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
    var and__3822__auto____20277 = coll;
    if(and__3822__auto____20277) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____20277
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____20278 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20279 = cljs.core._next[goog.typeOf(x__2363__auto____20278)];
      if(or__3824__auto____20279) {
        return or__3824__auto____20279
      }else {
        var or__3824__auto____20280 = cljs.core._next["_"];
        if(or__3824__auto____20280) {
          return or__3824__auto____20280
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
      var and__3822__auto____20289 = o;
      if(and__3822__auto____20289) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____20289
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____20290 = o == null ? null : o;
      return function() {
        var or__3824__auto____20291 = cljs.core._lookup[goog.typeOf(x__2363__auto____20290)];
        if(or__3824__auto____20291) {
          return or__3824__auto____20291
        }else {
          var or__3824__auto____20292 = cljs.core._lookup["_"];
          if(or__3824__auto____20292) {
            return or__3824__auto____20292
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____20293 = o;
      if(and__3822__auto____20293) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____20293
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____20294 = o == null ? null : o;
      return function() {
        var or__3824__auto____20295 = cljs.core._lookup[goog.typeOf(x__2363__auto____20294)];
        if(or__3824__auto____20295) {
          return or__3824__auto____20295
        }else {
          var or__3824__auto____20296 = cljs.core._lookup["_"];
          if(or__3824__auto____20296) {
            return or__3824__auto____20296
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
    var and__3822__auto____20301 = coll;
    if(and__3822__auto____20301) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____20301
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____20302 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20303 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____20302)];
      if(or__3824__auto____20303) {
        return or__3824__auto____20303
      }else {
        var or__3824__auto____20304 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____20304) {
          return or__3824__auto____20304
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____20309 = coll;
    if(and__3822__auto____20309) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____20309
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____20310 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20311 = cljs.core._assoc[goog.typeOf(x__2363__auto____20310)];
      if(or__3824__auto____20311) {
        return or__3824__auto____20311
      }else {
        var or__3824__auto____20312 = cljs.core._assoc["_"];
        if(or__3824__auto____20312) {
          return or__3824__auto____20312
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
    var and__3822__auto____20317 = coll;
    if(and__3822__auto____20317) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____20317
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____20318 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20319 = cljs.core._dissoc[goog.typeOf(x__2363__auto____20318)];
      if(or__3824__auto____20319) {
        return or__3824__auto____20319
      }else {
        var or__3824__auto____20320 = cljs.core._dissoc["_"];
        if(or__3824__auto____20320) {
          return or__3824__auto____20320
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
    var and__3822__auto____20325 = coll;
    if(and__3822__auto____20325) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____20325
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____20326 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20327 = cljs.core._key[goog.typeOf(x__2363__auto____20326)];
      if(or__3824__auto____20327) {
        return or__3824__auto____20327
      }else {
        var or__3824__auto____20328 = cljs.core._key["_"];
        if(or__3824__auto____20328) {
          return or__3824__auto____20328
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____20333 = coll;
    if(and__3822__auto____20333) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____20333
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____20334 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20335 = cljs.core._val[goog.typeOf(x__2363__auto____20334)];
      if(or__3824__auto____20335) {
        return or__3824__auto____20335
      }else {
        var or__3824__auto____20336 = cljs.core._val["_"];
        if(or__3824__auto____20336) {
          return or__3824__auto____20336
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
    var and__3822__auto____20341 = coll;
    if(and__3822__auto____20341) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____20341
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____20342 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20343 = cljs.core._disjoin[goog.typeOf(x__2363__auto____20342)];
      if(or__3824__auto____20343) {
        return or__3824__auto____20343
      }else {
        var or__3824__auto____20344 = cljs.core._disjoin["_"];
        if(or__3824__auto____20344) {
          return or__3824__auto____20344
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
    var and__3822__auto____20349 = coll;
    if(and__3822__auto____20349) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____20349
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____20350 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20351 = cljs.core._peek[goog.typeOf(x__2363__auto____20350)];
      if(or__3824__auto____20351) {
        return or__3824__auto____20351
      }else {
        var or__3824__auto____20352 = cljs.core._peek["_"];
        if(or__3824__auto____20352) {
          return or__3824__auto____20352
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____20357 = coll;
    if(and__3822__auto____20357) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____20357
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____20358 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20359 = cljs.core._pop[goog.typeOf(x__2363__auto____20358)];
      if(or__3824__auto____20359) {
        return or__3824__auto____20359
      }else {
        var or__3824__auto____20360 = cljs.core._pop["_"];
        if(or__3824__auto____20360) {
          return or__3824__auto____20360
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
    var and__3822__auto____20365 = coll;
    if(and__3822__auto____20365) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____20365
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____20366 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20367 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____20366)];
      if(or__3824__auto____20367) {
        return or__3824__auto____20367
      }else {
        var or__3824__auto____20368 = cljs.core._assoc_n["_"];
        if(or__3824__auto____20368) {
          return or__3824__auto____20368
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
    var and__3822__auto____20373 = o;
    if(and__3822__auto____20373) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____20373
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____20374 = o == null ? null : o;
    return function() {
      var or__3824__auto____20375 = cljs.core._deref[goog.typeOf(x__2363__auto____20374)];
      if(or__3824__auto____20375) {
        return or__3824__auto____20375
      }else {
        var or__3824__auto____20376 = cljs.core._deref["_"];
        if(or__3824__auto____20376) {
          return or__3824__auto____20376
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
    var and__3822__auto____20381 = o;
    if(and__3822__auto____20381) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____20381
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____20382 = o == null ? null : o;
    return function() {
      var or__3824__auto____20383 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____20382)];
      if(or__3824__auto____20383) {
        return or__3824__auto____20383
      }else {
        var or__3824__auto____20384 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____20384) {
          return or__3824__auto____20384
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
    var and__3822__auto____20389 = o;
    if(and__3822__auto____20389) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____20389
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____20390 = o == null ? null : o;
    return function() {
      var or__3824__auto____20391 = cljs.core._meta[goog.typeOf(x__2363__auto____20390)];
      if(or__3824__auto____20391) {
        return or__3824__auto____20391
      }else {
        var or__3824__auto____20392 = cljs.core._meta["_"];
        if(or__3824__auto____20392) {
          return or__3824__auto____20392
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
    var and__3822__auto____20397 = o;
    if(and__3822__auto____20397) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____20397
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____20398 = o == null ? null : o;
    return function() {
      var or__3824__auto____20399 = cljs.core._with_meta[goog.typeOf(x__2363__auto____20398)];
      if(or__3824__auto____20399) {
        return or__3824__auto____20399
      }else {
        var or__3824__auto____20400 = cljs.core._with_meta["_"];
        if(or__3824__auto____20400) {
          return or__3824__auto____20400
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
      var and__3822__auto____20409 = coll;
      if(and__3822__auto____20409) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____20409
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____20410 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____20411 = cljs.core._reduce[goog.typeOf(x__2363__auto____20410)];
        if(or__3824__auto____20411) {
          return or__3824__auto____20411
        }else {
          var or__3824__auto____20412 = cljs.core._reduce["_"];
          if(or__3824__auto____20412) {
            return or__3824__auto____20412
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____20413 = coll;
      if(and__3822__auto____20413) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____20413
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____20414 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____20415 = cljs.core._reduce[goog.typeOf(x__2363__auto____20414)];
        if(or__3824__auto____20415) {
          return or__3824__auto____20415
        }else {
          var or__3824__auto____20416 = cljs.core._reduce["_"];
          if(or__3824__auto____20416) {
            return or__3824__auto____20416
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
    var and__3822__auto____20421 = coll;
    if(and__3822__auto____20421) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____20421
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____20422 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20423 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____20422)];
      if(or__3824__auto____20423) {
        return or__3824__auto____20423
      }else {
        var or__3824__auto____20424 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____20424) {
          return or__3824__auto____20424
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
    var and__3822__auto____20429 = o;
    if(and__3822__auto____20429) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____20429
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____20430 = o == null ? null : o;
    return function() {
      var or__3824__auto____20431 = cljs.core._equiv[goog.typeOf(x__2363__auto____20430)];
      if(or__3824__auto____20431) {
        return or__3824__auto____20431
      }else {
        var or__3824__auto____20432 = cljs.core._equiv["_"];
        if(or__3824__auto____20432) {
          return or__3824__auto____20432
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
    var and__3822__auto____20437 = o;
    if(and__3822__auto____20437) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____20437
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____20438 = o == null ? null : o;
    return function() {
      var or__3824__auto____20439 = cljs.core._hash[goog.typeOf(x__2363__auto____20438)];
      if(or__3824__auto____20439) {
        return or__3824__auto____20439
      }else {
        var or__3824__auto____20440 = cljs.core._hash["_"];
        if(or__3824__auto____20440) {
          return or__3824__auto____20440
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
    var and__3822__auto____20445 = o;
    if(and__3822__auto____20445) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____20445
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____20446 = o == null ? null : o;
    return function() {
      var or__3824__auto____20447 = cljs.core._seq[goog.typeOf(x__2363__auto____20446)];
      if(or__3824__auto____20447) {
        return or__3824__auto____20447
      }else {
        var or__3824__auto____20448 = cljs.core._seq["_"];
        if(or__3824__auto____20448) {
          return or__3824__auto____20448
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
    var and__3822__auto____20453 = coll;
    if(and__3822__auto____20453) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____20453
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____20454 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20455 = cljs.core._rseq[goog.typeOf(x__2363__auto____20454)];
      if(or__3824__auto____20455) {
        return or__3824__auto____20455
      }else {
        var or__3824__auto____20456 = cljs.core._rseq["_"];
        if(or__3824__auto____20456) {
          return or__3824__auto____20456
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
    var and__3822__auto____20461 = coll;
    if(and__3822__auto____20461) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____20461
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____20462 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20463 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____20462)];
      if(or__3824__auto____20463) {
        return or__3824__auto____20463
      }else {
        var or__3824__auto____20464 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____20464) {
          return or__3824__auto____20464
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____20469 = coll;
    if(and__3822__auto____20469) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____20469
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____20470 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20471 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____20470)];
      if(or__3824__auto____20471) {
        return or__3824__auto____20471
      }else {
        var or__3824__auto____20472 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____20472) {
          return or__3824__auto____20472
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____20477 = coll;
    if(and__3822__auto____20477) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____20477
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____20478 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20479 = cljs.core._entry_key[goog.typeOf(x__2363__auto____20478)];
      if(or__3824__auto____20479) {
        return or__3824__auto____20479
      }else {
        var or__3824__auto____20480 = cljs.core._entry_key["_"];
        if(or__3824__auto____20480) {
          return or__3824__auto____20480
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____20485 = coll;
    if(and__3822__auto____20485) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____20485
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____20486 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20487 = cljs.core._comparator[goog.typeOf(x__2363__auto____20486)];
      if(or__3824__auto____20487) {
        return or__3824__auto____20487
      }else {
        var or__3824__auto____20488 = cljs.core._comparator["_"];
        if(or__3824__auto____20488) {
          return or__3824__auto____20488
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
    var and__3822__auto____20493 = o;
    if(and__3822__auto____20493) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____20493
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____20494 = o == null ? null : o;
    return function() {
      var or__3824__auto____20495 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____20494)];
      if(or__3824__auto____20495) {
        return or__3824__auto____20495
      }else {
        var or__3824__auto____20496 = cljs.core._pr_seq["_"];
        if(or__3824__auto____20496) {
          return or__3824__auto____20496
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
    var and__3822__auto____20501 = d;
    if(and__3822__auto____20501) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____20501
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____20502 = d == null ? null : d;
    return function() {
      var or__3824__auto____20503 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____20502)];
      if(or__3824__auto____20503) {
        return or__3824__auto____20503
      }else {
        var or__3824__auto____20504 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____20504) {
          return or__3824__auto____20504
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
    var and__3822__auto____20509 = this$;
    if(and__3822__auto____20509) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____20509
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____20510 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____20511 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____20510)];
      if(or__3824__auto____20511) {
        return or__3824__auto____20511
      }else {
        var or__3824__auto____20512 = cljs.core._notify_watches["_"];
        if(or__3824__auto____20512) {
          return or__3824__auto____20512
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____20517 = this$;
    if(and__3822__auto____20517) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____20517
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____20518 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____20519 = cljs.core._add_watch[goog.typeOf(x__2363__auto____20518)];
      if(or__3824__auto____20519) {
        return or__3824__auto____20519
      }else {
        var or__3824__auto____20520 = cljs.core._add_watch["_"];
        if(or__3824__auto____20520) {
          return or__3824__auto____20520
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____20525 = this$;
    if(and__3822__auto____20525) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____20525
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____20526 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____20527 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____20526)];
      if(or__3824__auto____20527) {
        return or__3824__auto____20527
      }else {
        var or__3824__auto____20528 = cljs.core._remove_watch["_"];
        if(or__3824__auto____20528) {
          return or__3824__auto____20528
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
    var and__3822__auto____20533 = coll;
    if(and__3822__auto____20533) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____20533
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____20534 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20535 = cljs.core._as_transient[goog.typeOf(x__2363__auto____20534)];
      if(or__3824__auto____20535) {
        return or__3824__auto____20535
      }else {
        var or__3824__auto____20536 = cljs.core._as_transient["_"];
        if(or__3824__auto____20536) {
          return or__3824__auto____20536
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
    var and__3822__auto____20541 = tcoll;
    if(and__3822__auto____20541) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____20541
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____20542 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____20543 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____20542)];
      if(or__3824__auto____20543) {
        return or__3824__auto____20543
      }else {
        var or__3824__auto____20544 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____20544) {
          return or__3824__auto____20544
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____20549 = tcoll;
    if(and__3822__auto____20549) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____20549
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____20550 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____20551 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____20550)];
      if(or__3824__auto____20551) {
        return or__3824__auto____20551
      }else {
        var or__3824__auto____20552 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____20552) {
          return or__3824__auto____20552
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
    var and__3822__auto____20557 = tcoll;
    if(and__3822__auto____20557) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____20557
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____20558 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____20559 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____20558)];
      if(or__3824__auto____20559) {
        return or__3824__auto____20559
      }else {
        var or__3824__auto____20560 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____20560) {
          return or__3824__auto____20560
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
    var and__3822__auto____20565 = tcoll;
    if(and__3822__auto____20565) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____20565
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____20566 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____20567 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____20566)];
      if(or__3824__auto____20567) {
        return or__3824__auto____20567
      }else {
        var or__3824__auto____20568 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____20568) {
          return or__3824__auto____20568
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
    var and__3822__auto____20573 = tcoll;
    if(and__3822__auto____20573) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____20573
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____20574 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____20575 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____20574)];
      if(or__3824__auto____20575) {
        return or__3824__auto____20575
      }else {
        var or__3824__auto____20576 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____20576) {
          return or__3824__auto____20576
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____20581 = tcoll;
    if(and__3822__auto____20581) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____20581
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____20582 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____20583 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____20582)];
      if(or__3824__auto____20583) {
        return or__3824__auto____20583
      }else {
        var or__3824__auto____20584 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____20584) {
          return or__3824__auto____20584
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
    var and__3822__auto____20589 = tcoll;
    if(and__3822__auto____20589) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____20589
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____20590 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____20591 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____20590)];
      if(or__3824__auto____20591) {
        return or__3824__auto____20591
      }else {
        var or__3824__auto____20592 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____20592) {
          return or__3824__auto____20592
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
    var and__3822__auto____20597 = x;
    if(and__3822__auto____20597) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____20597
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____20598 = x == null ? null : x;
    return function() {
      var or__3824__auto____20599 = cljs.core._compare[goog.typeOf(x__2363__auto____20598)];
      if(or__3824__auto____20599) {
        return or__3824__auto____20599
      }else {
        var or__3824__auto____20600 = cljs.core._compare["_"];
        if(or__3824__auto____20600) {
          return or__3824__auto____20600
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
    var and__3822__auto____20605 = coll;
    if(and__3822__auto____20605) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____20605
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____20606 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20607 = cljs.core._drop_first[goog.typeOf(x__2363__auto____20606)];
      if(or__3824__auto____20607) {
        return or__3824__auto____20607
      }else {
        var or__3824__auto____20608 = cljs.core._drop_first["_"];
        if(or__3824__auto____20608) {
          return or__3824__auto____20608
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
    var and__3822__auto____20613 = coll;
    if(and__3822__auto____20613) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____20613
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____20614 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20615 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____20614)];
      if(or__3824__auto____20615) {
        return or__3824__auto____20615
      }else {
        var or__3824__auto____20616 = cljs.core._chunked_first["_"];
        if(or__3824__auto____20616) {
          return or__3824__auto____20616
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____20621 = coll;
    if(and__3822__auto____20621) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____20621
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____20622 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20623 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____20622)];
      if(or__3824__auto____20623) {
        return or__3824__auto____20623
      }else {
        var or__3824__auto____20624 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____20624) {
          return or__3824__auto____20624
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
    var and__3822__auto____20629 = coll;
    if(and__3822__auto____20629) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____20629
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____20630 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____20631 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____20630)];
      if(or__3824__auto____20631) {
        return or__3824__auto____20631
      }else {
        var or__3824__auto____20632 = cljs.core._chunked_next["_"];
        if(or__3824__auto____20632) {
          return or__3824__auto____20632
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
    var or__3824__auto____20634 = x === y;
    if(or__3824__auto____20634) {
      return or__3824__auto____20634
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__20635__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__20636 = y;
            var G__20637 = cljs.core.first.call(null, more);
            var G__20638 = cljs.core.next.call(null, more);
            x = G__20636;
            y = G__20637;
            more = G__20638;
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
    var G__20635 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__20635__delegate.call(this, x, y, more)
    };
    G__20635.cljs$lang$maxFixedArity = 2;
    G__20635.cljs$lang$applyTo = function(arglist__20639) {
      var x = cljs.core.first(arglist__20639);
      var y = cljs.core.first(cljs.core.next(arglist__20639));
      var more = cljs.core.rest(cljs.core.next(arglist__20639));
      return G__20635__delegate(x, y, more)
    };
    G__20635.cljs$lang$arity$variadic = G__20635__delegate;
    return G__20635
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
  var G__20640 = null;
  var G__20640__2 = function(o, k) {
    return null
  };
  var G__20640__3 = function(o, k, not_found) {
    return not_found
  };
  G__20640 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__20640__2.call(this, o, k);
      case 3:
        return G__20640__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__20640
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
  var G__20641 = null;
  var G__20641__2 = function(_, f) {
    return f.call(null)
  };
  var G__20641__3 = function(_, f, start) {
    return start
  };
  G__20641 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__20641__2.call(this, _, f);
      case 3:
        return G__20641__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__20641
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
  var G__20642 = null;
  var G__20642__2 = function(_, n) {
    return null
  };
  var G__20642__3 = function(_, n, not_found) {
    return not_found
  };
  G__20642 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__20642__2.call(this, _, n);
      case 3:
        return G__20642__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__20642
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
  var and__3822__auto____20643 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____20643) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____20643
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
    var cnt__20656 = cljs.core._count.call(null, cicoll);
    if(cnt__20656 === 0) {
      return f.call(null)
    }else {
      var val__20657 = cljs.core._nth.call(null, cicoll, 0);
      var n__20658 = 1;
      while(true) {
        if(n__20658 < cnt__20656) {
          var nval__20659 = f.call(null, val__20657, cljs.core._nth.call(null, cicoll, n__20658));
          if(cljs.core.reduced_QMARK_.call(null, nval__20659)) {
            return cljs.core.deref.call(null, nval__20659)
          }else {
            var G__20668 = nval__20659;
            var G__20669 = n__20658 + 1;
            val__20657 = G__20668;
            n__20658 = G__20669;
            continue
          }
        }else {
          return val__20657
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__20660 = cljs.core._count.call(null, cicoll);
    var val__20661 = val;
    var n__20662 = 0;
    while(true) {
      if(n__20662 < cnt__20660) {
        var nval__20663 = f.call(null, val__20661, cljs.core._nth.call(null, cicoll, n__20662));
        if(cljs.core.reduced_QMARK_.call(null, nval__20663)) {
          return cljs.core.deref.call(null, nval__20663)
        }else {
          var G__20670 = nval__20663;
          var G__20671 = n__20662 + 1;
          val__20661 = G__20670;
          n__20662 = G__20671;
          continue
        }
      }else {
        return val__20661
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__20664 = cljs.core._count.call(null, cicoll);
    var val__20665 = val;
    var n__20666 = idx;
    while(true) {
      if(n__20666 < cnt__20664) {
        var nval__20667 = f.call(null, val__20665, cljs.core._nth.call(null, cicoll, n__20666));
        if(cljs.core.reduced_QMARK_.call(null, nval__20667)) {
          return cljs.core.deref.call(null, nval__20667)
        }else {
          var G__20672 = nval__20667;
          var G__20673 = n__20666 + 1;
          val__20665 = G__20672;
          n__20666 = G__20673;
          continue
        }
      }else {
        return val__20665
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
    var cnt__20686 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__20687 = arr[0];
      var n__20688 = 1;
      while(true) {
        if(n__20688 < cnt__20686) {
          var nval__20689 = f.call(null, val__20687, arr[n__20688]);
          if(cljs.core.reduced_QMARK_.call(null, nval__20689)) {
            return cljs.core.deref.call(null, nval__20689)
          }else {
            var G__20698 = nval__20689;
            var G__20699 = n__20688 + 1;
            val__20687 = G__20698;
            n__20688 = G__20699;
            continue
          }
        }else {
          return val__20687
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__20690 = arr.length;
    var val__20691 = val;
    var n__20692 = 0;
    while(true) {
      if(n__20692 < cnt__20690) {
        var nval__20693 = f.call(null, val__20691, arr[n__20692]);
        if(cljs.core.reduced_QMARK_.call(null, nval__20693)) {
          return cljs.core.deref.call(null, nval__20693)
        }else {
          var G__20700 = nval__20693;
          var G__20701 = n__20692 + 1;
          val__20691 = G__20700;
          n__20692 = G__20701;
          continue
        }
      }else {
        return val__20691
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__20694 = arr.length;
    var val__20695 = val;
    var n__20696 = idx;
    while(true) {
      if(n__20696 < cnt__20694) {
        var nval__20697 = f.call(null, val__20695, arr[n__20696]);
        if(cljs.core.reduced_QMARK_.call(null, nval__20697)) {
          return cljs.core.deref.call(null, nval__20697)
        }else {
          var G__20702 = nval__20697;
          var G__20703 = n__20696 + 1;
          val__20695 = G__20702;
          n__20696 = G__20703;
          continue
        }
      }else {
        return val__20695
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
  var this__20704 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__20705 = this;
  if(this__20705.i + 1 < this__20705.a.length) {
    return new cljs.core.IndexedSeq(this__20705.a, this__20705.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__20706 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__20707 = this;
  var c__20708 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__20708 > 0) {
    return new cljs.core.RSeq(coll, c__20708 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__20709 = this;
  var this__20710 = this;
  return cljs.core.pr_str.call(null, this__20710)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__20711 = this;
  if(cljs.core.counted_QMARK_.call(null, this__20711.a)) {
    return cljs.core.ci_reduce.call(null, this__20711.a, f, this__20711.a[this__20711.i], this__20711.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__20711.a[this__20711.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__20712 = this;
  if(cljs.core.counted_QMARK_.call(null, this__20712.a)) {
    return cljs.core.ci_reduce.call(null, this__20712.a, f, start, this__20712.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__20713 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__20714 = this;
  return this__20714.a.length - this__20714.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__20715 = this;
  return this__20715.a[this__20715.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__20716 = this;
  if(this__20716.i + 1 < this__20716.a.length) {
    return new cljs.core.IndexedSeq(this__20716.a, this__20716.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__20717 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__20718 = this;
  var i__20719 = n + this__20718.i;
  if(i__20719 < this__20718.a.length) {
    return this__20718.a[i__20719]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__20720 = this;
  var i__20721 = n + this__20720.i;
  if(i__20721 < this__20720.a.length) {
    return this__20720.a[i__20721]
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
  var G__20722 = null;
  var G__20722__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__20722__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__20722 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__20722__2.call(this, array, f);
      case 3:
        return G__20722__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__20722
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__20723 = null;
  var G__20723__2 = function(array, k) {
    return array[k]
  };
  var G__20723__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__20723 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__20723__2.call(this, array, k);
      case 3:
        return G__20723__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__20723
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__20724 = null;
  var G__20724__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__20724__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__20724 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__20724__2.call(this, array, n);
      case 3:
        return G__20724__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__20724
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
  var this__20725 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__20726 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__20727 = this;
  var this__20728 = this;
  return cljs.core.pr_str.call(null, this__20728)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__20729 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__20730 = this;
  return this__20730.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__20731 = this;
  return cljs.core._nth.call(null, this__20731.ci, this__20731.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__20732 = this;
  if(this__20732.i > 0) {
    return new cljs.core.RSeq(this__20732.ci, this__20732.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__20733 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__20734 = this;
  return new cljs.core.RSeq(this__20734.ci, this__20734.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__20735 = this;
  return this__20735.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__20739__20740 = coll;
      if(G__20739__20740) {
        if(function() {
          var or__3824__auto____20741 = G__20739__20740.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____20741) {
            return or__3824__auto____20741
          }else {
            return G__20739__20740.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__20739__20740.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__20739__20740)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__20739__20740)
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
      var G__20746__20747 = coll;
      if(G__20746__20747) {
        if(function() {
          var or__3824__auto____20748 = G__20746__20747.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____20748) {
            return or__3824__auto____20748
          }else {
            return G__20746__20747.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__20746__20747.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__20746__20747)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__20746__20747)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__20749 = cljs.core.seq.call(null, coll);
      if(s__20749 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__20749)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__20754__20755 = coll;
      if(G__20754__20755) {
        if(function() {
          var or__3824__auto____20756 = G__20754__20755.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____20756) {
            return or__3824__auto____20756
          }else {
            return G__20754__20755.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__20754__20755.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__20754__20755)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__20754__20755)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__20757 = cljs.core.seq.call(null, coll);
      if(!(s__20757 == null)) {
        return cljs.core._rest.call(null, s__20757)
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
      var G__20761__20762 = coll;
      if(G__20761__20762) {
        if(function() {
          var or__3824__auto____20763 = G__20761__20762.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____20763) {
            return or__3824__auto____20763
          }else {
            return G__20761__20762.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__20761__20762.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__20761__20762)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__20761__20762)
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
    var sn__20765 = cljs.core.next.call(null, s);
    if(!(sn__20765 == null)) {
      var G__20766 = sn__20765;
      s = G__20766;
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
    var G__20767__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__20768 = conj.call(null, coll, x);
          var G__20769 = cljs.core.first.call(null, xs);
          var G__20770 = cljs.core.next.call(null, xs);
          coll = G__20768;
          x = G__20769;
          xs = G__20770;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__20767 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__20767__delegate.call(this, coll, x, xs)
    };
    G__20767.cljs$lang$maxFixedArity = 2;
    G__20767.cljs$lang$applyTo = function(arglist__20771) {
      var coll = cljs.core.first(arglist__20771);
      var x = cljs.core.first(cljs.core.next(arglist__20771));
      var xs = cljs.core.rest(cljs.core.next(arglist__20771));
      return G__20767__delegate(coll, x, xs)
    };
    G__20767.cljs$lang$arity$variadic = G__20767__delegate;
    return G__20767
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
  var s__20774 = cljs.core.seq.call(null, coll);
  var acc__20775 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__20774)) {
      return acc__20775 + cljs.core._count.call(null, s__20774)
    }else {
      var G__20776 = cljs.core.next.call(null, s__20774);
      var G__20777 = acc__20775 + 1;
      s__20774 = G__20776;
      acc__20775 = G__20777;
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
        var G__20784__20785 = coll;
        if(G__20784__20785) {
          if(function() {
            var or__3824__auto____20786 = G__20784__20785.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____20786) {
              return or__3824__auto____20786
            }else {
              return G__20784__20785.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__20784__20785.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__20784__20785)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__20784__20785)
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
        var G__20787__20788 = coll;
        if(G__20787__20788) {
          if(function() {
            var or__3824__auto____20789 = G__20787__20788.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____20789) {
              return or__3824__auto____20789
            }else {
              return G__20787__20788.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__20787__20788.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__20787__20788)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__20787__20788)
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
    var G__20792__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__20791 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__20793 = ret__20791;
          var G__20794 = cljs.core.first.call(null, kvs);
          var G__20795 = cljs.core.second.call(null, kvs);
          var G__20796 = cljs.core.nnext.call(null, kvs);
          coll = G__20793;
          k = G__20794;
          v = G__20795;
          kvs = G__20796;
          continue
        }else {
          return ret__20791
        }
        break
      }
    };
    var G__20792 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__20792__delegate.call(this, coll, k, v, kvs)
    };
    G__20792.cljs$lang$maxFixedArity = 3;
    G__20792.cljs$lang$applyTo = function(arglist__20797) {
      var coll = cljs.core.first(arglist__20797);
      var k = cljs.core.first(cljs.core.next(arglist__20797));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__20797)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__20797)));
      return G__20792__delegate(coll, k, v, kvs)
    };
    G__20792.cljs$lang$arity$variadic = G__20792__delegate;
    return G__20792
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
    var G__20800__delegate = function(coll, k, ks) {
      while(true) {
        var ret__20799 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__20801 = ret__20799;
          var G__20802 = cljs.core.first.call(null, ks);
          var G__20803 = cljs.core.next.call(null, ks);
          coll = G__20801;
          k = G__20802;
          ks = G__20803;
          continue
        }else {
          return ret__20799
        }
        break
      }
    };
    var G__20800 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__20800__delegate.call(this, coll, k, ks)
    };
    G__20800.cljs$lang$maxFixedArity = 2;
    G__20800.cljs$lang$applyTo = function(arglist__20804) {
      var coll = cljs.core.first(arglist__20804);
      var k = cljs.core.first(cljs.core.next(arglist__20804));
      var ks = cljs.core.rest(cljs.core.next(arglist__20804));
      return G__20800__delegate(coll, k, ks)
    };
    G__20800.cljs$lang$arity$variadic = G__20800__delegate;
    return G__20800
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
    var G__20808__20809 = o;
    if(G__20808__20809) {
      if(function() {
        var or__3824__auto____20810 = G__20808__20809.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____20810) {
          return or__3824__auto____20810
        }else {
          return G__20808__20809.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__20808__20809.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__20808__20809)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__20808__20809)
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
    var G__20813__delegate = function(coll, k, ks) {
      while(true) {
        var ret__20812 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__20814 = ret__20812;
          var G__20815 = cljs.core.first.call(null, ks);
          var G__20816 = cljs.core.next.call(null, ks);
          coll = G__20814;
          k = G__20815;
          ks = G__20816;
          continue
        }else {
          return ret__20812
        }
        break
      }
    };
    var G__20813 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__20813__delegate.call(this, coll, k, ks)
    };
    G__20813.cljs$lang$maxFixedArity = 2;
    G__20813.cljs$lang$applyTo = function(arglist__20817) {
      var coll = cljs.core.first(arglist__20817);
      var k = cljs.core.first(cljs.core.next(arglist__20817));
      var ks = cljs.core.rest(cljs.core.next(arglist__20817));
      return G__20813__delegate(coll, k, ks)
    };
    G__20813.cljs$lang$arity$variadic = G__20813__delegate;
    return G__20813
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
  var h__20819 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__20819;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__20819
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__20821 = cljs.core.string_hash_cache[k];
  if(!(h__20821 == null)) {
    return h__20821
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
      var and__3822__auto____20823 = goog.isString(o);
      if(and__3822__auto____20823) {
        return check_cache
      }else {
        return and__3822__auto____20823
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
    var G__20827__20828 = x;
    if(G__20827__20828) {
      if(function() {
        var or__3824__auto____20829 = G__20827__20828.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____20829) {
          return or__3824__auto____20829
        }else {
          return G__20827__20828.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__20827__20828.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__20827__20828)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__20827__20828)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__20833__20834 = x;
    if(G__20833__20834) {
      if(function() {
        var or__3824__auto____20835 = G__20833__20834.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____20835) {
          return or__3824__auto____20835
        }else {
          return G__20833__20834.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__20833__20834.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__20833__20834)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__20833__20834)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__20839__20840 = x;
  if(G__20839__20840) {
    if(function() {
      var or__3824__auto____20841 = G__20839__20840.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____20841) {
        return or__3824__auto____20841
      }else {
        return G__20839__20840.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__20839__20840.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__20839__20840)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__20839__20840)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__20845__20846 = x;
  if(G__20845__20846) {
    if(function() {
      var or__3824__auto____20847 = G__20845__20846.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____20847) {
        return or__3824__auto____20847
      }else {
        return G__20845__20846.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__20845__20846.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__20845__20846)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__20845__20846)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__20851__20852 = x;
  if(G__20851__20852) {
    if(function() {
      var or__3824__auto____20853 = G__20851__20852.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____20853) {
        return or__3824__auto____20853
      }else {
        return G__20851__20852.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__20851__20852.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__20851__20852)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__20851__20852)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__20857__20858 = x;
  if(G__20857__20858) {
    if(function() {
      var or__3824__auto____20859 = G__20857__20858.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____20859) {
        return or__3824__auto____20859
      }else {
        return G__20857__20858.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__20857__20858.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__20857__20858)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__20857__20858)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__20863__20864 = x;
  if(G__20863__20864) {
    if(function() {
      var or__3824__auto____20865 = G__20863__20864.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____20865) {
        return or__3824__auto____20865
      }else {
        return G__20863__20864.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__20863__20864.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__20863__20864)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__20863__20864)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__20869__20870 = x;
    if(G__20869__20870) {
      if(function() {
        var or__3824__auto____20871 = G__20869__20870.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____20871) {
          return or__3824__auto____20871
        }else {
          return G__20869__20870.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__20869__20870.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__20869__20870)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__20869__20870)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__20875__20876 = x;
  if(G__20875__20876) {
    if(function() {
      var or__3824__auto____20877 = G__20875__20876.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____20877) {
        return or__3824__auto____20877
      }else {
        return G__20875__20876.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__20875__20876.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__20875__20876)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__20875__20876)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__20881__20882 = x;
  if(G__20881__20882) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____20883 = null;
      if(cljs.core.truth_(or__3824__auto____20883)) {
        return or__3824__auto____20883
      }else {
        return G__20881__20882.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__20881__20882.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__20881__20882)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__20881__20882)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__20884__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__20884 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__20884__delegate.call(this, keyvals)
    };
    G__20884.cljs$lang$maxFixedArity = 0;
    G__20884.cljs$lang$applyTo = function(arglist__20885) {
      var keyvals = cljs.core.seq(arglist__20885);
      return G__20884__delegate(keyvals)
    };
    G__20884.cljs$lang$arity$variadic = G__20884__delegate;
    return G__20884
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
  var keys__20887 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__20887.push(key)
  });
  return keys__20887
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__20891 = i;
  var j__20892 = j;
  var len__20893 = len;
  while(true) {
    if(len__20893 === 0) {
      return to
    }else {
      to[j__20892] = from[i__20891];
      var G__20894 = i__20891 + 1;
      var G__20895 = j__20892 + 1;
      var G__20896 = len__20893 - 1;
      i__20891 = G__20894;
      j__20892 = G__20895;
      len__20893 = G__20896;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__20900 = i + (len - 1);
  var j__20901 = j + (len - 1);
  var len__20902 = len;
  while(true) {
    if(len__20902 === 0) {
      return to
    }else {
      to[j__20901] = from[i__20900];
      var G__20903 = i__20900 - 1;
      var G__20904 = j__20901 - 1;
      var G__20905 = len__20902 - 1;
      i__20900 = G__20903;
      j__20901 = G__20904;
      len__20902 = G__20905;
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
    var G__20909__20910 = s;
    if(G__20909__20910) {
      if(function() {
        var or__3824__auto____20911 = G__20909__20910.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____20911) {
          return or__3824__auto____20911
        }else {
          return G__20909__20910.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__20909__20910.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__20909__20910)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__20909__20910)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__20915__20916 = s;
  if(G__20915__20916) {
    if(function() {
      var or__3824__auto____20917 = G__20915__20916.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____20917) {
        return or__3824__auto____20917
      }else {
        return G__20915__20916.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__20915__20916.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__20915__20916)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__20915__20916)
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
  var and__3822__auto____20920 = goog.isString(x);
  if(and__3822__auto____20920) {
    return!function() {
      var or__3824__auto____20921 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____20921) {
        return or__3824__auto____20921
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____20920
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____20923 = goog.isString(x);
  if(and__3822__auto____20923) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____20923
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____20925 = goog.isString(x);
  if(and__3822__auto____20925) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____20925
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____20930 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____20930) {
    return or__3824__auto____20930
  }else {
    var G__20931__20932 = f;
    if(G__20931__20932) {
      if(function() {
        var or__3824__auto____20933 = G__20931__20932.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____20933) {
          return or__3824__auto____20933
        }else {
          return G__20931__20932.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__20931__20932.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__20931__20932)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__20931__20932)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____20935 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____20935) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____20935
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
    var and__3822__auto____20938 = coll;
    if(cljs.core.truth_(and__3822__auto____20938)) {
      var and__3822__auto____20939 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____20939) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____20939
      }
    }else {
      return and__3822__auto____20938
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
    var G__20948__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__20944 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__20945 = more;
        while(true) {
          var x__20946 = cljs.core.first.call(null, xs__20945);
          var etc__20947 = cljs.core.next.call(null, xs__20945);
          if(cljs.core.truth_(xs__20945)) {
            if(cljs.core.contains_QMARK_.call(null, s__20944, x__20946)) {
              return false
            }else {
              var G__20949 = cljs.core.conj.call(null, s__20944, x__20946);
              var G__20950 = etc__20947;
              s__20944 = G__20949;
              xs__20945 = G__20950;
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
    var G__20948 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__20948__delegate.call(this, x, y, more)
    };
    G__20948.cljs$lang$maxFixedArity = 2;
    G__20948.cljs$lang$applyTo = function(arglist__20951) {
      var x = cljs.core.first(arglist__20951);
      var y = cljs.core.first(cljs.core.next(arglist__20951));
      var more = cljs.core.rest(cljs.core.next(arglist__20951));
      return G__20948__delegate(x, y, more)
    };
    G__20948.cljs$lang$arity$variadic = G__20948__delegate;
    return G__20948
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
            var G__20955__20956 = x;
            if(G__20955__20956) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____20957 = null;
                if(cljs.core.truth_(or__3824__auto____20957)) {
                  return or__3824__auto____20957
                }else {
                  return G__20955__20956.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__20955__20956.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__20955__20956)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__20955__20956)
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
    var xl__20962 = cljs.core.count.call(null, xs);
    var yl__20963 = cljs.core.count.call(null, ys);
    if(xl__20962 < yl__20963) {
      return-1
    }else {
      if(xl__20962 > yl__20963) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__20962, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__20964 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____20965 = d__20964 === 0;
        if(and__3822__auto____20965) {
          return n + 1 < len
        }else {
          return and__3822__auto____20965
        }
      }()) {
        var G__20966 = xs;
        var G__20967 = ys;
        var G__20968 = len;
        var G__20969 = n + 1;
        xs = G__20966;
        ys = G__20967;
        len = G__20968;
        n = G__20969;
        continue
      }else {
        return d__20964
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
      var r__20971 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__20971)) {
        return r__20971
      }else {
        if(cljs.core.truth_(r__20971)) {
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
      var a__20973 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__20973, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__20973)
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
    var temp__3971__auto____20979 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____20979) {
      var s__20980 = temp__3971__auto____20979;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__20980), cljs.core.next.call(null, s__20980))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__20981 = val;
    var coll__20982 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__20982) {
        var nval__20983 = f.call(null, val__20981, cljs.core.first.call(null, coll__20982));
        if(cljs.core.reduced_QMARK_.call(null, nval__20983)) {
          return cljs.core.deref.call(null, nval__20983)
        }else {
          var G__20984 = nval__20983;
          var G__20985 = cljs.core.next.call(null, coll__20982);
          val__20981 = G__20984;
          coll__20982 = G__20985;
          continue
        }
      }else {
        return val__20981
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
  var a__20987 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__20987);
  return cljs.core.vec.call(null, a__20987)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__20994__20995 = coll;
      if(G__20994__20995) {
        if(function() {
          var or__3824__auto____20996 = G__20994__20995.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____20996) {
            return or__3824__auto____20996
          }else {
            return G__20994__20995.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__20994__20995.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__20994__20995)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__20994__20995)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__20997__20998 = coll;
      if(G__20997__20998) {
        if(function() {
          var or__3824__auto____20999 = G__20997__20998.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____20999) {
            return or__3824__auto____20999
          }else {
            return G__20997__20998.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__20997__20998.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__20997__20998)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__20997__20998)
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
  var this__21000 = this;
  return this__21000.val
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
    var G__21001__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__21001 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__21001__delegate.call(this, x, y, more)
    };
    G__21001.cljs$lang$maxFixedArity = 2;
    G__21001.cljs$lang$applyTo = function(arglist__21002) {
      var x = cljs.core.first(arglist__21002);
      var y = cljs.core.first(cljs.core.next(arglist__21002));
      var more = cljs.core.rest(cljs.core.next(arglist__21002));
      return G__21001__delegate(x, y, more)
    };
    G__21001.cljs$lang$arity$variadic = G__21001__delegate;
    return G__21001
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
    var G__21003__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__21003 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__21003__delegate.call(this, x, y, more)
    };
    G__21003.cljs$lang$maxFixedArity = 2;
    G__21003.cljs$lang$applyTo = function(arglist__21004) {
      var x = cljs.core.first(arglist__21004);
      var y = cljs.core.first(cljs.core.next(arglist__21004));
      var more = cljs.core.rest(cljs.core.next(arglist__21004));
      return G__21003__delegate(x, y, more)
    };
    G__21003.cljs$lang$arity$variadic = G__21003__delegate;
    return G__21003
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
    var G__21005__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__21005 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__21005__delegate.call(this, x, y, more)
    };
    G__21005.cljs$lang$maxFixedArity = 2;
    G__21005.cljs$lang$applyTo = function(arglist__21006) {
      var x = cljs.core.first(arglist__21006);
      var y = cljs.core.first(cljs.core.next(arglist__21006));
      var more = cljs.core.rest(cljs.core.next(arglist__21006));
      return G__21005__delegate(x, y, more)
    };
    G__21005.cljs$lang$arity$variadic = G__21005__delegate;
    return G__21005
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
    var G__21007__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__21007 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__21007__delegate.call(this, x, y, more)
    };
    G__21007.cljs$lang$maxFixedArity = 2;
    G__21007.cljs$lang$applyTo = function(arglist__21008) {
      var x = cljs.core.first(arglist__21008);
      var y = cljs.core.first(cljs.core.next(arglist__21008));
      var more = cljs.core.rest(cljs.core.next(arglist__21008));
      return G__21007__delegate(x, y, more)
    };
    G__21007.cljs$lang$arity$variadic = G__21007__delegate;
    return G__21007
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
    var G__21009__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__21010 = y;
            var G__21011 = cljs.core.first.call(null, more);
            var G__21012 = cljs.core.next.call(null, more);
            x = G__21010;
            y = G__21011;
            more = G__21012;
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
    var G__21009 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__21009__delegate.call(this, x, y, more)
    };
    G__21009.cljs$lang$maxFixedArity = 2;
    G__21009.cljs$lang$applyTo = function(arglist__21013) {
      var x = cljs.core.first(arglist__21013);
      var y = cljs.core.first(cljs.core.next(arglist__21013));
      var more = cljs.core.rest(cljs.core.next(arglist__21013));
      return G__21009__delegate(x, y, more)
    };
    G__21009.cljs$lang$arity$variadic = G__21009__delegate;
    return G__21009
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
    var G__21014__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__21015 = y;
            var G__21016 = cljs.core.first.call(null, more);
            var G__21017 = cljs.core.next.call(null, more);
            x = G__21015;
            y = G__21016;
            more = G__21017;
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
    var G__21014 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__21014__delegate.call(this, x, y, more)
    };
    G__21014.cljs$lang$maxFixedArity = 2;
    G__21014.cljs$lang$applyTo = function(arglist__21018) {
      var x = cljs.core.first(arglist__21018);
      var y = cljs.core.first(cljs.core.next(arglist__21018));
      var more = cljs.core.rest(cljs.core.next(arglist__21018));
      return G__21014__delegate(x, y, more)
    };
    G__21014.cljs$lang$arity$variadic = G__21014__delegate;
    return G__21014
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
    var G__21019__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__21020 = y;
            var G__21021 = cljs.core.first.call(null, more);
            var G__21022 = cljs.core.next.call(null, more);
            x = G__21020;
            y = G__21021;
            more = G__21022;
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
    var G__21019 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__21019__delegate.call(this, x, y, more)
    };
    G__21019.cljs$lang$maxFixedArity = 2;
    G__21019.cljs$lang$applyTo = function(arglist__21023) {
      var x = cljs.core.first(arglist__21023);
      var y = cljs.core.first(cljs.core.next(arglist__21023));
      var more = cljs.core.rest(cljs.core.next(arglist__21023));
      return G__21019__delegate(x, y, more)
    };
    G__21019.cljs$lang$arity$variadic = G__21019__delegate;
    return G__21019
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
    var G__21024__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__21025 = y;
            var G__21026 = cljs.core.first.call(null, more);
            var G__21027 = cljs.core.next.call(null, more);
            x = G__21025;
            y = G__21026;
            more = G__21027;
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
    var G__21024 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__21024__delegate.call(this, x, y, more)
    };
    G__21024.cljs$lang$maxFixedArity = 2;
    G__21024.cljs$lang$applyTo = function(arglist__21028) {
      var x = cljs.core.first(arglist__21028);
      var y = cljs.core.first(cljs.core.next(arglist__21028));
      var more = cljs.core.rest(cljs.core.next(arglist__21028));
      return G__21024__delegate(x, y, more)
    };
    G__21024.cljs$lang$arity$variadic = G__21024__delegate;
    return G__21024
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
    var G__21029__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__21029 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__21029__delegate.call(this, x, y, more)
    };
    G__21029.cljs$lang$maxFixedArity = 2;
    G__21029.cljs$lang$applyTo = function(arglist__21030) {
      var x = cljs.core.first(arglist__21030);
      var y = cljs.core.first(cljs.core.next(arglist__21030));
      var more = cljs.core.rest(cljs.core.next(arglist__21030));
      return G__21029__delegate(x, y, more)
    };
    G__21029.cljs$lang$arity$variadic = G__21029__delegate;
    return G__21029
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
    var G__21031__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__21031 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__21031__delegate.call(this, x, y, more)
    };
    G__21031.cljs$lang$maxFixedArity = 2;
    G__21031.cljs$lang$applyTo = function(arglist__21032) {
      var x = cljs.core.first(arglist__21032);
      var y = cljs.core.first(cljs.core.next(arglist__21032));
      var more = cljs.core.rest(cljs.core.next(arglist__21032));
      return G__21031__delegate(x, y, more)
    };
    G__21031.cljs$lang$arity$variadic = G__21031__delegate;
    return G__21031
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
  var rem__21034 = n % d;
  return cljs.core.fix.call(null, (n - rem__21034) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__21036 = cljs.core.quot.call(null, n, d);
  return n - d * q__21036
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
  var v__21039 = v - (v >> 1 & 1431655765);
  var v__21040 = (v__21039 & 858993459) + (v__21039 >> 2 & 858993459);
  return(v__21040 + (v__21040 >> 4) & 252645135) * 16843009 >> 24
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
    var G__21041__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__21042 = y;
            var G__21043 = cljs.core.first.call(null, more);
            var G__21044 = cljs.core.next.call(null, more);
            x = G__21042;
            y = G__21043;
            more = G__21044;
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
    var G__21041 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__21041__delegate.call(this, x, y, more)
    };
    G__21041.cljs$lang$maxFixedArity = 2;
    G__21041.cljs$lang$applyTo = function(arglist__21045) {
      var x = cljs.core.first(arglist__21045);
      var y = cljs.core.first(cljs.core.next(arglist__21045));
      var more = cljs.core.rest(cljs.core.next(arglist__21045));
      return G__21041__delegate(x, y, more)
    };
    G__21041.cljs$lang$arity$variadic = G__21041__delegate;
    return G__21041
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
  var n__21049 = n;
  var xs__21050 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____21051 = xs__21050;
      if(and__3822__auto____21051) {
        return n__21049 > 0
      }else {
        return and__3822__auto____21051
      }
    }())) {
      var G__21052 = n__21049 - 1;
      var G__21053 = cljs.core.next.call(null, xs__21050);
      n__21049 = G__21052;
      xs__21050 = G__21053;
      continue
    }else {
      return xs__21050
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
    var G__21054__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__21055 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__21056 = cljs.core.next.call(null, more);
            sb = G__21055;
            more = G__21056;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__21054 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__21054__delegate.call(this, x, ys)
    };
    G__21054.cljs$lang$maxFixedArity = 1;
    G__21054.cljs$lang$applyTo = function(arglist__21057) {
      var x = cljs.core.first(arglist__21057);
      var ys = cljs.core.rest(arglist__21057);
      return G__21054__delegate(x, ys)
    };
    G__21054.cljs$lang$arity$variadic = G__21054__delegate;
    return G__21054
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
    var G__21058__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__21059 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__21060 = cljs.core.next.call(null, more);
            sb = G__21059;
            more = G__21060;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__21058 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__21058__delegate.call(this, x, ys)
    };
    G__21058.cljs$lang$maxFixedArity = 1;
    G__21058.cljs$lang$applyTo = function(arglist__21061) {
      var x = cljs.core.first(arglist__21061);
      var ys = cljs.core.rest(arglist__21061);
      return G__21058__delegate(x, ys)
    };
    G__21058.cljs$lang$arity$variadic = G__21058__delegate;
    return G__21058
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
  format.cljs$lang$applyTo = function(arglist__21062) {
    var fmt = cljs.core.first(arglist__21062);
    var args = cljs.core.rest(arglist__21062);
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
    var xs__21065 = cljs.core.seq.call(null, x);
    var ys__21066 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__21065 == null) {
        return ys__21066 == null
      }else {
        if(ys__21066 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__21065), cljs.core.first.call(null, ys__21066))) {
            var G__21067 = cljs.core.next.call(null, xs__21065);
            var G__21068 = cljs.core.next.call(null, ys__21066);
            xs__21065 = G__21067;
            ys__21066 = G__21068;
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
  return cljs.core.reduce.call(null, function(p1__21069_SHARP_, p2__21070_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__21069_SHARP_, cljs.core.hash.call(null, p2__21070_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__21074 = 0;
  var s__21075 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__21075) {
      var e__21076 = cljs.core.first.call(null, s__21075);
      var G__21077 = (h__21074 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__21076)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__21076)))) % 4503599627370496;
      var G__21078 = cljs.core.next.call(null, s__21075);
      h__21074 = G__21077;
      s__21075 = G__21078;
      continue
    }else {
      return h__21074
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__21082 = 0;
  var s__21083 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__21083) {
      var e__21084 = cljs.core.first.call(null, s__21083);
      var G__21085 = (h__21082 + cljs.core.hash.call(null, e__21084)) % 4503599627370496;
      var G__21086 = cljs.core.next.call(null, s__21083);
      h__21082 = G__21085;
      s__21083 = G__21086;
      continue
    }else {
      return h__21082
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__21107__21108 = cljs.core.seq.call(null, fn_map);
  if(G__21107__21108) {
    var G__21110__21112 = cljs.core.first.call(null, G__21107__21108);
    var vec__21111__21113 = G__21110__21112;
    var key_name__21114 = cljs.core.nth.call(null, vec__21111__21113, 0, null);
    var f__21115 = cljs.core.nth.call(null, vec__21111__21113, 1, null);
    var G__21107__21116 = G__21107__21108;
    var G__21110__21117 = G__21110__21112;
    var G__21107__21118 = G__21107__21116;
    while(true) {
      var vec__21119__21120 = G__21110__21117;
      var key_name__21121 = cljs.core.nth.call(null, vec__21119__21120, 0, null);
      var f__21122 = cljs.core.nth.call(null, vec__21119__21120, 1, null);
      var G__21107__21123 = G__21107__21118;
      var str_name__21124 = cljs.core.name.call(null, key_name__21121);
      obj[str_name__21124] = f__21122;
      var temp__3974__auto____21125 = cljs.core.next.call(null, G__21107__21123);
      if(temp__3974__auto____21125) {
        var G__21107__21126 = temp__3974__auto____21125;
        var G__21127 = cljs.core.first.call(null, G__21107__21126);
        var G__21128 = G__21107__21126;
        G__21110__21117 = G__21127;
        G__21107__21118 = G__21128;
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
  var this__21129 = this;
  var h__2192__auto____21130 = this__21129.__hash;
  if(!(h__2192__auto____21130 == null)) {
    return h__2192__auto____21130
  }else {
    var h__2192__auto____21131 = cljs.core.hash_coll.call(null, coll);
    this__21129.__hash = h__2192__auto____21131;
    return h__2192__auto____21131
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__21132 = this;
  if(this__21132.count === 1) {
    return null
  }else {
    return this__21132.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__21133 = this;
  return new cljs.core.List(this__21133.meta, o, coll, this__21133.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__21134 = this;
  var this__21135 = this;
  return cljs.core.pr_str.call(null, this__21135)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__21136 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__21137 = this;
  return this__21137.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__21138 = this;
  return this__21138.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__21139 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__21140 = this;
  return this__21140.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__21141 = this;
  if(this__21141.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__21141.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__21142 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__21143 = this;
  return new cljs.core.List(meta, this__21143.first, this__21143.rest, this__21143.count, this__21143.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__21144 = this;
  return this__21144.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__21145 = this;
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
  var this__21146 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__21147 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__21148 = this;
  return new cljs.core.List(this__21148.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__21149 = this;
  var this__21150 = this;
  return cljs.core.pr_str.call(null, this__21150)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__21151 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__21152 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__21153 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__21154 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__21155 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__21156 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__21157 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__21158 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__21159 = this;
  return this__21159.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__21160 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__21164__21165 = coll;
  if(G__21164__21165) {
    if(function() {
      var or__3824__auto____21166 = G__21164__21165.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____21166) {
        return or__3824__auto____21166
      }else {
        return G__21164__21165.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__21164__21165.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__21164__21165)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__21164__21165)
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
    var G__21167__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__21167 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__21167__delegate.call(this, x, y, z, items)
    };
    G__21167.cljs$lang$maxFixedArity = 3;
    G__21167.cljs$lang$applyTo = function(arglist__21168) {
      var x = cljs.core.first(arglist__21168);
      var y = cljs.core.first(cljs.core.next(arglist__21168));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21168)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21168)));
      return G__21167__delegate(x, y, z, items)
    };
    G__21167.cljs$lang$arity$variadic = G__21167__delegate;
    return G__21167
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
  var this__21169 = this;
  var h__2192__auto____21170 = this__21169.__hash;
  if(!(h__2192__auto____21170 == null)) {
    return h__2192__auto____21170
  }else {
    var h__2192__auto____21171 = cljs.core.hash_coll.call(null, coll);
    this__21169.__hash = h__2192__auto____21171;
    return h__2192__auto____21171
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__21172 = this;
  if(this__21172.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__21172.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__21173 = this;
  return new cljs.core.Cons(null, o, coll, this__21173.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__21174 = this;
  var this__21175 = this;
  return cljs.core.pr_str.call(null, this__21175)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__21176 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__21177 = this;
  return this__21177.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__21178 = this;
  if(this__21178.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__21178.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__21179 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__21180 = this;
  return new cljs.core.Cons(meta, this__21180.first, this__21180.rest, this__21180.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__21181 = this;
  return this__21181.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__21182 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__21182.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____21187 = coll == null;
    if(or__3824__auto____21187) {
      return or__3824__auto____21187
    }else {
      var G__21188__21189 = coll;
      if(G__21188__21189) {
        if(function() {
          var or__3824__auto____21190 = G__21188__21189.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____21190) {
            return or__3824__auto____21190
          }else {
            return G__21188__21189.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__21188__21189.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__21188__21189)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__21188__21189)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__21194__21195 = x;
  if(G__21194__21195) {
    if(function() {
      var or__3824__auto____21196 = G__21194__21195.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____21196) {
        return or__3824__auto____21196
      }else {
        return G__21194__21195.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__21194__21195.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__21194__21195)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__21194__21195)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__21197 = null;
  var G__21197__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__21197__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__21197 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__21197__2.call(this, string, f);
      case 3:
        return G__21197__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__21197
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__21198 = null;
  var G__21198__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__21198__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__21198 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__21198__2.call(this, string, k);
      case 3:
        return G__21198__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__21198
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__21199 = null;
  var G__21199__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__21199__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__21199 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__21199__2.call(this, string, n);
      case 3:
        return G__21199__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__21199
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
  var G__21211 = null;
  var G__21211__2 = function(this_sym21202, coll) {
    var this__21204 = this;
    var this_sym21202__21205 = this;
    var ___21206 = this_sym21202__21205;
    if(coll == null) {
      return null
    }else {
      var strobj__21207 = coll.strobj;
      if(strobj__21207 == null) {
        return cljs.core._lookup.call(null, coll, this__21204.k, null)
      }else {
        return strobj__21207[this__21204.k]
      }
    }
  };
  var G__21211__3 = function(this_sym21203, coll, not_found) {
    var this__21204 = this;
    var this_sym21203__21208 = this;
    var ___21209 = this_sym21203__21208;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__21204.k, not_found)
    }
  };
  G__21211 = function(this_sym21203, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__21211__2.call(this, this_sym21203, coll);
      case 3:
        return G__21211__3.call(this, this_sym21203, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__21211
}();
cljs.core.Keyword.prototype.apply = function(this_sym21200, args21201) {
  var this__21210 = this;
  return this_sym21200.call.apply(this_sym21200, [this_sym21200].concat(args21201.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__21220 = null;
  var G__21220__2 = function(this_sym21214, coll) {
    var this_sym21214__21216 = this;
    var this__21217 = this_sym21214__21216;
    return cljs.core._lookup.call(null, coll, this__21217.toString(), null)
  };
  var G__21220__3 = function(this_sym21215, coll, not_found) {
    var this_sym21215__21218 = this;
    var this__21219 = this_sym21215__21218;
    return cljs.core._lookup.call(null, coll, this__21219.toString(), not_found)
  };
  G__21220 = function(this_sym21215, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__21220__2.call(this, this_sym21215, coll);
      case 3:
        return G__21220__3.call(this, this_sym21215, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__21220
}();
String.prototype.apply = function(this_sym21212, args21213) {
  return this_sym21212.call.apply(this_sym21212, [this_sym21212].concat(args21213.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__21222 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__21222
  }else {
    lazy_seq.x = x__21222.call(null);
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
  var this__21223 = this;
  var h__2192__auto____21224 = this__21223.__hash;
  if(!(h__2192__auto____21224 == null)) {
    return h__2192__auto____21224
  }else {
    var h__2192__auto____21225 = cljs.core.hash_coll.call(null, coll);
    this__21223.__hash = h__2192__auto____21225;
    return h__2192__auto____21225
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__21226 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__21227 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__21228 = this;
  var this__21229 = this;
  return cljs.core.pr_str.call(null, this__21229)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__21230 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__21231 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__21232 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__21233 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__21234 = this;
  return new cljs.core.LazySeq(meta, this__21234.realized, this__21234.x, this__21234.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__21235 = this;
  return this__21235.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__21236 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__21236.meta)
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
  var this__21237 = this;
  return this__21237.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__21238 = this;
  var ___21239 = this;
  this__21238.buf[this__21238.end] = o;
  return this__21238.end = this__21238.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__21240 = this;
  var ___21241 = this;
  var ret__21242 = new cljs.core.ArrayChunk(this__21240.buf, 0, this__21240.end);
  this__21240.buf = null;
  return ret__21242
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
  var this__21243 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__21243.arr[this__21243.off], this__21243.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__21244 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__21244.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__21245 = this;
  if(this__21245.off === this__21245.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__21245.arr, this__21245.off + 1, this__21245.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__21246 = this;
  return this__21246.arr[this__21246.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__21247 = this;
  if(function() {
    var and__3822__auto____21248 = i >= 0;
    if(and__3822__auto____21248) {
      return i < this__21247.end - this__21247.off
    }else {
      return and__3822__auto____21248
    }
  }()) {
    return this__21247.arr[this__21247.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__21249 = this;
  return this__21249.end - this__21249.off
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
  var this__21250 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__21251 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__21252 = this;
  return cljs.core._nth.call(null, this__21252.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__21253 = this;
  if(cljs.core._count.call(null, this__21253.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__21253.chunk), this__21253.more, this__21253.meta)
  }else {
    if(this__21253.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__21253.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__21254 = this;
  if(this__21254.more == null) {
    return null
  }else {
    return this__21254.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__21255 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__21256 = this;
  return new cljs.core.ChunkedCons(this__21256.chunk, this__21256.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__21257 = this;
  return this__21257.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__21258 = this;
  return this__21258.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__21259 = this;
  if(this__21259.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__21259.more
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
    var G__21263__21264 = s;
    if(G__21263__21264) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____21265 = null;
        if(cljs.core.truth_(or__3824__auto____21265)) {
          return or__3824__auto____21265
        }else {
          return G__21263__21264.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__21263__21264.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__21263__21264)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__21263__21264)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__21268 = [];
  var s__21269 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__21269)) {
      ary__21268.push(cljs.core.first.call(null, s__21269));
      var G__21270 = cljs.core.next.call(null, s__21269);
      s__21269 = G__21270;
      continue
    }else {
      return ary__21268
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__21274 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__21275 = 0;
  var xs__21276 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__21276) {
      ret__21274[i__21275] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__21276));
      var G__21277 = i__21275 + 1;
      var G__21278 = cljs.core.next.call(null, xs__21276);
      i__21275 = G__21277;
      xs__21276 = G__21278;
      continue
    }else {
    }
    break
  }
  return ret__21274
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
    var a__21286 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__21287 = cljs.core.seq.call(null, init_val_or_seq);
      var i__21288 = 0;
      var s__21289 = s__21287;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____21290 = s__21289;
          if(and__3822__auto____21290) {
            return i__21288 < size
          }else {
            return and__3822__auto____21290
          }
        }())) {
          a__21286[i__21288] = cljs.core.first.call(null, s__21289);
          var G__21293 = i__21288 + 1;
          var G__21294 = cljs.core.next.call(null, s__21289);
          i__21288 = G__21293;
          s__21289 = G__21294;
          continue
        }else {
          return a__21286
        }
        break
      }
    }else {
      var n__2527__auto____21291 = size;
      var i__21292 = 0;
      while(true) {
        if(i__21292 < n__2527__auto____21291) {
          a__21286[i__21292] = init_val_or_seq;
          var G__21295 = i__21292 + 1;
          i__21292 = G__21295;
          continue
        }else {
        }
        break
      }
      return a__21286
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
    var a__21303 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__21304 = cljs.core.seq.call(null, init_val_or_seq);
      var i__21305 = 0;
      var s__21306 = s__21304;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____21307 = s__21306;
          if(and__3822__auto____21307) {
            return i__21305 < size
          }else {
            return and__3822__auto____21307
          }
        }())) {
          a__21303[i__21305] = cljs.core.first.call(null, s__21306);
          var G__21310 = i__21305 + 1;
          var G__21311 = cljs.core.next.call(null, s__21306);
          i__21305 = G__21310;
          s__21306 = G__21311;
          continue
        }else {
          return a__21303
        }
        break
      }
    }else {
      var n__2527__auto____21308 = size;
      var i__21309 = 0;
      while(true) {
        if(i__21309 < n__2527__auto____21308) {
          a__21303[i__21309] = init_val_or_seq;
          var G__21312 = i__21309 + 1;
          i__21309 = G__21312;
          continue
        }else {
        }
        break
      }
      return a__21303
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
    var a__21320 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__21321 = cljs.core.seq.call(null, init_val_or_seq);
      var i__21322 = 0;
      var s__21323 = s__21321;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____21324 = s__21323;
          if(and__3822__auto____21324) {
            return i__21322 < size
          }else {
            return and__3822__auto____21324
          }
        }())) {
          a__21320[i__21322] = cljs.core.first.call(null, s__21323);
          var G__21327 = i__21322 + 1;
          var G__21328 = cljs.core.next.call(null, s__21323);
          i__21322 = G__21327;
          s__21323 = G__21328;
          continue
        }else {
          return a__21320
        }
        break
      }
    }else {
      var n__2527__auto____21325 = size;
      var i__21326 = 0;
      while(true) {
        if(i__21326 < n__2527__auto____21325) {
          a__21320[i__21326] = init_val_or_seq;
          var G__21329 = i__21326 + 1;
          i__21326 = G__21329;
          continue
        }else {
        }
        break
      }
      return a__21320
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
    var s__21334 = s;
    var i__21335 = n;
    var sum__21336 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____21337 = i__21335 > 0;
        if(and__3822__auto____21337) {
          return cljs.core.seq.call(null, s__21334)
        }else {
          return and__3822__auto____21337
        }
      }())) {
        var G__21338 = cljs.core.next.call(null, s__21334);
        var G__21339 = i__21335 - 1;
        var G__21340 = sum__21336 + 1;
        s__21334 = G__21338;
        i__21335 = G__21339;
        sum__21336 = G__21340;
        continue
      }else {
        return sum__21336
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
      var s__21345 = cljs.core.seq.call(null, x);
      if(s__21345) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__21345)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__21345), concat.call(null, cljs.core.chunk_rest.call(null, s__21345), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__21345), concat.call(null, cljs.core.rest.call(null, s__21345), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__21349__delegate = function(x, y, zs) {
      var cat__21348 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__21347 = cljs.core.seq.call(null, xys);
          if(xys__21347) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__21347)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__21347), cat.call(null, cljs.core.chunk_rest.call(null, xys__21347), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__21347), cat.call(null, cljs.core.rest.call(null, xys__21347), zs))
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
      return cat__21348.call(null, concat.call(null, x, y), zs)
    };
    var G__21349 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__21349__delegate.call(this, x, y, zs)
    };
    G__21349.cljs$lang$maxFixedArity = 2;
    G__21349.cljs$lang$applyTo = function(arglist__21350) {
      var x = cljs.core.first(arglist__21350);
      var y = cljs.core.first(cljs.core.next(arglist__21350));
      var zs = cljs.core.rest(cljs.core.next(arglist__21350));
      return G__21349__delegate(x, y, zs)
    };
    G__21349.cljs$lang$arity$variadic = G__21349__delegate;
    return G__21349
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
    var G__21351__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__21351 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__21351__delegate.call(this, a, b, c, d, more)
    };
    G__21351.cljs$lang$maxFixedArity = 4;
    G__21351.cljs$lang$applyTo = function(arglist__21352) {
      var a = cljs.core.first(arglist__21352);
      var b = cljs.core.first(cljs.core.next(arglist__21352));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21352)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__21352))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__21352))));
      return G__21351__delegate(a, b, c, d, more)
    };
    G__21351.cljs$lang$arity$variadic = G__21351__delegate;
    return G__21351
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
  var args__21394 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__21395 = cljs.core._first.call(null, args__21394);
    var args__21396 = cljs.core._rest.call(null, args__21394);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__21395)
      }else {
        return f.call(null, a__21395)
      }
    }else {
      var b__21397 = cljs.core._first.call(null, args__21396);
      var args__21398 = cljs.core._rest.call(null, args__21396);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__21395, b__21397)
        }else {
          return f.call(null, a__21395, b__21397)
        }
      }else {
        var c__21399 = cljs.core._first.call(null, args__21398);
        var args__21400 = cljs.core._rest.call(null, args__21398);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__21395, b__21397, c__21399)
          }else {
            return f.call(null, a__21395, b__21397, c__21399)
          }
        }else {
          var d__21401 = cljs.core._first.call(null, args__21400);
          var args__21402 = cljs.core._rest.call(null, args__21400);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__21395, b__21397, c__21399, d__21401)
            }else {
              return f.call(null, a__21395, b__21397, c__21399, d__21401)
            }
          }else {
            var e__21403 = cljs.core._first.call(null, args__21402);
            var args__21404 = cljs.core._rest.call(null, args__21402);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__21395, b__21397, c__21399, d__21401, e__21403)
              }else {
                return f.call(null, a__21395, b__21397, c__21399, d__21401, e__21403)
              }
            }else {
              var f__21405 = cljs.core._first.call(null, args__21404);
              var args__21406 = cljs.core._rest.call(null, args__21404);
              if(argc === 6) {
                if(f__21405.cljs$lang$arity$6) {
                  return f__21405.cljs$lang$arity$6(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405)
                }else {
                  return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405)
                }
              }else {
                var g__21407 = cljs.core._first.call(null, args__21406);
                var args__21408 = cljs.core._rest.call(null, args__21406);
                if(argc === 7) {
                  if(f__21405.cljs$lang$arity$7) {
                    return f__21405.cljs$lang$arity$7(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407)
                  }else {
                    return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407)
                  }
                }else {
                  var h__21409 = cljs.core._first.call(null, args__21408);
                  var args__21410 = cljs.core._rest.call(null, args__21408);
                  if(argc === 8) {
                    if(f__21405.cljs$lang$arity$8) {
                      return f__21405.cljs$lang$arity$8(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409)
                    }else {
                      return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409)
                    }
                  }else {
                    var i__21411 = cljs.core._first.call(null, args__21410);
                    var args__21412 = cljs.core._rest.call(null, args__21410);
                    if(argc === 9) {
                      if(f__21405.cljs$lang$arity$9) {
                        return f__21405.cljs$lang$arity$9(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411)
                      }else {
                        return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411)
                      }
                    }else {
                      var j__21413 = cljs.core._first.call(null, args__21412);
                      var args__21414 = cljs.core._rest.call(null, args__21412);
                      if(argc === 10) {
                        if(f__21405.cljs$lang$arity$10) {
                          return f__21405.cljs$lang$arity$10(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413)
                        }else {
                          return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413)
                        }
                      }else {
                        var k__21415 = cljs.core._first.call(null, args__21414);
                        var args__21416 = cljs.core._rest.call(null, args__21414);
                        if(argc === 11) {
                          if(f__21405.cljs$lang$arity$11) {
                            return f__21405.cljs$lang$arity$11(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415)
                          }else {
                            return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415)
                          }
                        }else {
                          var l__21417 = cljs.core._first.call(null, args__21416);
                          var args__21418 = cljs.core._rest.call(null, args__21416);
                          if(argc === 12) {
                            if(f__21405.cljs$lang$arity$12) {
                              return f__21405.cljs$lang$arity$12(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417)
                            }else {
                              return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417)
                            }
                          }else {
                            var m__21419 = cljs.core._first.call(null, args__21418);
                            var args__21420 = cljs.core._rest.call(null, args__21418);
                            if(argc === 13) {
                              if(f__21405.cljs$lang$arity$13) {
                                return f__21405.cljs$lang$arity$13(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419)
                              }else {
                                return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419)
                              }
                            }else {
                              var n__21421 = cljs.core._first.call(null, args__21420);
                              var args__21422 = cljs.core._rest.call(null, args__21420);
                              if(argc === 14) {
                                if(f__21405.cljs$lang$arity$14) {
                                  return f__21405.cljs$lang$arity$14(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421)
                                }else {
                                  return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421)
                                }
                              }else {
                                var o__21423 = cljs.core._first.call(null, args__21422);
                                var args__21424 = cljs.core._rest.call(null, args__21422);
                                if(argc === 15) {
                                  if(f__21405.cljs$lang$arity$15) {
                                    return f__21405.cljs$lang$arity$15(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421, o__21423)
                                  }else {
                                    return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421, o__21423)
                                  }
                                }else {
                                  var p__21425 = cljs.core._first.call(null, args__21424);
                                  var args__21426 = cljs.core._rest.call(null, args__21424);
                                  if(argc === 16) {
                                    if(f__21405.cljs$lang$arity$16) {
                                      return f__21405.cljs$lang$arity$16(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421, o__21423, p__21425)
                                    }else {
                                      return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421, o__21423, p__21425)
                                    }
                                  }else {
                                    var q__21427 = cljs.core._first.call(null, args__21426);
                                    var args__21428 = cljs.core._rest.call(null, args__21426);
                                    if(argc === 17) {
                                      if(f__21405.cljs$lang$arity$17) {
                                        return f__21405.cljs$lang$arity$17(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421, o__21423, p__21425, q__21427)
                                      }else {
                                        return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421, o__21423, p__21425, q__21427)
                                      }
                                    }else {
                                      var r__21429 = cljs.core._first.call(null, args__21428);
                                      var args__21430 = cljs.core._rest.call(null, args__21428);
                                      if(argc === 18) {
                                        if(f__21405.cljs$lang$arity$18) {
                                          return f__21405.cljs$lang$arity$18(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421, o__21423, p__21425, q__21427, r__21429)
                                        }else {
                                          return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421, o__21423, p__21425, q__21427, r__21429)
                                        }
                                      }else {
                                        var s__21431 = cljs.core._first.call(null, args__21430);
                                        var args__21432 = cljs.core._rest.call(null, args__21430);
                                        if(argc === 19) {
                                          if(f__21405.cljs$lang$arity$19) {
                                            return f__21405.cljs$lang$arity$19(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421, o__21423, p__21425, q__21427, r__21429, s__21431)
                                          }else {
                                            return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421, o__21423, p__21425, q__21427, r__21429, s__21431)
                                          }
                                        }else {
                                          var t__21433 = cljs.core._first.call(null, args__21432);
                                          var args__21434 = cljs.core._rest.call(null, args__21432);
                                          if(argc === 20) {
                                            if(f__21405.cljs$lang$arity$20) {
                                              return f__21405.cljs$lang$arity$20(a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421, o__21423, p__21425, q__21427, r__21429, s__21431, t__21433)
                                            }else {
                                              return f__21405.call(null, a__21395, b__21397, c__21399, d__21401, e__21403, f__21405, g__21407, h__21409, i__21411, j__21413, k__21415, l__21417, m__21419, n__21421, o__21423, p__21425, q__21427, r__21429, s__21431, t__21433)
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
    var fixed_arity__21449 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__21450 = cljs.core.bounded_count.call(null, args, fixed_arity__21449 + 1);
      if(bc__21450 <= fixed_arity__21449) {
        return cljs.core.apply_to.call(null, f, bc__21450, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__21451 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__21452 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__21453 = cljs.core.bounded_count.call(null, arglist__21451, fixed_arity__21452 + 1);
      if(bc__21453 <= fixed_arity__21452) {
        return cljs.core.apply_to.call(null, f, bc__21453, arglist__21451)
      }else {
        return f.cljs$lang$applyTo(arglist__21451)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__21451))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__21454 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__21455 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__21456 = cljs.core.bounded_count.call(null, arglist__21454, fixed_arity__21455 + 1);
      if(bc__21456 <= fixed_arity__21455) {
        return cljs.core.apply_to.call(null, f, bc__21456, arglist__21454)
      }else {
        return f.cljs$lang$applyTo(arglist__21454)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__21454))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__21457 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__21458 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__21459 = cljs.core.bounded_count.call(null, arglist__21457, fixed_arity__21458 + 1);
      if(bc__21459 <= fixed_arity__21458) {
        return cljs.core.apply_to.call(null, f, bc__21459, arglist__21457)
      }else {
        return f.cljs$lang$applyTo(arglist__21457)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__21457))
    }
  };
  var apply__6 = function() {
    var G__21463__delegate = function(f, a, b, c, d, args) {
      var arglist__21460 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__21461 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__21462 = cljs.core.bounded_count.call(null, arglist__21460, fixed_arity__21461 + 1);
        if(bc__21462 <= fixed_arity__21461) {
          return cljs.core.apply_to.call(null, f, bc__21462, arglist__21460)
        }else {
          return f.cljs$lang$applyTo(arglist__21460)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__21460))
      }
    };
    var G__21463 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__21463__delegate.call(this, f, a, b, c, d, args)
    };
    G__21463.cljs$lang$maxFixedArity = 5;
    G__21463.cljs$lang$applyTo = function(arglist__21464) {
      var f = cljs.core.first(arglist__21464);
      var a = cljs.core.first(cljs.core.next(arglist__21464));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21464)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__21464))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__21464)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__21464)))));
      return G__21463__delegate(f, a, b, c, d, args)
    };
    G__21463.cljs$lang$arity$variadic = G__21463__delegate;
    return G__21463
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
  vary_meta.cljs$lang$applyTo = function(arglist__21465) {
    var obj = cljs.core.first(arglist__21465);
    var f = cljs.core.first(cljs.core.next(arglist__21465));
    var args = cljs.core.rest(cljs.core.next(arglist__21465));
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
    var G__21466__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__21466 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__21466__delegate.call(this, x, y, more)
    };
    G__21466.cljs$lang$maxFixedArity = 2;
    G__21466.cljs$lang$applyTo = function(arglist__21467) {
      var x = cljs.core.first(arglist__21467);
      var y = cljs.core.first(cljs.core.next(arglist__21467));
      var more = cljs.core.rest(cljs.core.next(arglist__21467));
      return G__21466__delegate(x, y, more)
    };
    G__21466.cljs$lang$arity$variadic = G__21466__delegate;
    return G__21466
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
        var G__21468 = pred;
        var G__21469 = cljs.core.next.call(null, coll);
        pred = G__21468;
        coll = G__21469;
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
      var or__3824__auto____21471 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____21471)) {
        return or__3824__auto____21471
      }else {
        var G__21472 = pred;
        var G__21473 = cljs.core.next.call(null, coll);
        pred = G__21472;
        coll = G__21473;
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
    var G__21474 = null;
    var G__21474__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__21474__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__21474__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__21474__3 = function() {
      var G__21475__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__21475 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__21475__delegate.call(this, x, y, zs)
      };
      G__21475.cljs$lang$maxFixedArity = 2;
      G__21475.cljs$lang$applyTo = function(arglist__21476) {
        var x = cljs.core.first(arglist__21476);
        var y = cljs.core.first(cljs.core.next(arglist__21476));
        var zs = cljs.core.rest(cljs.core.next(arglist__21476));
        return G__21475__delegate(x, y, zs)
      };
      G__21475.cljs$lang$arity$variadic = G__21475__delegate;
      return G__21475
    }();
    G__21474 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__21474__0.call(this);
        case 1:
          return G__21474__1.call(this, x);
        case 2:
          return G__21474__2.call(this, x, y);
        default:
          return G__21474__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__21474.cljs$lang$maxFixedArity = 2;
    G__21474.cljs$lang$applyTo = G__21474__3.cljs$lang$applyTo;
    return G__21474
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__21477__delegate = function(args) {
      return x
    };
    var G__21477 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__21477__delegate.call(this, args)
    };
    G__21477.cljs$lang$maxFixedArity = 0;
    G__21477.cljs$lang$applyTo = function(arglist__21478) {
      var args = cljs.core.seq(arglist__21478);
      return G__21477__delegate(args)
    };
    G__21477.cljs$lang$arity$variadic = G__21477__delegate;
    return G__21477
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
      var G__21485 = null;
      var G__21485__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__21485__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__21485__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__21485__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__21485__4 = function() {
        var G__21486__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__21486 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__21486__delegate.call(this, x, y, z, args)
        };
        G__21486.cljs$lang$maxFixedArity = 3;
        G__21486.cljs$lang$applyTo = function(arglist__21487) {
          var x = cljs.core.first(arglist__21487);
          var y = cljs.core.first(cljs.core.next(arglist__21487));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21487)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21487)));
          return G__21486__delegate(x, y, z, args)
        };
        G__21486.cljs$lang$arity$variadic = G__21486__delegate;
        return G__21486
      }();
      G__21485 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__21485__0.call(this);
          case 1:
            return G__21485__1.call(this, x);
          case 2:
            return G__21485__2.call(this, x, y);
          case 3:
            return G__21485__3.call(this, x, y, z);
          default:
            return G__21485__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__21485.cljs$lang$maxFixedArity = 3;
      G__21485.cljs$lang$applyTo = G__21485__4.cljs$lang$applyTo;
      return G__21485
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__21488 = null;
      var G__21488__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__21488__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__21488__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__21488__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__21488__4 = function() {
        var G__21489__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__21489 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__21489__delegate.call(this, x, y, z, args)
        };
        G__21489.cljs$lang$maxFixedArity = 3;
        G__21489.cljs$lang$applyTo = function(arglist__21490) {
          var x = cljs.core.first(arglist__21490);
          var y = cljs.core.first(cljs.core.next(arglist__21490));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21490)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21490)));
          return G__21489__delegate(x, y, z, args)
        };
        G__21489.cljs$lang$arity$variadic = G__21489__delegate;
        return G__21489
      }();
      G__21488 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__21488__0.call(this);
          case 1:
            return G__21488__1.call(this, x);
          case 2:
            return G__21488__2.call(this, x, y);
          case 3:
            return G__21488__3.call(this, x, y, z);
          default:
            return G__21488__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__21488.cljs$lang$maxFixedArity = 3;
      G__21488.cljs$lang$applyTo = G__21488__4.cljs$lang$applyTo;
      return G__21488
    }()
  };
  var comp__4 = function() {
    var G__21491__delegate = function(f1, f2, f3, fs) {
      var fs__21482 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__21492__delegate = function(args) {
          var ret__21483 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__21482), args);
          var fs__21484 = cljs.core.next.call(null, fs__21482);
          while(true) {
            if(fs__21484) {
              var G__21493 = cljs.core.first.call(null, fs__21484).call(null, ret__21483);
              var G__21494 = cljs.core.next.call(null, fs__21484);
              ret__21483 = G__21493;
              fs__21484 = G__21494;
              continue
            }else {
              return ret__21483
            }
            break
          }
        };
        var G__21492 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__21492__delegate.call(this, args)
        };
        G__21492.cljs$lang$maxFixedArity = 0;
        G__21492.cljs$lang$applyTo = function(arglist__21495) {
          var args = cljs.core.seq(arglist__21495);
          return G__21492__delegate(args)
        };
        G__21492.cljs$lang$arity$variadic = G__21492__delegate;
        return G__21492
      }()
    };
    var G__21491 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__21491__delegate.call(this, f1, f2, f3, fs)
    };
    G__21491.cljs$lang$maxFixedArity = 3;
    G__21491.cljs$lang$applyTo = function(arglist__21496) {
      var f1 = cljs.core.first(arglist__21496);
      var f2 = cljs.core.first(cljs.core.next(arglist__21496));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21496)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21496)));
      return G__21491__delegate(f1, f2, f3, fs)
    };
    G__21491.cljs$lang$arity$variadic = G__21491__delegate;
    return G__21491
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
      var G__21497__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__21497 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__21497__delegate.call(this, args)
      };
      G__21497.cljs$lang$maxFixedArity = 0;
      G__21497.cljs$lang$applyTo = function(arglist__21498) {
        var args = cljs.core.seq(arglist__21498);
        return G__21497__delegate(args)
      };
      G__21497.cljs$lang$arity$variadic = G__21497__delegate;
      return G__21497
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__21499__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__21499 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__21499__delegate.call(this, args)
      };
      G__21499.cljs$lang$maxFixedArity = 0;
      G__21499.cljs$lang$applyTo = function(arglist__21500) {
        var args = cljs.core.seq(arglist__21500);
        return G__21499__delegate(args)
      };
      G__21499.cljs$lang$arity$variadic = G__21499__delegate;
      return G__21499
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__21501__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__21501 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__21501__delegate.call(this, args)
      };
      G__21501.cljs$lang$maxFixedArity = 0;
      G__21501.cljs$lang$applyTo = function(arglist__21502) {
        var args = cljs.core.seq(arglist__21502);
        return G__21501__delegate(args)
      };
      G__21501.cljs$lang$arity$variadic = G__21501__delegate;
      return G__21501
    }()
  };
  var partial__5 = function() {
    var G__21503__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__21504__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__21504 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__21504__delegate.call(this, args)
        };
        G__21504.cljs$lang$maxFixedArity = 0;
        G__21504.cljs$lang$applyTo = function(arglist__21505) {
          var args = cljs.core.seq(arglist__21505);
          return G__21504__delegate(args)
        };
        G__21504.cljs$lang$arity$variadic = G__21504__delegate;
        return G__21504
      }()
    };
    var G__21503 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__21503__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__21503.cljs$lang$maxFixedArity = 4;
    G__21503.cljs$lang$applyTo = function(arglist__21506) {
      var f = cljs.core.first(arglist__21506);
      var arg1 = cljs.core.first(cljs.core.next(arglist__21506));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21506)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__21506))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__21506))));
      return G__21503__delegate(f, arg1, arg2, arg3, more)
    };
    G__21503.cljs$lang$arity$variadic = G__21503__delegate;
    return G__21503
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
      var G__21507 = null;
      var G__21507__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__21507__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__21507__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__21507__4 = function() {
        var G__21508__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__21508 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__21508__delegate.call(this, a, b, c, ds)
        };
        G__21508.cljs$lang$maxFixedArity = 3;
        G__21508.cljs$lang$applyTo = function(arglist__21509) {
          var a = cljs.core.first(arglist__21509);
          var b = cljs.core.first(cljs.core.next(arglist__21509));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21509)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21509)));
          return G__21508__delegate(a, b, c, ds)
        };
        G__21508.cljs$lang$arity$variadic = G__21508__delegate;
        return G__21508
      }();
      G__21507 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__21507__1.call(this, a);
          case 2:
            return G__21507__2.call(this, a, b);
          case 3:
            return G__21507__3.call(this, a, b, c);
          default:
            return G__21507__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__21507.cljs$lang$maxFixedArity = 3;
      G__21507.cljs$lang$applyTo = G__21507__4.cljs$lang$applyTo;
      return G__21507
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__21510 = null;
      var G__21510__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__21510__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__21510__4 = function() {
        var G__21511__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__21511 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__21511__delegate.call(this, a, b, c, ds)
        };
        G__21511.cljs$lang$maxFixedArity = 3;
        G__21511.cljs$lang$applyTo = function(arglist__21512) {
          var a = cljs.core.first(arglist__21512);
          var b = cljs.core.first(cljs.core.next(arglist__21512));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21512)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21512)));
          return G__21511__delegate(a, b, c, ds)
        };
        G__21511.cljs$lang$arity$variadic = G__21511__delegate;
        return G__21511
      }();
      G__21510 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__21510__2.call(this, a, b);
          case 3:
            return G__21510__3.call(this, a, b, c);
          default:
            return G__21510__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__21510.cljs$lang$maxFixedArity = 3;
      G__21510.cljs$lang$applyTo = G__21510__4.cljs$lang$applyTo;
      return G__21510
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__21513 = null;
      var G__21513__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__21513__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__21513__4 = function() {
        var G__21514__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__21514 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__21514__delegate.call(this, a, b, c, ds)
        };
        G__21514.cljs$lang$maxFixedArity = 3;
        G__21514.cljs$lang$applyTo = function(arglist__21515) {
          var a = cljs.core.first(arglist__21515);
          var b = cljs.core.first(cljs.core.next(arglist__21515));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21515)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21515)));
          return G__21514__delegate(a, b, c, ds)
        };
        G__21514.cljs$lang$arity$variadic = G__21514__delegate;
        return G__21514
      }();
      G__21513 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__21513__2.call(this, a, b);
          case 3:
            return G__21513__3.call(this, a, b, c);
          default:
            return G__21513__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__21513.cljs$lang$maxFixedArity = 3;
      G__21513.cljs$lang$applyTo = G__21513__4.cljs$lang$applyTo;
      return G__21513
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
  var mapi__21531 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____21539 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____21539) {
        var s__21540 = temp__3974__auto____21539;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__21540)) {
          var c__21541 = cljs.core.chunk_first.call(null, s__21540);
          var size__21542 = cljs.core.count.call(null, c__21541);
          var b__21543 = cljs.core.chunk_buffer.call(null, size__21542);
          var n__2527__auto____21544 = size__21542;
          var i__21545 = 0;
          while(true) {
            if(i__21545 < n__2527__auto____21544) {
              cljs.core.chunk_append.call(null, b__21543, f.call(null, idx + i__21545, cljs.core._nth.call(null, c__21541, i__21545)));
              var G__21546 = i__21545 + 1;
              i__21545 = G__21546;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__21543), mapi.call(null, idx + size__21542, cljs.core.chunk_rest.call(null, s__21540)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__21540)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__21540)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__21531.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____21556 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____21556) {
      var s__21557 = temp__3974__auto____21556;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__21557)) {
        var c__21558 = cljs.core.chunk_first.call(null, s__21557);
        var size__21559 = cljs.core.count.call(null, c__21558);
        var b__21560 = cljs.core.chunk_buffer.call(null, size__21559);
        var n__2527__auto____21561 = size__21559;
        var i__21562 = 0;
        while(true) {
          if(i__21562 < n__2527__auto____21561) {
            var x__21563 = f.call(null, cljs.core._nth.call(null, c__21558, i__21562));
            if(x__21563 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__21560, x__21563)
            }
            var G__21565 = i__21562 + 1;
            i__21562 = G__21565;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__21560), keep.call(null, f, cljs.core.chunk_rest.call(null, s__21557)))
      }else {
        var x__21564 = f.call(null, cljs.core.first.call(null, s__21557));
        if(x__21564 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__21557))
        }else {
          return cljs.core.cons.call(null, x__21564, keep.call(null, f, cljs.core.rest.call(null, s__21557)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__21591 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____21601 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____21601) {
        var s__21602 = temp__3974__auto____21601;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__21602)) {
          var c__21603 = cljs.core.chunk_first.call(null, s__21602);
          var size__21604 = cljs.core.count.call(null, c__21603);
          var b__21605 = cljs.core.chunk_buffer.call(null, size__21604);
          var n__2527__auto____21606 = size__21604;
          var i__21607 = 0;
          while(true) {
            if(i__21607 < n__2527__auto____21606) {
              var x__21608 = f.call(null, idx + i__21607, cljs.core._nth.call(null, c__21603, i__21607));
              if(x__21608 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__21605, x__21608)
              }
              var G__21610 = i__21607 + 1;
              i__21607 = G__21610;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__21605), keepi.call(null, idx + size__21604, cljs.core.chunk_rest.call(null, s__21602)))
        }else {
          var x__21609 = f.call(null, idx, cljs.core.first.call(null, s__21602));
          if(x__21609 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__21602))
          }else {
            return cljs.core.cons.call(null, x__21609, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__21602)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__21591.call(null, 0, coll)
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
          var and__3822__auto____21696 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____21696)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____21696
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____21697 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____21697)) {
            var and__3822__auto____21698 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____21698)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____21698
            }
          }else {
            return and__3822__auto____21697
          }
        }())
      };
      var ep1__4 = function() {
        var G__21767__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____21699 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____21699)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____21699
            }
          }())
        };
        var G__21767 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__21767__delegate.call(this, x, y, z, args)
        };
        G__21767.cljs$lang$maxFixedArity = 3;
        G__21767.cljs$lang$applyTo = function(arglist__21768) {
          var x = cljs.core.first(arglist__21768);
          var y = cljs.core.first(cljs.core.next(arglist__21768));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21768)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21768)));
          return G__21767__delegate(x, y, z, args)
        };
        G__21767.cljs$lang$arity$variadic = G__21767__delegate;
        return G__21767
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
          var and__3822__auto____21711 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____21711)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____21711
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____21712 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____21712)) {
            var and__3822__auto____21713 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____21713)) {
              var and__3822__auto____21714 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____21714)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____21714
              }
            }else {
              return and__3822__auto____21713
            }
          }else {
            return and__3822__auto____21712
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____21715 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____21715)) {
            var and__3822__auto____21716 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____21716)) {
              var and__3822__auto____21717 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____21717)) {
                var and__3822__auto____21718 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____21718)) {
                  var and__3822__auto____21719 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____21719)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____21719
                  }
                }else {
                  return and__3822__auto____21718
                }
              }else {
                return and__3822__auto____21717
              }
            }else {
              return and__3822__auto____21716
            }
          }else {
            return and__3822__auto____21715
          }
        }())
      };
      var ep2__4 = function() {
        var G__21769__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____21720 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____21720)) {
              return cljs.core.every_QMARK_.call(null, function(p1__21566_SHARP_) {
                var and__3822__auto____21721 = p1.call(null, p1__21566_SHARP_);
                if(cljs.core.truth_(and__3822__auto____21721)) {
                  return p2.call(null, p1__21566_SHARP_)
                }else {
                  return and__3822__auto____21721
                }
              }, args)
            }else {
              return and__3822__auto____21720
            }
          }())
        };
        var G__21769 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__21769__delegate.call(this, x, y, z, args)
        };
        G__21769.cljs$lang$maxFixedArity = 3;
        G__21769.cljs$lang$applyTo = function(arglist__21770) {
          var x = cljs.core.first(arglist__21770);
          var y = cljs.core.first(cljs.core.next(arglist__21770));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21770)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21770)));
          return G__21769__delegate(x, y, z, args)
        };
        G__21769.cljs$lang$arity$variadic = G__21769__delegate;
        return G__21769
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
          var and__3822__auto____21740 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____21740)) {
            var and__3822__auto____21741 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____21741)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____21741
            }
          }else {
            return and__3822__auto____21740
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____21742 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____21742)) {
            var and__3822__auto____21743 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____21743)) {
              var and__3822__auto____21744 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____21744)) {
                var and__3822__auto____21745 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____21745)) {
                  var and__3822__auto____21746 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____21746)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____21746
                  }
                }else {
                  return and__3822__auto____21745
                }
              }else {
                return and__3822__auto____21744
              }
            }else {
              return and__3822__auto____21743
            }
          }else {
            return and__3822__auto____21742
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____21747 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____21747)) {
            var and__3822__auto____21748 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____21748)) {
              var and__3822__auto____21749 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____21749)) {
                var and__3822__auto____21750 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____21750)) {
                  var and__3822__auto____21751 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____21751)) {
                    var and__3822__auto____21752 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____21752)) {
                      var and__3822__auto____21753 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____21753)) {
                        var and__3822__auto____21754 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____21754)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____21754
                        }
                      }else {
                        return and__3822__auto____21753
                      }
                    }else {
                      return and__3822__auto____21752
                    }
                  }else {
                    return and__3822__auto____21751
                  }
                }else {
                  return and__3822__auto____21750
                }
              }else {
                return and__3822__auto____21749
              }
            }else {
              return and__3822__auto____21748
            }
          }else {
            return and__3822__auto____21747
          }
        }())
      };
      var ep3__4 = function() {
        var G__21771__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____21755 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____21755)) {
              return cljs.core.every_QMARK_.call(null, function(p1__21567_SHARP_) {
                var and__3822__auto____21756 = p1.call(null, p1__21567_SHARP_);
                if(cljs.core.truth_(and__3822__auto____21756)) {
                  var and__3822__auto____21757 = p2.call(null, p1__21567_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____21757)) {
                    return p3.call(null, p1__21567_SHARP_)
                  }else {
                    return and__3822__auto____21757
                  }
                }else {
                  return and__3822__auto____21756
                }
              }, args)
            }else {
              return and__3822__auto____21755
            }
          }())
        };
        var G__21771 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__21771__delegate.call(this, x, y, z, args)
        };
        G__21771.cljs$lang$maxFixedArity = 3;
        G__21771.cljs$lang$applyTo = function(arglist__21772) {
          var x = cljs.core.first(arglist__21772);
          var y = cljs.core.first(cljs.core.next(arglist__21772));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21772)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21772)));
          return G__21771__delegate(x, y, z, args)
        };
        G__21771.cljs$lang$arity$variadic = G__21771__delegate;
        return G__21771
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
    var G__21773__delegate = function(p1, p2, p3, ps) {
      var ps__21758 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__21568_SHARP_) {
            return p1__21568_SHARP_.call(null, x)
          }, ps__21758)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__21569_SHARP_) {
            var and__3822__auto____21763 = p1__21569_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____21763)) {
              return p1__21569_SHARP_.call(null, y)
            }else {
              return and__3822__auto____21763
            }
          }, ps__21758)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__21570_SHARP_) {
            var and__3822__auto____21764 = p1__21570_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____21764)) {
              var and__3822__auto____21765 = p1__21570_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____21765)) {
                return p1__21570_SHARP_.call(null, z)
              }else {
                return and__3822__auto____21765
              }
            }else {
              return and__3822__auto____21764
            }
          }, ps__21758)
        };
        var epn__4 = function() {
          var G__21774__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____21766 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____21766)) {
                return cljs.core.every_QMARK_.call(null, function(p1__21571_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__21571_SHARP_, args)
                }, ps__21758)
              }else {
                return and__3822__auto____21766
              }
            }())
          };
          var G__21774 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__21774__delegate.call(this, x, y, z, args)
          };
          G__21774.cljs$lang$maxFixedArity = 3;
          G__21774.cljs$lang$applyTo = function(arglist__21775) {
            var x = cljs.core.first(arglist__21775);
            var y = cljs.core.first(cljs.core.next(arglist__21775));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21775)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21775)));
            return G__21774__delegate(x, y, z, args)
          };
          G__21774.cljs$lang$arity$variadic = G__21774__delegate;
          return G__21774
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
    var G__21773 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__21773__delegate.call(this, p1, p2, p3, ps)
    };
    G__21773.cljs$lang$maxFixedArity = 3;
    G__21773.cljs$lang$applyTo = function(arglist__21776) {
      var p1 = cljs.core.first(arglist__21776);
      var p2 = cljs.core.first(cljs.core.next(arglist__21776));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21776)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21776)));
      return G__21773__delegate(p1, p2, p3, ps)
    };
    G__21773.cljs$lang$arity$variadic = G__21773__delegate;
    return G__21773
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
        var or__3824__auto____21857 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____21857)) {
          return or__3824__auto____21857
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____21858 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____21858)) {
          return or__3824__auto____21858
        }else {
          var or__3824__auto____21859 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____21859)) {
            return or__3824__auto____21859
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__21928__delegate = function(x, y, z, args) {
          var or__3824__auto____21860 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____21860)) {
            return or__3824__auto____21860
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__21928 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__21928__delegate.call(this, x, y, z, args)
        };
        G__21928.cljs$lang$maxFixedArity = 3;
        G__21928.cljs$lang$applyTo = function(arglist__21929) {
          var x = cljs.core.first(arglist__21929);
          var y = cljs.core.first(cljs.core.next(arglist__21929));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21929)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21929)));
          return G__21928__delegate(x, y, z, args)
        };
        G__21928.cljs$lang$arity$variadic = G__21928__delegate;
        return G__21928
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
        var or__3824__auto____21872 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____21872)) {
          return or__3824__auto____21872
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____21873 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____21873)) {
          return or__3824__auto____21873
        }else {
          var or__3824__auto____21874 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____21874)) {
            return or__3824__auto____21874
          }else {
            var or__3824__auto____21875 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____21875)) {
              return or__3824__auto____21875
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____21876 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____21876)) {
          return or__3824__auto____21876
        }else {
          var or__3824__auto____21877 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____21877)) {
            return or__3824__auto____21877
          }else {
            var or__3824__auto____21878 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____21878)) {
              return or__3824__auto____21878
            }else {
              var or__3824__auto____21879 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____21879)) {
                return or__3824__auto____21879
              }else {
                var or__3824__auto____21880 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____21880)) {
                  return or__3824__auto____21880
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__21930__delegate = function(x, y, z, args) {
          var or__3824__auto____21881 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____21881)) {
            return or__3824__auto____21881
          }else {
            return cljs.core.some.call(null, function(p1__21611_SHARP_) {
              var or__3824__auto____21882 = p1.call(null, p1__21611_SHARP_);
              if(cljs.core.truth_(or__3824__auto____21882)) {
                return or__3824__auto____21882
              }else {
                return p2.call(null, p1__21611_SHARP_)
              }
            }, args)
          }
        };
        var G__21930 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__21930__delegate.call(this, x, y, z, args)
        };
        G__21930.cljs$lang$maxFixedArity = 3;
        G__21930.cljs$lang$applyTo = function(arglist__21931) {
          var x = cljs.core.first(arglist__21931);
          var y = cljs.core.first(cljs.core.next(arglist__21931));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21931)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21931)));
          return G__21930__delegate(x, y, z, args)
        };
        G__21930.cljs$lang$arity$variadic = G__21930__delegate;
        return G__21930
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
        var or__3824__auto____21901 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____21901)) {
          return or__3824__auto____21901
        }else {
          var or__3824__auto____21902 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____21902)) {
            return or__3824__auto____21902
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____21903 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____21903)) {
          return or__3824__auto____21903
        }else {
          var or__3824__auto____21904 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____21904)) {
            return or__3824__auto____21904
          }else {
            var or__3824__auto____21905 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____21905)) {
              return or__3824__auto____21905
            }else {
              var or__3824__auto____21906 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____21906)) {
                return or__3824__auto____21906
              }else {
                var or__3824__auto____21907 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____21907)) {
                  return or__3824__auto____21907
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____21908 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____21908)) {
          return or__3824__auto____21908
        }else {
          var or__3824__auto____21909 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____21909)) {
            return or__3824__auto____21909
          }else {
            var or__3824__auto____21910 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____21910)) {
              return or__3824__auto____21910
            }else {
              var or__3824__auto____21911 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____21911)) {
                return or__3824__auto____21911
              }else {
                var or__3824__auto____21912 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____21912)) {
                  return or__3824__auto____21912
                }else {
                  var or__3824__auto____21913 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____21913)) {
                    return or__3824__auto____21913
                  }else {
                    var or__3824__auto____21914 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____21914)) {
                      return or__3824__auto____21914
                    }else {
                      var or__3824__auto____21915 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____21915)) {
                        return or__3824__auto____21915
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
        var G__21932__delegate = function(x, y, z, args) {
          var or__3824__auto____21916 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____21916)) {
            return or__3824__auto____21916
          }else {
            return cljs.core.some.call(null, function(p1__21612_SHARP_) {
              var or__3824__auto____21917 = p1.call(null, p1__21612_SHARP_);
              if(cljs.core.truth_(or__3824__auto____21917)) {
                return or__3824__auto____21917
              }else {
                var or__3824__auto____21918 = p2.call(null, p1__21612_SHARP_);
                if(cljs.core.truth_(or__3824__auto____21918)) {
                  return or__3824__auto____21918
                }else {
                  return p3.call(null, p1__21612_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__21932 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__21932__delegate.call(this, x, y, z, args)
        };
        G__21932.cljs$lang$maxFixedArity = 3;
        G__21932.cljs$lang$applyTo = function(arglist__21933) {
          var x = cljs.core.first(arglist__21933);
          var y = cljs.core.first(cljs.core.next(arglist__21933));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21933)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21933)));
          return G__21932__delegate(x, y, z, args)
        };
        G__21932.cljs$lang$arity$variadic = G__21932__delegate;
        return G__21932
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
    var G__21934__delegate = function(p1, p2, p3, ps) {
      var ps__21919 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__21613_SHARP_) {
            return p1__21613_SHARP_.call(null, x)
          }, ps__21919)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__21614_SHARP_) {
            var or__3824__auto____21924 = p1__21614_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____21924)) {
              return or__3824__auto____21924
            }else {
              return p1__21614_SHARP_.call(null, y)
            }
          }, ps__21919)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__21615_SHARP_) {
            var or__3824__auto____21925 = p1__21615_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____21925)) {
              return or__3824__auto____21925
            }else {
              var or__3824__auto____21926 = p1__21615_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____21926)) {
                return or__3824__auto____21926
              }else {
                return p1__21615_SHARP_.call(null, z)
              }
            }
          }, ps__21919)
        };
        var spn__4 = function() {
          var G__21935__delegate = function(x, y, z, args) {
            var or__3824__auto____21927 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____21927)) {
              return or__3824__auto____21927
            }else {
              return cljs.core.some.call(null, function(p1__21616_SHARP_) {
                return cljs.core.some.call(null, p1__21616_SHARP_, args)
              }, ps__21919)
            }
          };
          var G__21935 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__21935__delegate.call(this, x, y, z, args)
          };
          G__21935.cljs$lang$maxFixedArity = 3;
          G__21935.cljs$lang$applyTo = function(arglist__21936) {
            var x = cljs.core.first(arglist__21936);
            var y = cljs.core.first(cljs.core.next(arglist__21936));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21936)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21936)));
            return G__21935__delegate(x, y, z, args)
          };
          G__21935.cljs$lang$arity$variadic = G__21935__delegate;
          return G__21935
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
    var G__21934 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__21934__delegate.call(this, p1, p2, p3, ps)
    };
    G__21934.cljs$lang$maxFixedArity = 3;
    G__21934.cljs$lang$applyTo = function(arglist__21937) {
      var p1 = cljs.core.first(arglist__21937);
      var p2 = cljs.core.first(cljs.core.next(arglist__21937));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21937)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__21937)));
      return G__21934__delegate(p1, p2, p3, ps)
    };
    G__21934.cljs$lang$arity$variadic = G__21934__delegate;
    return G__21934
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
      var temp__3974__auto____21956 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____21956) {
        var s__21957 = temp__3974__auto____21956;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__21957)) {
          var c__21958 = cljs.core.chunk_first.call(null, s__21957);
          var size__21959 = cljs.core.count.call(null, c__21958);
          var b__21960 = cljs.core.chunk_buffer.call(null, size__21959);
          var n__2527__auto____21961 = size__21959;
          var i__21962 = 0;
          while(true) {
            if(i__21962 < n__2527__auto____21961) {
              cljs.core.chunk_append.call(null, b__21960, f.call(null, cljs.core._nth.call(null, c__21958, i__21962)));
              var G__21974 = i__21962 + 1;
              i__21962 = G__21974;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__21960), map.call(null, f, cljs.core.chunk_rest.call(null, s__21957)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__21957)), map.call(null, f, cljs.core.rest.call(null, s__21957)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__21963 = cljs.core.seq.call(null, c1);
      var s2__21964 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____21965 = s1__21963;
        if(and__3822__auto____21965) {
          return s2__21964
        }else {
          return and__3822__auto____21965
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__21963), cljs.core.first.call(null, s2__21964)), map.call(null, f, cljs.core.rest.call(null, s1__21963), cljs.core.rest.call(null, s2__21964)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__21966 = cljs.core.seq.call(null, c1);
      var s2__21967 = cljs.core.seq.call(null, c2);
      var s3__21968 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____21969 = s1__21966;
        if(and__3822__auto____21969) {
          var and__3822__auto____21970 = s2__21967;
          if(and__3822__auto____21970) {
            return s3__21968
          }else {
            return and__3822__auto____21970
          }
        }else {
          return and__3822__auto____21969
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__21966), cljs.core.first.call(null, s2__21967), cljs.core.first.call(null, s3__21968)), map.call(null, f, cljs.core.rest.call(null, s1__21966), cljs.core.rest.call(null, s2__21967), cljs.core.rest.call(null, s3__21968)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__21975__delegate = function(f, c1, c2, c3, colls) {
      var step__21973 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__21972 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__21972)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__21972), step.call(null, map.call(null, cljs.core.rest, ss__21972)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__21777_SHARP_) {
        return cljs.core.apply.call(null, f, p1__21777_SHARP_)
      }, step__21973.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__21975 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__21975__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__21975.cljs$lang$maxFixedArity = 4;
    G__21975.cljs$lang$applyTo = function(arglist__21976) {
      var f = cljs.core.first(arglist__21976);
      var c1 = cljs.core.first(cljs.core.next(arglist__21976));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__21976)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__21976))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__21976))));
      return G__21975__delegate(f, c1, c2, c3, colls)
    };
    G__21975.cljs$lang$arity$variadic = G__21975__delegate;
    return G__21975
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
      var temp__3974__auto____21979 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____21979) {
        var s__21980 = temp__3974__auto____21979;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__21980), take.call(null, n - 1, cljs.core.rest.call(null, s__21980)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__21986 = function(n, coll) {
    while(true) {
      var s__21984 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____21985 = n > 0;
        if(and__3822__auto____21985) {
          return s__21984
        }else {
          return and__3822__auto____21985
        }
      }())) {
        var G__21987 = n - 1;
        var G__21988 = cljs.core.rest.call(null, s__21984);
        n = G__21987;
        coll = G__21988;
        continue
      }else {
        return s__21984
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__21986.call(null, n, coll)
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
  var s__21991 = cljs.core.seq.call(null, coll);
  var lead__21992 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__21992) {
      var G__21993 = cljs.core.next.call(null, s__21991);
      var G__21994 = cljs.core.next.call(null, lead__21992);
      s__21991 = G__21993;
      lead__21992 = G__21994;
      continue
    }else {
      return s__21991
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__22000 = function(pred, coll) {
    while(true) {
      var s__21998 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____21999 = s__21998;
        if(and__3822__auto____21999) {
          return pred.call(null, cljs.core.first.call(null, s__21998))
        }else {
          return and__3822__auto____21999
        }
      }())) {
        var G__22001 = pred;
        var G__22002 = cljs.core.rest.call(null, s__21998);
        pred = G__22001;
        coll = G__22002;
        continue
      }else {
        return s__21998
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__22000.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____22005 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____22005) {
      var s__22006 = temp__3974__auto____22005;
      return cljs.core.concat.call(null, s__22006, cycle.call(null, s__22006))
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
      var s1__22011 = cljs.core.seq.call(null, c1);
      var s2__22012 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____22013 = s1__22011;
        if(and__3822__auto____22013) {
          return s2__22012
        }else {
          return and__3822__auto____22013
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__22011), cljs.core.cons.call(null, cljs.core.first.call(null, s2__22012), interleave.call(null, cljs.core.rest.call(null, s1__22011), cljs.core.rest.call(null, s2__22012))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__22015__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__22014 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__22014)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__22014), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__22014)))
        }else {
          return null
        }
      }, null)
    };
    var G__22015 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__22015__delegate.call(this, c1, c2, colls)
    };
    G__22015.cljs$lang$maxFixedArity = 2;
    G__22015.cljs$lang$applyTo = function(arglist__22016) {
      var c1 = cljs.core.first(arglist__22016);
      var c2 = cljs.core.first(cljs.core.next(arglist__22016));
      var colls = cljs.core.rest(cljs.core.next(arglist__22016));
      return G__22015__delegate(c1, c2, colls)
    };
    G__22015.cljs$lang$arity$variadic = G__22015__delegate;
    return G__22015
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
  var cat__22026 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____22024 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____22024) {
        var coll__22025 = temp__3971__auto____22024;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__22025), cat.call(null, cljs.core.rest.call(null, coll__22025), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__22026.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__22027__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__22027 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__22027__delegate.call(this, f, coll, colls)
    };
    G__22027.cljs$lang$maxFixedArity = 2;
    G__22027.cljs$lang$applyTo = function(arglist__22028) {
      var f = cljs.core.first(arglist__22028);
      var coll = cljs.core.first(cljs.core.next(arglist__22028));
      var colls = cljs.core.rest(cljs.core.next(arglist__22028));
      return G__22027__delegate(f, coll, colls)
    };
    G__22027.cljs$lang$arity$variadic = G__22027__delegate;
    return G__22027
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
    var temp__3974__auto____22038 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____22038) {
      var s__22039 = temp__3974__auto____22038;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__22039)) {
        var c__22040 = cljs.core.chunk_first.call(null, s__22039);
        var size__22041 = cljs.core.count.call(null, c__22040);
        var b__22042 = cljs.core.chunk_buffer.call(null, size__22041);
        var n__2527__auto____22043 = size__22041;
        var i__22044 = 0;
        while(true) {
          if(i__22044 < n__2527__auto____22043) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__22040, i__22044)))) {
              cljs.core.chunk_append.call(null, b__22042, cljs.core._nth.call(null, c__22040, i__22044))
            }else {
            }
            var G__22047 = i__22044 + 1;
            i__22044 = G__22047;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__22042), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__22039)))
      }else {
        var f__22045 = cljs.core.first.call(null, s__22039);
        var r__22046 = cljs.core.rest.call(null, s__22039);
        if(cljs.core.truth_(pred.call(null, f__22045))) {
          return cljs.core.cons.call(null, f__22045, filter.call(null, pred, r__22046))
        }else {
          return filter.call(null, pred, r__22046)
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
  var walk__22050 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__22050.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__22048_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__22048_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__22054__22055 = to;
    if(G__22054__22055) {
      if(function() {
        var or__3824__auto____22056 = G__22054__22055.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____22056) {
          return or__3824__auto____22056
        }else {
          return G__22054__22055.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__22054__22055.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__22054__22055)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__22054__22055)
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
    var G__22057__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__22057 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__22057__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__22057.cljs$lang$maxFixedArity = 4;
    G__22057.cljs$lang$applyTo = function(arglist__22058) {
      var f = cljs.core.first(arglist__22058);
      var c1 = cljs.core.first(cljs.core.next(arglist__22058));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__22058)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__22058))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__22058))));
      return G__22057__delegate(f, c1, c2, c3, colls)
    };
    G__22057.cljs$lang$arity$variadic = G__22057__delegate;
    return G__22057
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
      var temp__3974__auto____22065 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____22065) {
        var s__22066 = temp__3974__auto____22065;
        var p__22067 = cljs.core.take.call(null, n, s__22066);
        if(n === cljs.core.count.call(null, p__22067)) {
          return cljs.core.cons.call(null, p__22067, partition.call(null, n, step, cljs.core.drop.call(null, step, s__22066)))
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
      var temp__3974__auto____22068 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____22068) {
        var s__22069 = temp__3974__auto____22068;
        var p__22070 = cljs.core.take.call(null, n, s__22069);
        if(n === cljs.core.count.call(null, p__22070)) {
          return cljs.core.cons.call(null, p__22070, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__22069)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__22070, pad)))
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
    var sentinel__22075 = cljs.core.lookup_sentinel;
    var m__22076 = m;
    var ks__22077 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__22077) {
        var m__22078 = cljs.core._lookup.call(null, m__22076, cljs.core.first.call(null, ks__22077), sentinel__22075);
        if(sentinel__22075 === m__22078) {
          return not_found
        }else {
          var G__22079 = sentinel__22075;
          var G__22080 = m__22078;
          var G__22081 = cljs.core.next.call(null, ks__22077);
          sentinel__22075 = G__22079;
          m__22076 = G__22080;
          ks__22077 = G__22081;
          continue
        }
      }else {
        return m__22076
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
cljs.core.assoc_in = function assoc_in(m, p__22082, v) {
  var vec__22087__22088 = p__22082;
  var k__22089 = cljs.core.nth.call(null, vec__22087__22088, 0, null);
  var ks__22090 = cljs.core.nthnext.call(null, vec__22087__22088, 1);
  if(cljs.core.truth_(ks__22090)) {
    return cljs.core.assoc.call(null, m, k__22089, assoc_in.call(null, cljs.core._lookup.call(null, m, k__22089, null), ks__22090, v))
  }else {
    return cljs.core.assoc.call(null, m, k__22089, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__22091, f, args) {
    var vec__22096__22097 = p__22091;
    var k__22098 = cljs.core.nth.call(null, vec__22096__22097, 0, null);
    var ks__22099 = cljs.core.nthnext.call(null, vec__22096__22097, 1);
    if(cljs.core.truth_(ks__22099)) {
      return cljs.core.assoc.call(null, m, k__22098, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__22098, null), ks__22099, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__22098, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__22098, null), args))
    }
  };
  var update_in = function(m, p__22091, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__22091, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__22100) {
    var m = cljs.core.first(arglist__22100);
    var p__22091 = cljs.core.first(cljs.core.next(arglist__22100));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__22100)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__22100)));
    return update_in__delegate(m, p__22091, f, args)
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
  var this__22103 = this;
  var h__2192__auto____22104 = this__22103.__hash;
  if(!(h__2192__auto____22104 == null)) {
    return h__2192__auto____22104
  }else {
    var h__2192__auto____22105 = cljs.core.hash_coll.call(null, coll);
    this__22103.__hash = h__2192__auto____22105;
    return h__2192__auto____22105
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__22106 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__22107 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__22108 = this;
  var new_array__22109 = this__22108.array.slice();
  new_array__22109[k] = v;
  return new cljs.core.Vector(this__22108.meta, new_array__22109, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__22140 = null;
  var G__22140__2 = function(this_sym22110, k) {
    var this__22112 = this;
    var this_sym22110__22113 = this;
    var coll__22114 = this_sym22110__22113;
    return coll__22114.cljs$core$ILookup$_lookup$arity$2(coll__22114, k)
  };
  var G__22140__3 = function(this_sym22111, k, not_found) {
    var this__22112 = this;
    var this_sym22111__22115 = this;
    var coll__22116 = this_sym22111__22115;
    return coll__22116.cljs$core$ILookup$_lookup$arity$3(coll__22116, k, not_found)
  };
  G__22140 = function(this_sym22111, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__22140__2.call(this, this_sym22111, k);
      case 3:
        return G__22140__3.call(this, this_sym22111, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__22140
}();
cljs.core.Vector.prototype.apply = function(this_sym22101, args22102) {
  var this__22117 = this;
  return this_sym22101.call.apply(this_sym22101, [this_sym22101].concat(args22102.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__22118 = this;
  var new_array__22119 = this__22118.array.slice();
  new_array__22119.push(o);
  return new cljs.core.Vector(this__22118.meta, new_array__22119, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__22120 = this;
  var this__22121 = this;
  return cljs.core.pr_str.call(null, this__22121)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__22122 = this;
  return cljs.core.ci_reduce.call(null, this__22122.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__22123 = this;
  return cljs.core.ci_reduce.call(null, this__22123.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__22124 = this;
  if(this__22124.array.length > 0) {
    var vector_seq__22125 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__22124.array.length) {
          return cljs.core.cons.call(null, this__22124.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__22125.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__22126 = this;
  return this__22126.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__22127 = this;
  var count__22128 = this__22127.array.length;
  if(count__22128 > 0) {
    return this__22127.array[count__22128 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__22129 = this;
  if(this__22129.array.length > 0) {
    var new_array__22130 = this__22129.array.slice();
    new_array__22130.pop();
    return new cljs.core.Vector(this__22129.meta, new_array__22130, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__22131 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__22132 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__22133 = this;
  return new cljs.core.Vector(meta, this__22133.array, this__22133.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__22134 = this;
  return this__22134.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__22135 = this;
  if(function() {
    var and__3822__auto____22136 = 0 <= n;
    if(and__3822__auto____22136) {
      return n < this__22135.array.length
    }else {
      return and__3822__auto____22136
    }
  }()) {
    return this__22135.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__22137 = this;
  if(function() {
    var and__3822__auto____22138 = 0 <= n;
    if(and__3822__auto____22138) {
      return n < this__22137.array.length
    }else {
      return and__3822__auto____22138
    }
  }()) {
    return this__22137.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__22139 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__22139.meta)
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
  var cnt__22142 = pv.cnt;
  if(cnt__22142 < 32) {
    return 0
  }else {
    return cnt__22142 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__22148 = level;
  var ret__22149 = node;
  while(true) {
    if(ll__22148 === 0) {
      return ret__22149
    }else {
      var embed__22150 = ret__22149;
      var r__22151 = cljs.core.pv_fresh_node.call(null, edit);
      var ___22152 = cljs.core.pv_aset.call(null, r__22151, 0, embed__22150);
      var G__22153 = ll__22148 - 5;
      var G__22154 = r__22151;
      ll__22148 = G__22153;
      ret__22149 = G__22154;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__22160 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__22161 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__22160, subidx__22161, tailnode);
    return ret__22160
  }else {
    var child__22162 = cljs.core.pv_aget.call(null, parent, subidx__22161);
    if(!(child__22162 == null)) {
      var node_to_insert__22163 = push_tail.call(null, pv, level - 5, child__22162, tailnode);
      cljs.core.pv_aset.call(null, ret__22160, subidx__22161, node_to_insert__22163);
      return ret__22160
    }else {
      var node_to_insert__22164 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__22160, subidx__22161, node_to_insert__22164);
      return ret__22160
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____22168 = 0 <= i;
    if(and__3822__auto____22168) {
      return i < pv.cnt
    }else {
      return and__3822__auto____22168
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__22169 = pv.root;
      var level__22170 = pv.shift;
      while(true) {
        if(level__22170 > 0) {
          var G__22171 = cljs.core.pv_aget.call(null, node__22169, i >>> level__22170 & 31);
          var G__22172 = level__22170 - 5;
          node__22169 = G__22171;
          level__22170 = G__22172;
          continue
        }else {
          return node__22169.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__22175 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__22175, i & 31, val);
    return ret__22175
  }else {
    var subidx__22176 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__22175, subidx__22176, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__22176), i, val));
    return ret__22175
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__22182 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__22183 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__22182));
    if(function() {
      var and__3822__auto____22184 = new_child__22183 == null;
      if(and__3822__auto____22184) {
        return subidx__22182 === 0
      }else {
        return and__3822__auto____22184
      }
    }()) {
      return null
    }else {
      var ret__22185 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__22185, subidx__22182, new_child__22183);
      return ret__22185
    }
  }else {
    if(subidx__22182 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__22186 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__22186, subidx__22182, null);
        return ret__22186
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
  var this__22189 = this;
  return new cljs.core.TransientVector(this__22189.cnt, this__22189.shift, cljs.core.tv_editable_root.call(null, this__22189.root), cljs.core.tv_editable_tail.call(null, this__22189.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__22190 = this;
  var h__2192__auto____22191 = this__22190.__hash;
  if(!(h__2192__auto____22191 == null)) {
    return h__2192__auto____22191
  }else {
    var h__2192__auto____22192 = cljs.core.hash_coll.call(null, coll);
    this__22190.__hash = h__2192__auto____22192;
    return h__2192__auto____22192
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__22193 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__22194 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__22195 = this;
  if(function() {
    var and__3822__auto____22196 = 0 <= k;
    if(and__3822__auto____22196) {
      return k < this__22195.cnt
    }else {
      return and__3822__auto____22196
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__22197 = this__22195.tail.slice();
      new_tail__22197[k & 31] = v;
      return new cljs.core.PersistentVector(this__22195.meta, this__22195.cnt, this__22195.shift, this__22195.root, new_tail__22197, null)
    }else {
      return new cljs.core.PersistentVector(this__22195.meta, this__22195.cnt, this__22195.shift, cljs.core.do_assoc.call(null, coll, this__22195.shift, this__22195.root, k, v), this__22195.tail, null)
    }
  }else {
    if(k === this__22195.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__22195.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__22245 = null;
  var G__22245__2 = function(this_sym22198, k) {
    var this__22200 = this;
    var this_sym22198__22201 = this;
    var coll__22202 = this_sym22198__22201;
    return coll__22202.cljs$core$ILookup$_lookup$arity$2(coll__22202, k)
  };
  var G__22245__3 = function(this_sym22199, k, not_found) {
    var this__22200 = this;
    var this_sym22199__22203 = this;
    var coll__22204 = this_sym22199__22203;
    return coll__22204.cljs$core$ILookup$_lookup$arity$3(coll__22204, k, not_found)
  };
  G__22245 = function(this_sym22199, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__22245__2.call(this, this_sym22199, k);
      case 3:
        return G__22245__3.call(this, this_sym22199, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__22245
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym22187, args22188) {
  var this__22205 = this;
  return this_sym22187.call.apply(this_sym22187, [this_sym22187].concat(args22188.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__22206 = this;
  var step_init__22207 = [0, init];
  var i__22208 = 0;
  while(true) {
    if(i__22208 < this__22206.cnt) {
      var arr__22209 = cljs.core.array_for.call(null, v, i__22208);
      var len__22210 = arr__22209.length;
      var init__22214 = function() {
        var j__22211 = 0;
        var init__22212 = step_init__22207[1];
        while(true) {
          if(j__22211 < len__22210) {
            var init__22213 = f.call(null, init__22212, j__22211 + i__22208, arr__22209[j__22211]);
            if(cljs.core.reduced_QMARK_.call(null, init__22213)) {
              return init__22213
            }else {
              var G__22246 = j__22211 + 1;
              var G__22247 = init__22213;
              j__22211 = G__22246;
              init__22212 = G__22247;
              continue
            }
          }else {
            step_init__22207[0] = len__22210;
            step_init__22207[1] = init__22212;
            return init__22212
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__22214)) {
        return cljs.core.deref.call(null, init__22214)
      }else {
        var G__22248 = i__22208 + step_init__22207[0];
        i__22208 = G__22248;
        continue
      }
    }else {
      return step_init__22207[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__22215 = this;
  if(this__22215.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__22216 = this__22215.tail.slice();
    new_tail__22216.push(o);
    return new cljs.core.PersistentVector(this__22215.meta, this__22215.cnt + 1, this__22215.shift, this__22215.root, new_tail__22216, null)
  }else {
    var root_overflow_QMARK___22217 = this__22215.cnt >>> 5 > 1 << this__22215.shift;
    var new_shift__22218 = root_overflow_QMARK___22217 ? this__22215.shift + 5 : this__22215.shift;
    var new_root__22220 = root_overflow_QMARK___22217 ? function() {
      var n_r__22219 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__22219, 0, this__22215.root);
      cljs.core.pv_aset.call(null, n_r__22219, 1, cljs.core.new_path.call(null, null, this__22215.shift, new cljs.core.VectorNode(null, this__22215.tail)));
      return n_r__22219
    }() : cljs.core.push_tail.call(null, coll, this__22215.shift, this__22215.root, new cljs.core.VectorNode(null, this__22215.tail));
    return new cljs.core.PersistentVector(this__22215.meta, this__22215.cnt + 1, new_shift__22218, new_root__22220, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__22221 = this;
  if(this__22221.cnt > 0) {
    return new cljs.core.RSeq(coll, this__22221.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__22222 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__22223 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__22224 = this;
  var this__22225 = this;
  return cljs.core.pr_str.call(null, this__22225)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__22226 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__22227 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__22228 = this;
  if(this__22228.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__22229 = this;
  return this__22229.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__22230 = this;
  if(this__22230.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__22230.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__22231 = this;
  if(this__22231.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__22231.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__22231.meta)
    }else {
      if(1 < this__22231.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__22231.meta, this__22231.cnt - 1, this__22231.shift, this__22231.root, this__22231.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__22232 = cljs.core.array_for.call(null, coll, this__22231.cnt - 2);
          var nr__22233 = cljs.core.pop_tail.call(null, coll, this__22231.shift, this__22231.root);
          var new_root__22234 = nr__22233 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__22233;
          var cnt_1__22235 = this__22231.cnt - 1;
          if(function() {
            var and__3822__auto____22236 = 5 < this__22231.shift;
            if(and__3822__auto____22236) {
              return cljs.core.pv_aget.call(null, new_root__22234, 1) == null
            }else {
              return and__3822__auto____22236
            }
          }()) {
            return new cljs.core.PersistentVector(this__22231.meta, cnt_1__22235, this__22231.shift - 5, cljs.core.pv_aget.call(null, new_root__22234, 0), new_tail__22232, null)
          }else {
            return new cljs.core.PersistentVector(this__22231.meta, cnt_1__22235, this__22231.shift, new_root__22234, new_tail__22232, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__22237 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__22238 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__22239 = this;
  return new cljs.core.PersistentVector(meta, this__22239.cnt, this__22239.shift, this__22239.root, this__22239.tail, this__22239.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__22240 = this;
  return this__22240.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__22241 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__22242 = this;
  if(function() {
    var and__3822__auto____22243 = 0 <= n;
    if(and__3822__auto____22243) {
      return n < this__22242.cnt
    }else {
      return and__3822__auto____22243
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__22244 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__22244.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__22249 = xs.length;
  var xs__22250 = no_clone === true ? xs : xs.slice();
  if(l__22249 < 32) {
    return new cljs.core.PersistentVector(null, l__22249, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__22250, null)
  }else {
    var node__22251 = xs__22250.slice(0, 32);
    var v__22252 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__22251, null);
    var i__22253 = 32;
    var out__22254 = cljs.core._as_transient.call(null, v__22252);
    while(true) {
      if(i__22253 < l__22249) {
        var G__22255 = i__22253 + 1;
        var G__22256 = cljs.core.conj_BANG_.call(null, out__22254, xs__22250[i__22253]);
        i__22253 = G__22255;
        out__22254 = G__22256;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__22254)
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
  vector.cljs$lang$applyTo = function(arglist__22257) {
    var args = cljs.core.seq(arglist__22257);
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
  var this__22258 = this;
  if(this__22258.off + 1 < this__22258.node.length) {
    var s__22259 = cljs.core.chunked_seq.call(null, this__22258.vec, this__22258.node, this__22258.i, this__22258.off + 1);
    if(s__22259 == null) {
      return null
    }else {
      return s__22259
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__22260 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__22261 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__22262 = this;
  return this__22262.node[this__22262.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__22263 = this;
  if(this__22263.off + 1 < this__22263.node.length) {
    var s__22264 = cljs.core.chunked_seq.call(null, this__22263.vec, this__22263.node, this__22263.i, this__22263.off + 1);
    if(s__22264 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__22264
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__22265 = this;
  var l__22266 = this__22265.node.length;
  var s__22267 = this__22265.i + l__22266 < cljs.core._count.call(null, this__22265.vec) ? cljs.core.chunked_seq.call(null, this__22265.vec, this__22265.i + l__22266, 0) : null;
  if(s__22267 == null) {
    return null
  }else {
    return s__22267
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__22268 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__22269 = this;
  return cljs.core.chunked_seq.call(null, this__22269.vec, this__22269.node, this__22269.i, this__22269.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__22270 = this;
  return this__22270.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__22271 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__22271.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__22272 = this;
  return cljs.core.array_chunk.call(null, this__22272.node, this__22272.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__22273 = this;
  var l__22274 = this__22273.node.length;
  var s__22275 = this__22273.i + l__22274 < cljs.core._count.call(null, this__22273.vec) ? cljs.core.chunked_seq.call(null, this__22273.vec, this__22273.i + l__22274, 0) : null;
  if(s__22275 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__22275
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
  var this__22278 = this;
  var h__2192__auto____22279 = this__22278.__hash;
  if(!(h__2192__auto____22279 == null)) {
    return h__2192__auto____22279
  }else {
    var h__2192__auto____22280 = cljs.core.hash_coll.call(null, coll);
    this__22278.__hash = h__2192__auto____22280;
    return h__2192__auto____22280
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__22281 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__22282 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__22283 = this;
  var v_pos__22284 = this__22283.start + key;
  return new cljs.core.Subvec(this__22283.meta, cljs.core._assoc.call(null, this__22283.v, v_pos__22284, val), this__22283.start, this__22283.end > v_pos__22284 + 1 ? this__22283.end : v_pos__22284 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__22310 = null;
  var G__22310__2 = function(this_sym22285, k) {
    var this__22287 = this;
    var this_sym22285__22288 = this;
    var coll__22289 = this_sym22285__22288;
    return coll__22289.cljs$core$ILookup$_lookup$arity$2(coll__22289, k)
  };
  var G__22310__3 = function(this_sym22286, k, not_found) {
    var this__22287 = this;
    var this_sym22286__22290 = this;
    var coll__22291 = this_sym22286__22290;
    return coll__22291.cljs$core$ILookup$_lookup$arity$3(coll__22291, k, not_found)
  };
  G__22310 = function(this_sym22286, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__22310__2.call(this, this_sym22286, k);
      case 3:
        return G__22310__3.call(this, this_sym22286, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__22310
}();
cljs.core.Subvec.prototype.apply = function(this_sym22276, args22277) {
  var this__22292 = this;
  return this_sym22276.call.apply(this_sym22276, [this_sym22276].concat(args22277.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__22293 = this;
  return new cljs.core.Subvec(this__22293.meta, cljs.core._assoc_n.call(null, this__22293.v, this__22293.end, o), this__22293.start, this__22293.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__22294 = this;
  var this__22295 = this;
  return cljs.core.pr_str.call(null, this__22295)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__22296 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__22297 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__22298 = this;
  var subvec_seq__22299 = function subvec_seq(i) {
    if(i === this__22298.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__22298.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__22299.call(null, this__22298.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__22300 = this;
  return this__22300.end - this__22300.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__22301 = this;
  return cljs.core._nth.call(null, this__22301.v, this__22301.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__22302 = this;
  if(this__22302.start === this__22302.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__22302.meta, this__22302.v, this__22302.start, this__22302.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__22303 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__22304 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__22305 = this;
  return new cljs.core.Subvec(meta, this__22305.v, this__22305.start, this__22305.end, this__22305.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__22306 = this;
  return this__22306.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__22307 = this;
  return cljs.core._nth.call(null, this__22307.v, this__22307.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__22308 = this;
  return cljs.core._nth.call(null, this__22308.v, this__22308.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__22309 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__22309.meta)
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
  var ret__22312 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__22312, 0, tl.length);
  return ret__22312
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__22316 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__22317 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__22316, subidx__22317, level === 5 ? tail_node : function() {
    var child__22318 = cljs.core.pv_aget.call(null, ret__22316, subidx__22317);
    if(!(child__22318 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__22318, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__22316
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__22323 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__22324 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__22325 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__22323, subidx__22324));
    if(function() {
      var and__3822__auto____22326 = new_child__22325 == null;
      if(and__3822__auto____22326) {
        return subidx__22324 === 0
      }else {
        return and__3822__auto____22326
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__22323, subidx__22324, new_child__22325);
      return node__22323
    }
  }else {
    if(subidx__22324 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__22323, subidx__22324, null);
        return node__22323
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____22331 = 0 <= i;
    if(and__3822__auto____22331) {
      return i < tv.cnt
    }else {
      return and__3822__auto____22331
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__22332 = tv.root;
      var node__22333 = root__22332;
      var level__22334 = tv.shift;
      while(true) {
        if(level__22334 > 0) {
          var G__22335 = cljs.core.tv_ensure_editable.call(null, root__22332.edit, cljs.core.pv_aget.call(null, node__22333, i >>> level__22334 & 31));
          var G__22336 = level__22334 - 5;
          node__22333 = G__22335;
          level__22334 = G__22336;
          continue
        }else {
          return node__22333.arr
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
  var G__22376 = null;
  var G__22376__2 = function(this_sym22339, k) {
    var this__22341 = this;
    var this_sym22339__22342 = this;
    var coll__22343 = this_sym22339__22342;
    return coll__22343.cljs$core$ILookup$_lookup$arity$2(coll__22343, k)
  };
  var G__22376__3 = function(this_sym22340, k, not_found) {
    var this__22341 = this;
    var this_sym22340__22344 = this;
    var coll__22345 = this_sym22340__22344;
    return coll__22345.cljs$core$ILookup$_lookup$arity$3(coll__22345, k, not_found)
  };
  G__22376 = function(this_sym22340, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__22376__2.call(this, this_sym22340, k);
      case 3:
        return G__22376__3.call(this, this_sym22340, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__22376
}();
cljs.core.TransientVector.prototype.apply = function(this_sym22337, args22338) {
  var this__22346 = this;
  return this_sym22337.call.apply(this_sym22337, [this_sym22337].concat(args22338.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__22347 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__22348 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__22349 = this;
  if(this__22349.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__22350 = this;
  if(function() {
    var and__3822__auto____22351 = 0 <= n;
    if(and__3822__auto____22351) {
      return n < this__22350.cnt
    }else {
      return and__3822__auto____22351
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__22352 = this;
  if(this__22352.root.edit) {
    return this__22352.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__22353 = this;
  if(this__22353.root.edit) {
    if(function() {
      var and__3822__auto____22354 = 0 <= n;
      if(and__3822__auto____22354) {
        return n < this__22353.cnt
      }else {
        return and__3822__auto____22354
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__22353.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__22359 = function go(level, node) {
          var node__22357 = cljs.core.tv_ensure_editable.call(null, this__22353.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__22357, n & 31, val);
            return node__22357
          }else {
            var subidx__22358 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__22357, subidx__22358, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__22357, subidx__22358)));
            return node__22357
          }
        }.call(null, this__22353.shift, this__22353.root);
        this__22353.root = new_root__22359;
        return tcoll
      }
    }else {
      if(n === this__22353.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__22353.cnt)].join(""));
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
  var this__22360 = this;
  if(this__22360.root.edit) {
    if(this__22360.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__22360.cnt) {
        this__22360.cnt = 0;
        return tcoll
      }else {
        if((this__22360.cnt - 1 & 31) > 0) {
          this__22360.cnt = this__22360.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__22361 = cljs.core.editable_array_for.call(null, tcoll, this__22360.cnt - 2);
            var new_root__22363 = function() {
              var nr__22362 = cljs.core.tv_pop_tail.call(null, tcoll, this__22360.shift, this__22360.root);
              if(!(nr__22362 == null)) {
                return nr__22362
              }else {
                return new cljs.core.VectorNode(this__22360.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____22364 = 5 < this__22360.shift;
              if(and__3822__auto____22364) {
                return cljs.core.pv_aget.call(null, new_root__22363, 1) == null
              }else {
                return and__3822__auto____22364
              }
            }()) {
              var new_root__22365 = cljs.core.tv_ensure_editable.call(null, this__22360.root.edit, cljs.core.pv_aget.call(null, new_root__22363, 0));
              this__22360.root = new_root__22365;
              this__22360.shift = this__22360.shift - 5;
              this__22360.cnt = this__22360.cnt - 1;
              this__22360.tail = new_tail__22361;
              return tcoll
            }else {
              this__22360.root = new_root__22363;
              this__22360.cnt = this__22360.cnt - 1;
              this__22360.tail = new_tail__22361;
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
  var this__22366 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__22367 = this;
  if(this__22367.root.edit) {
    if(this__22367.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__22367.tail[this__22367.cnt & 31] = o;
      this__22367.cnt = this__22367.cnt + 1;
      return tcoll
    }else {
      var tail_node__22368 = new cljs.core.VectorNode(this__22367.root.edit, this__22367.tail);
      var new_tail__22369 = cljs.core.make_array.call(null, 32);
      new_tail__22369[0] = o;
      this__22367.tail = new_tail__22369;
      if(this__22367.cnt >>> 5 > 1 << this__22367.shift) {
        var new_root_array__22370 = cljs.core.make_array.call(null, 32);
        var new_shift__22371 = this__22367.shift + 5;
        new_root_array__22370[0] = this__22367.root;
        new_root_array__22370[1] = cljs.core.new_path.call(null, this__22367.root.edit, this__22367.shift, tail_node__22368);
        this__22367.root = new cljs.core.VectorNode(this__22367.root.edit, new_root_array__22370);
        this__22367.shift = new_shift__22371;
        this__22367.cnt = this__22367.cnt + 1;
        return tcoll
      }else {
        var new_root__22372 = cljs.core.tv_push_tail.call(null, tcoll, this__22367.shift, this__22367.root, tail_node__22368);
        this__22367.root = new_root__22372;
        this__22367.cnt = this__22367.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__22373 = this;
  if(this__22373.root.edit) {
    this__22373.root.edit = null;
    var len__22374 = this__22373.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__22375 = cljs.core.make_array.call(null, len__22374);
    cljs.core.array_copy.call(null, this__22373.tail, 0, trimmed_tail__22375, 0, len__22374);
    return new cljs.core.PersistentVector(null, this__22373.cnt, this__22373.shift, this__22373.root, trimmed_tail__22375, null)
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
  var this__22377 = this;
  var h__2192__auto____22378 = this__22377.__hash;
  if(!(h__2192__auto____22378 == null)) {
    return h__2192__auto____22378
  }else {
    var h__2192__auto____22379 = cljs.core.hash_coll.call(null, coll);
    this__22377.__hash = h__2192__auto____22379;
    return h__2192__auto____22379
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__22380 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__22381 = this;
  var this__22382 = this;
  return cljs.core.pr_str.call(null, this__22382)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__22383 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__22384 = this;
  return cljs.core._first.call(null, this__22384.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__22385 = this;
  var temp__3971__auto____22386 = cljs.core.next.call(null, this__22385.front);
  if(temp__3971__auto____22386) {
    var f1__22387 = temp__3971__auto____22386;
    return new cljs.core.PersistentQueueSeq(this__22385.meta, f1__22387, this__22385.rear, null)
  }else {
    if(this__22385.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__22385.meta, this__22385.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__22388 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__22389 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__22389.front, this__22389.rear, this__22389.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__22390 = this;
  return this__22390.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__22391 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__22391.meta)
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
  var this__22392 = this;
  var h__2192__auto____22393 = this__22392.__hash;
  if(!(h__2192__auto____22393 == null)) {
    return h__2192__auto____22393
  }else {
    var h__2192__auto____22394 = cljs.core.hash_coll.call(null, coll);
    this__22392.__hash = h__2192__auto____22394;
    return h__2192__auto____22394
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__22395 = this;
  if(cljs.core.truth_(this__22395.front)) {
    return new cljs.core.PersistentQueue(this__22395.meta, this__22395.count + 1, this__22395.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____22396 = this__22395.rear;
      if(cljs.core.truth_(or__3824__auto____22396)) {
        return or__3824__auto____22396
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__22395.meta, this__22395.count + 1, cljs.core.conj.call(null, this__22395.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__22397 = this;
  var this__22398 = this;
  return cljs.core.pr_str.call(null, this__22398)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__22399 = this;
  var rear__22400 = cljs.core.seq.call(null, this__22399.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____22401 = this__22399.front;
    if(cljs.core.truth_(or__3824__auto____22401)) {
      return or__3824__auto____22401
    }else {
      return rear__22400
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__22399.front, cljs.core.seq.call(null, rear__22400), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__22402 = this;
  return this__22402.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__22403 = this;
  return cljs.core._first.call(null, this__22403.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__22404 = this;
  if(cljs.core.truth_(this__22404.front)) {
    var temp__3971__auto____22405 = cljs.core.next.call(null, this__22404.front);
    if(temp__3971__auto____22405) {
      var f1__22406 = temp__3971__auto____22405;
      return new cljs.core.PersistentQueue(this__22404.meta, this__22404.count - 1, f1__22406, this__22404.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__22404.meta, this__22404.count - 1, cljs.core.seq.call(null, this__22404.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__22407 = this;
  return cljs.core.first.call(null, this__22407.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__22408 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__22409 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__22410 = this;
  return new cljs.core.PersistentQueue(meta, this__22410.count, this__22410.front, this__22410.rear, this__22410.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__22411 = this;
  return this__22411.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__22412 = this;
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
  var this__22413 = this;
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
  var len__22416 = array.length;
  var i__22417 = 0;
  while(true) {
    if(i__22417 < len__22416) {
      if(k === array[i__22417]) {
        return i__22417
      }else {
        var G__22418 = i__22417 + incr;
        i__22417 = G__22418;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__22421 = cljs.core.hash.call(null, a);
  var b__22422 = cljs.core.hash.call(null, b);
  if(a__22421 < b__22422) {
    return-1
  }else {
    if(a__22421 > b__22422) {
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
  var ks__22430 = m.keys;
  var len__22431 = ks__22430.length;
  var so__22432 = m.strobj;
  var out__22433 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__22434 = 0;
  var out__22435 = cljs.core.transient$.call(null, out__22433);
  while(true) {
    if(i__22434 < len__22431) {
      var k__22436 = ks__22430[i__22434];
      var G__22437 = i__22434 + 1;
      var G__22438 = cljs.core.assoc_BANG_.call(null, out__22435, k__22436, so__22432[k__22436]);
      i__22434 = G__22437;
      out__22435 = G__22438;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__22435, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__22444 = {};
  var l__22445 = ks.length;
  var i__22446 = 0;
  while(true) {
    if(i__22446 < l__22445) {
      var k__22447 = ks[i__22446];
      new_obj__22444[k__22447] = obj[k__22447];
      var G__22448 = i__22446 + 1;
      i__22446 = G__22448;
      continue
    }else {
    }
    break
  }
  return new_obj__22444
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
  var this__22451 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__22452 = this;
  var h__2192__auto____22453 = this__22452.__hash;
  if(!(h__2192__auto____22453 == null)) {
    return h__2192__auto____22453
  }else {
    var h__2192__auto____22454 = cljs.core.hash_imap.call(null, coll);
    this__22452.__hash = h__2192__auto____22454;
    return h__2192__auto____22454
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__22455 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__22456 = this;
  if(function() {
    var and__3822__auto____22457 = goog.isString(k);
    if(and__3822__auto____22457) {
      return!(cljs.core.scan_array.call(null, 1, k, this__22456.keys) == null)
    }else {
      return and__3822__auto____22457
    }
  }()) {
    return this__22456.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__22458 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____22459 = this__22458.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____22459) {
        return or__3824__auto____22459
      }else {
        return this__22458.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__22458.keys) == null)) {
        var new_strobj__22460 = cljs.core.obj_clone.call(null, this__22458.strobj, this__22458.keys);
        new_strobj__22460[k] = v;
        return new cljs.core.ObjMap(this__22458.meta, this__22458.keys, new_strobj__22460, this__22458.update_count + 1, null)
      }else {
        var new_strobj__22461 = cljs.core.obj_clone.call(null, this__22458.strobj, this__22458.keys);
        var new_keys__22462 = this__22458.keys.slice();
        new_strobj__22461[k] = v;
        new_keys__22462.push(k);
        return new cljs.core.ObjMap(this__22458.meta, new_keys__22462, new_strobj__22461, this__22458.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__22463 = this;
  if(function() {
    var and__3822__auto____22464 = goog.isString(k);
    if(and__3822__auto____22464) {
      return!(cljs.core.scan_array.call(null, 1, k, this__22463.keys) == null)
    }else {
      return and__3822__auto____22464
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__22486 = null;
  var G__22486__2 = function(this_sym22465, k) {
    var this__22467 = this;
    var this_sym22465__22468 = this;
    var coll__22469 = this_sym22465__22468;
    return coll__22469.cljs$core$ILookup$_lookup$arity$2(coll__22469, k)
  };
  var G__22486__3 = function(this_sym22466, k, not_found) {
    var this__22467 = this;
    var this_sym22466__22470 = this;
    var coll__22471 = this_sym22466__22470;
    return coll__22471.cljs$core$ILookup$_lookup$arity$3(coll__22471, k, not_found)
  };
  G__22486 = function(this_sym22466, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__22486__2.call(this, this_sym22466, k);
      case 3:
        return G__22486__3.call(this, this_sym22466, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__22486
}();
cljs.core.ObjMap.prototype.apply = function(this_sym22449, args22450) {
  var this__22472 = this;
  return this_sym22449.call.apply(this_sym22449, [this_sym22449].concat(args22450.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__22473 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__22474 = this;
  var this__22475 = this;
  return cljs.core.pr_str.call(null, this__22475)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__22476 = this;
  if(this__22476.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__22439_SHARP_) {
      return cljs.core.vector.call(null, p1__22439_SHARP_, this__22476.strobj[p1__22439_SHARP_])
    }, this__22476.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__22477 = this;
  return this__22477.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__22478 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__22479 = this;
  return new cljs.core.ObjMap(meta, this__22479.keys, this__22479.strobj, this__22479.update_count, this__22479.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__22480 = this;
  return this__22480.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__22481 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__22481.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__22482 = this;
  if(function() {
    var and__3822__auto____22483 = goog.isString(k);
    if(and__3822__auto____22483) {
      return!(cljs.core.scan_array.call(null, 1, k, this__22482.keys) == null)
    }else {
      return and__3822__auto____22483
    }
  }()) {
    var new_keys__22484 = this__22482.keys.slice();
    var new_strobj__22485 = cljs.core.obj_clone.call(null, this__22482.strobj, this__22482.keys);
    new_keys__22484.splice(cljs.core.scan_array.call(null, 1, k, new_keys__22484), 1);
    cljs.core.js_delete.call(null, new_strobj__22485, k);
    return new cljs.core.ObjMap(this__22482.meta, new_keys__22484, new_strobj__22485, this__22482.update_count + 1, null)
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
  var this__22490 = this;
  var h__2192__auto____22491 = this__22490.__hash;
  if(!(h__2192__auto____22491 == null)) {
    return h__2192__auto____22491
  }else {
    var h__2192__auto____22492 = cljs.core.hash_imap.call(null, coll);
    this__22490.__hash = h__2192__auto____22492;
    return h__2192__auto____22492
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__22493 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__22494 = this;
  var bucket__22495 = this__22494.hashobj[cljs.core.hash.call(null, k)];
  var i__22496 = cljs.core.truth_(bucket__22495) ? cljs.core.scan_array.call(null, 2, k, bucket__22495) : null;
  if(cljs.core.truth_(i__22496)) {
    return bucket__22495[i__22496 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__22497 = this;
  var h__22498 = cljs.core.hash.call(null, k);
  var bucket__22499 = this__22497.hashobj[h__22498];
  if(cljs.core.truth_(bucket__22499)) {
    var new_bucket__22500 = bucket__22499.slice();
    var new_hashobj__22501 = goog.object.clone(this__22497.hashobj);
    new_hashobj__22501[h__22498] = new_bucket__22500;
    var temp__3971__auto____22502 = cljs.core.scan_array.call(null, 2, k, new_bucket__22500);
    if(cljs.core.truth_(temp__3971__auto____22502)) {
      var i__22503 = temp__3971__auto____22502;
      new_bucket__22500[i__22503 + 1] = v;
      return new cljs.core.HashMap(this__22497.meta, this__22497.count, new_hashobj__22501, null)
    }else {
      new_bucket__22500.push(k, v);
      return new cljs.core.HashMap(this__22497.meta, this__22497.count + 1, new_hashobj__22501, null)
    }
  }else {
    var new_hashobj__22504 = goog.object.clone(this__22497.hashobj);
    new_hashobj__22504[h__22498] = [k, v];
    return new cljs.core.HashMap(this__22497.meta, this__22497.count + 1, new_hashobj__22504, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__22505 = this;
  var bucket__22506 = this__22505.hashobj[cljs.core.hash.call(null, k)];
  var i__22507 = cljs.core.truth_(bucket__22506) ? cljs.core.scan_array.call(null, 2, k, bucket__22506) : null;
  if(cljs.core.truth_(i__22507)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__22532 = null;
  var G__22532__2 = function(this_sym22508, k) {
    var this__22510 = this;
    var this_sym22508__22511 = this;
    var coll__22512 = this_sym22508__22511;
    return coll__22512.cljs$core$ILookup$_lookup$arity$2(coll__22512, k)
  };
  var G__22532__3 = function(this_sym22509, k, not_found) {
    var this__22510 = this;
    var this_sym22509__22513 = this;
    var coll__22514 = this_sym22509__22513;
    return coll__22514.cljs$core$ILookup$_lookup$arity$3(coll__22514, k, not_found)
  };
  G__22532 = function(this_sym22509, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__22532__2.call(this, this_sym22509, k);
      case 3:
        return G__22532__3.call(this, this_sym22509, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__22532
}();
cljs.core.HashMap.prototype.apply = function(this_sym22488, args22489) {
  var this__22515 = this;
  return this_sym22488.call.apply(this_sym22488, [this_sym22488].concat(args22489.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__22516 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__22517 = this;
  var this__22518 = this;
  return cljs.core.pr_str.call(null, this__22518)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__22519 = this;
  if(this__22519.count > 0) {
    var hashes__22520 = cljs.core.js_keys.call(null, this__22519.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__22487_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__22519.hashobj[p1__22487_SHARP_]))
    }, hashes__22520)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__22521 = this;
  return this__22521.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__22522 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__22523 = this;
  return new cljs.core.HashMap(meta, this__22523.count, this__22523.hashobj, this__22523.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__22524 = this;
  return this__22524.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__22525 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__22525.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__22526 = this;
  var h__22527 = cljs.core.hash.call(null, k);
  var bucket__22528 = this__22526.hashobj[h__22527];
  var i__22529 = cljs.core.truth_(bucket__22528) ? cljs.core.scan_array.call(null, 2, k, bucket__22528) : null;
  if(cljs.core.not.call(null, i__22529)) {
    return coll
  }else {
    var new_hashobj__22530 = goog.object.clone(this__22526.hashobj);
    if(3 > bucket__22528.length) {
      cljs.core.js_delete.call(null, new_hashobj__22530, h__22527)
    }else {
      var new_bucket__22531 = bucket__22528.slice();
      new_bucket__22531.splice(i__22529, 2);
      new_hashobj__22530[h__22527] = new_bucket__22531
    }
    return new cljs.core.HashMap(this__22526.meta, this__22526.count - 1, new_hashobj__22530, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__22533 = ks.length;
  var i__22534 = 0;
  var out__22535 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__22534 < len__22533) {
      var G__22536 = i__22534 + 1;
      var G__22537 = cljs.core.assoc.call(null, out__22535, ks[i__22534], vs[i__22534]);
      i__22534 = G__22536;
      out__22535 = G__22537;
      continue
    }else {
      return out__22535
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__22541 = m.arr;
  var len__22542 = arr__22541.length;
  var i__22543 = 0;
  while(true) {
    if(len__22542 <= i__22543) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__22541[i__22543], k)) {
        return i__22543
      }else {
        if("\ufdd0'else") {
          var G__22544 = i__22543 + 2;
          i__22543 = G__22544;
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
  var this__22547 = this;
  return new cljs.core.TransientArrayMap({}, this__22547.arr.length, this__22547.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__22548 = this;
  var h__2192__auto____22549 = this__22548.__hash;
  if(!(h__2192__auto____22549 == null)) {
    return h__2192__auto____22549
  }else {
    var h__2192__auto____22550 = cljs.core.hash_imap.call(null, coll);
    this__22548.__hash = h__2192__auto____22550;
    return h__2192__auto____22550
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__22551 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__22552 = this;
  var idx__22553 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__22553 === -1) {
    return not_found
  }else {
    return this__22552.arr[idx__22553 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__22554 = this;
  var idx__22555 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__22555 === -1) {
    if(this__22554.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__22554.meta, this__22554.cnt + 1, function() {
        var G__22556__22557 = this__22554.arr.slice();
        G__22556__22557.push(k);
        G__22556__22557.push(v);
        return G__22556__22557
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__22554.arr[idx__22555 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__22554.meta, this__22554.cnt, function() {
          var G__22558__22559 = this__22554.arr.slice();
          G__22558__22559[idx__22555 + 1] = v;
          return G__22558__22559
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__22560 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__22592 = null;
  var G__22592__2 = function(this_sym22561, k) {
    var this__22563 = this;
    var this_sym22561__22564 = this;
    var coll__22565 = this_sym22561__22564;
    return coll__22565.cljs$core$ILookup$_lookup$arity$2(coll__22565, k)
  };
  var G__22592__3 = function(this_sym22562, k, not_found) {
    var this__22563 = this;
    var this_sym22562__22566 = this;
    var coll__22567 = this_sym22562__22566;
    return coll__22567.cljs$core$ILookup$_lookup$arity$3(coll__22567, k, not_found)
  };
  G__22592 = function(this_sym22562, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__22592__2.call(this, this_sym22562, k);
      case 3:
        return G__22592__3.call(this, this_sym22562, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__22592
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym22545, args22546) {
  var this__22568 = this;
  return this_sym22545.call.apply(this_sym22545, [this_sym22545].concat(args22546.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__22569 = this;
  var len__22570 = this__22569.arr.length;
  var i__22571 = 0;
  var init__22572 = init;
  while(true) {
    if(i__22571 < len__22570) {
      var init__22573 = f.call(null, init__22572, this__22569.arr[i__22571], this__22569.arr[i__22571 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__22573)) {
        return cljs.core.deref.call(null, init__22573)
      }else {
        var G__22593 = i__22571 + 2;
        var G__22594 = init__22573;
        i__22571 = G__22593;
        init__22572 = G__22594;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__22574 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__22575 = this;
  var this__22576 = this;
  return cljs.core.pr_str.call(null, this__22576)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__22577 = this;
  if(this__22577.cnt > 0) {
    var len__22578 = this__22577.arr.length;
    var array_map_seq__22579 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__22578) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__22577.arr[i], this__22577.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__22579.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__22580 = this;
  return this__22580.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__22581 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__22582 = this;
  return new cljs.core.PersistentArrayMap(meta, this__22582.cnt, this__22582.arr, this__22582.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__22583 = this;
  return this__22583.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__22584 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__22584.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__22585 = this;
  var idx__22586 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__22586 >= 0) {
    var len__22587 = this__22585.arr.length;
    var new_len__22588 = len__22587 - 2;
    if(new_len__22588 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__22589 = cljs.core.make_array.call(null, new_len__22588);
      var s__22590 = 0;
      var d__22591 = 0;
      while(true) {
        if(s__22590 >= len__22587) {
          return new cljs.core.PersistentArrayMap(this__22585.meta, this__22585.cnt - 1, new_arr__22589, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__22585.arr[s__22590])) {
            var G__22595 = s__22590 + 2;
            var G__22596 = d__22591;
            s__22590 = G__22595;
            d__22591 = G__22596;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__22589[d__22591] = this__22585.arr[s__22590];
              new_arr__22589[d__22591 + 1] = this__22585.arr[s__22590 + 1];
              var G__22597 = s__22590 + 2;
              var G__22598 = d__22591 + 2;
              s__22590 = G__22597;
              d__22591 = G__22598;
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
  var len__22599 = cljs.core.count.call(null, ks);
  var i__22600 = 0;
  var out__22601 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__22600 < len__22599) {
      var G__22602 = i__22600 + 1;
      var G__22603 = cljs.core.assoc_BANG_.call(null, out__22601, ks[i__22600], vs[i__22600]);
      i__22600 = G__22602;
      out__22601 = G__22603;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__22601)
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
  var this__22604 = this;
  if(cljs.core.truth_(this__22604.editable_QMARK_)) {
    var idx__22605 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__22605 >= 0) {
      this__22604.arr[idx__22605] = this__22604.arr[this__22604.len - 2];
      this__22604.arr[idx__22605 + 1] = this__22604.arr[this__22604.len - 1];
      var G__22606__22607 = this__22604.arr;
      G__22606__22607.pop();
      G__22606__22607.pop();
      G__22606__22607;
      this__22604.len = this__22604.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__22608 = this;
  if(cljs.core.truth_(this__22608.editable_QMARK_)) {
    var idx__22609 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__22609 === -1) {
      if(this__22608.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__22608.len = this__22608.len + 2;
        this__22608.arr.push(key);
        this__22608.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__22608.len, this__22608.arr), key, val)
      }
    }else {
      if(val === this__22608.arr[idx__22609 + 1]) {
        return tcoll
      }else {
        this__22608.arr[idx__22609 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__22610 = this;
  if(cljs.core.truth_(this__22610.editable_QMARK_)) {
    if(function() {
      var G__22611__22612 = o;
      if(G__22611__22612) {
        if(function() {
          var or__3824__auto____22613 = G__22611__22612.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____22613) {
            return or__3824__auto____22613
          }else {
            return G__22611__22612.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__22611__22612.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__22611__22612)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__22611__22612)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__22614 = cljs.core.seq.call(null, o);
      var tcoll__22615 = tcoll;
      while(true) {
        var temp__3971__auto____22616 = cljs.core.first.call(null, es__22614);
        if(cljs.core.truth_(temp__3971__auto____22616)) {
          var e__22617 = temp__3971__auto____22616;
          var G__22623 = cljs.core.next.call(null, es__22614);
          var G__22624 = tcoll__22615.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__22615, cljs.core.key.call(null, e__22617), cljs.core.val.call(null, e__22617));
          es__22614 = G__22623;
          tcoll__22615 = G__22624;
          continue
        }else {
          return tcoll__22615
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__22618 = this;
  if(cljs.core.truth_(this__22618.editable_QMARK_)) {
    this__22618.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__22618.len, 2), this__22618.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__22619 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__22620 = this;
  if(cljs.core.truth_(this__22620.editable_QMARK_)) {
    var idx__22621 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__22621 === -1) {
      return not_found
    }else {
      return this__22620.arr[idx__22621 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__22622 = this;
  if(cljs.core.truth_(this__22622.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__22622.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__22627 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__22628 = 0;
  while(true) {
    if(i__22628 < len) {
      var G__22629 = cljs.core.assoc_BANG_.call(null, out__22627, arr[i__22628], arr[i__22628 + 1]);
      var G__22630 = i__22628 + 2;
      out__22627 = G__22629;
      i__22628 = G__22630;
      continue
    }else {
      return out__22627
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
    var G__22635__22636 = arr.slice();
    G__22635__22636[i] = a;
    return G__22635__22636
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__22637__22638 = arr.slice();
    G__22637__22638[i] = a;
    G__22637__22638[j] = b;
    return G__22637__22638
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
  var new_arr__22640 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__22640, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__22640, 2 * i, new_arr__22640.length - 2 * i);
  return new_arr__22640
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
    var editable__22643 = inode.ensure_editable(edit);
    editable__22643.arr[i] = a;
    return editable__22643
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__22644 = inode.ensure_editable(edit);
    editable__22644.arr[i] = a;
    editable__22644.arr[j] = b;
    return editable__22644
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
  var len__22651 = arr.length;
  var i__22652 = 0;
  var init__22653 = init;
  while(true) {
    if(i__22652 < len__22651) {
      var init__22656 = function() {
        var k__22654 = arr[i__22652];
        if(!(k__22654 == null)) {
          return f.call(null, init__22653, k__22654, arr[i__22652 + 1])
        }else {
          var node__22655 = arr[i__22652 + 1];
          if(!(node__22655 == null)) {
            return node__22655.kv_reduce(f, init__22653)
          }else {
            return init__22653
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__22656)) {
        return cljs.core.deref.call(null, init__22656)
      }else {
        var G__22657 = i__22652 + 2;
        var G__22658 = init__22656;
        i__22652 = G__22657;
        init__22653 = G__22658;
        continue
      }
    }else {
      return init__22653
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
  var this__22659 = this;
  var inode__22660 = this;
  if(this__22659.bitmap === bit) {
    return null
  }else {
    var editable__22661 = inode__22660.ensure_editable(e);
    var earr__22662 = editable__22661.arr;
    var len__22663 = earr__22662.length;
    editable__22661.bitmap = bit ^ editable__22661.bitmap;
    cljs.core.array_copy.call(null, earr__22662, 2 * (i + 1), earr__22662, 2 * i, len__22663 - 2 * (i + 1));
    earr__22662[len__22663 - 2] = null;
    earr__22662[len__22663 - 1] = null;
    return editable__22661
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__22664 = this;
  var inode__22665 = this;
  var bit__22666 = 1 << (hash >>> shift & 31);
  var idx__22667 = cljs.core.bitmap_indexed_node_index.call(null, this__22664.bitmap, bit__22666);
  if((this__22664.bitmap & bit__22666) === 0) {
    var n__22668 = cljs.core.bit_count.call(null, this__22664.bitmap);
    if(2 * n__22668 < this__22664.arr.length) {
      var editable__22669 = inode__22665.ensure_editable(edit);
      var earr__22670 = editable__22669.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__22670, 2 * idx__22667, earr__22670, 2 * (idx__22667 + 1), 2 * (n__22668 - idx__22667));
      earr__22670[2 * idx__22667] = key;
      earr__22670[2 * idx__22667 + 1] = val;
      editable__22669.bitmap = editable__22669.bitmap | bit__22666;
      return editable__22669
    }else {
      if(n__22668 >= 16) {
        var nodes__22671 = cljs.core.make_array.call(null, 32);
        var jdx__22672 = hash >>> shift & 31;
        nodes__22671[jdx__22672] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__22673 = 0;
        var j__22674 = 0;
        while(true) {
          if(i__22673 < 32) {
            if((this__22664.bitmap >>> i__22673 & 1) === 0) {
              var G__22727 = i__22673 + 1;
              var G__22728 = j__22674;
              i__22673 = G__22727;
              j__22674 = G__22728;
              continue
            }else {
              nodes__22671[i__22673] = !(this__22664.arr[j__22674] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__22664.arr[j__22674]), this__22664.arr[j__22674], this__22664.arr[j__22674 + 1], added_leaf_QMARK_) : this__22664.arr[j__22674 + 1];
              var G__22729 = i__22673 + 1;
              var G__22730 = j__22674 + 2;
              i__22673 = G__22729;
              j__22674 = G__22730;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__22668 + 1, nodes__22671)
      }else {
        if("\ufdd0'else") {
          var new_arr__22675 = cljs.core.make_array.call(null, 2 * (n__22668 + 4));
          cljs.core.array_copy.call(null, this__22664.arr, 0, new_arr__22675, 0, 2 * idx__22667);
          new_arr__22675[2 * idx__22667] = key;
          new_arr__22675[2 * idx__22667 + 1] = val;
          cljs.core.array_copy.call(null, this__22664.arr, 2 * idx__22667, new_arr__22675, 2 * (idx__22667 + 1), 2 * (n__22668 - idx__22667));
          added_leaf_QMARK_.val = true;
          var editable__22676 = inode__22665.ensure_editable(edit);
          editable__22676.arr = new_arr__22675;
          editable__22676.bitmap = editable__22676.bitmap | bit__22666;
          return editable__22676
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__22677 = this__22664.arr[2 * idx__22667];
    var val_or_node__22678 = this__22664.arr[2 * idx__22667 + 1];
    if(key_or_nil__22677 == null) {
      var n__22679 = val_or_node__22678.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__22679 === val_or_node__22678) {
        return inode__22665
      }else {
        return cljs.core.edit_and_set.call(null, inode__22665, edit, 2 * idx__22667 + 1, n__22679)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__22677)) {
        if(val === val_or_node__22678) {
          return inode__22665
        }else {
          return cljs.core.edit_and_set.call(null, inode__22665, edit, 2 * idx__22667 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__22665, edit, 2 * idx__22667, null, 2 * idx__22667 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__22677, val_or_node__22678, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__22680 = this;
  var inode__22681 = this;
  return cljs.core.create_inode_seq.call(null, this__22680.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__22682 = this;
  var inode__22683 = this;
  var bit__22684 = 1 << (hash >>> shift & 31);
  if((this__22682.bitmap & bit__22684) === 0) {
    return inode__22683
  }else {
    var idx__22685 = cljs.core.bitmap_indexed_node_index.call(null, this__22682.bitmap, bit__22684);
    var key_or_nil__22686 = this__22682.arr[2 * idx__22685];
    var val_or_node__22687 = this__22682.arr[2 * idx__22685 + 1];
    if(key_or_nil__22686 == null) {
      var n__22688 = val_or_node__22687.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__22688 === val_or_node__22687) {
        return inode__22683
      }else {
        if(!(n__22688 == null)) {
          return cljs.core.edit_and_set.call(null, inode__22683, edit, 2 * idx__22685 + 1, n__22688)
        }else {
          if(this__22682.bitmap === bit__22684) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__22683.edit_and_remove_pair(edit, bit__22684, idx__22685)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__22686)) {
        removed_leaf_QMARK_[0] = true;
        return inode__22683.edit_and_remove_pair(edit, bit__22684, idx__22685)
      }else {
        if("\ufdd0'else") {
          return inode__22683
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__22689 = this;
  var inode__22690 = this;
  if(e === this__22689.edit) {
    return inode__22690
  }else {
    var n__22691 = cljs.core.bit_count.call(null, this__22689.bitmap);
    var new_arr__22692 = cljs.core.make_array.call(null, n__22691 < 0 ? 4 : 2 * (n__22691 + 1));
    cljs.core.array_copy.call(null, this__22689.arr, 0, new_arr__22692, 0, 2 * n__22691);
    return new cljs.core.BitmapIndexedNode(e, this__22689.bitmap, new_arr__22692)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__22693 = this;
  var inode__22694 = this;
  return cljs.core.inode_kv_reduce.call(null, this__22693.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__22695 = this;
  var inode__22696 = this;
  var bit__22697 = 1 << (hash >>> shift & 31);
  if((this__22695.bitmap & bit__22697) === 0) {
    return not_found
  }else {
    var idx__22698 = cljs.core.bitmap_indexed_node_index.call(null, this__22695.bitmap, bit__22697);
    var key_or_nil__22699 = this__22695.arr[2 * idx__22698];
    var val_or_node__22700 = this__22695.arr[2 * idx__22698 + 1];
    if(key_or_nil__22699 == null) {
      return val_or_node__22700.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__22699)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__22699, val_or_node__22700], true)
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
  var this__22701 = this;
  var inode__22702 = this;
  var bit__22703 = 1 << (hash >>> shift & 31);
  if((this__22701.bitmap & bit__22703) === 0) {
    return inode__22702
  }else {
    var idx__22704 = cljs.core.bitmap_indexed_node_index.call(null, this__22701.bitmap, bit__22703);
    var key_or_nil__22705 = this__22701.arr[2 * idx__22704];
    var val_or_node__22706 = this__22701.arr[2 * idx__22704 + 1];
    if(key_or_nil__22705 == null) {
      var n__22707 = val_or_node__22706.inode_without(shift + 5, hash, key);
      if(n__22707 === val_or_node__22706) {
        return inode__22702
      }else {
        if(!(n__22707 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__22701.bitmap, cljs.core.clone_and_set.call(null, this__22701.arr, 2 * idx__22704 + 1, n__22707))
        }else {
          if(this__22701.bitmap === bit__22703) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__22701.bitmap ^ bit__22703, cljs.core.remove_pair.call(null, this__22701.arr, idx__22704))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__22705)) {
        return new cljs.core.BitmapIndexedNode(null, this__22701.bitmap ^ bit__22703, cljs.core.remove_pair.call(null, this__22701.arr, idx__22704))
      }else {
        if("\ufdd0'else") {
          return inode__22702
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__22708 = this;
  var inode__22709 = this;
  var bit__22710 = 1 << (hash >>> shift & 31);
  var idx__22711 = cljs.core.bitmap_indexed_node_index.call(null, this__22708.bitmap, bit__22710);
  if((this__22708.bitmap & bit__22710) === 0) {
    var n__22712 = cljs.core.bit_count.call(null, this__22708.bitmap);
    if(n__22712 >= 16) {
      var nodes__22713 = cljs.core.make_array.call(null, 32);
      var jdx__22714 = hash >>> shift & 31;
      nodes__22713[jdx__22714] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__22715 = 0;
      var j__22716 = 0;
      while(true) {
        if(i__22715 < 32) {
          if((this__22708.bitmap >>> i__22715 & 1) === 0) {
            var G__22731 = i__22715 + 1;
            var G__22732 = j__22716;
            i__22715 = G__22731;
            j__22716 = G__22732;
            continue
          }else {
            nodes__22713[i__22715] = !(this__22708.arr[j__22716] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__22708.arr[j__22716]), this__22708.arr[j__22716], this__22708.arr[j__22716 + 1], added_leaf_QMARK_) : this__22708.arr[j__22716 + 1];
            var G__22733 = i__22715 + 1;
            var G__22734 = j__22716 + 2;
            i__22715 = G__22733;
            j__22716 = G__22734;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__22712 + 1, nodes__22713)
    }else {
      var new_arr__22717 = cljs.core.make_array.call(null, 2 * (n__22712 + 1));
      cljs.core.array_copy.call(null, this__22708.arr, 0, new_arr__22717, 0, 2 * idx__22711);
      new_arr__22717[2 * idx__22711] = key;
      new_arr__22717[2 * idx__22711 + 1] = val;
      cljs.core.array_copy.call(null, this__22708.arr, 2 * idx__22711, new_arr__22717, 2 * (idx__22711 + 1), 2 * (n__22712 - idx__22711));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__22708.bitmap | bit__22710, new_arr__22717)
    }
  }else {
    var key_or_nil__22718 = this__22708.arr[2 * idx__22711];
    var val_or_node__22719 = this__22708.arr[2 * idx__22711 + 1];
    if(key_or_nil__22718 == null) {
      var n__22720 = val_or_node__22719.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__22720 === val_or_node__22719) {
        return inode__22709
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__22708.bitmap, cljs.core.clone_and_set.call(null, this__22708.arr, 2 * idx__22711 + 1, n__22720))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__22718)) {
        if(val === val_or_node__22719) {
          return inode__22709
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__22708.bitmap, cljs.core.clone_and_set.call(null, this__22708.arr, 2 * idx__22711 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__22708.bitmap, cljs.core.clone_and_set.call(null, this__22708.arr, 2 * idx__22711, null, 2 * idx__22711 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__22718, val_or_node__22719, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__22721 = this;
  var inode__22722 = this;
  var bit__22723 = 1 << (hash >>> shift & 31);
  if((this__22721.bitmap & bit__22723) === 0) {
    return not_found
  }else {
    var idx__22724 = cljs.core.bitmap_indexed_node_index.call(null, this__22721.bitmap, bit__22723);
    var key_or_nil__22725 = this__22721.arr[2 * idx__22724];
    var val_or_node__22726 = this__22721.arr[2 * idx__22724 + 1];
    if(key_or_nil__22725 == null) {
      return val_or_node__22726.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__22725)) {
        return val_or_node__22726
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
  var arr__22742 = array_node.arr;
  var len__22743 = 2 * (array_node.cnt - 1);
  var new_arr__22744 = cljs.core.make_array.call(null, len__22743);
  var i__22745 = 0;
  var j__22746 = 1;
  var bitmap__22747 = 0;
  while(true) {
    if(i__22745 < len__22743) {
      if(function() {
        var and__3822__auto____22748 = !(i__22745 === idx);
        if(and__3822__auto____22748) {
          return!(arr__22742[i__22745] == null)
        }else {
          return and__3822__auto____22748
        }
      }()) {
        new_arr__22744[j__22746] = arr__22742[i__22745];
        var G__22749 = i__22745 + 1;
        var G__22750 = j__22746 + 2;
        var G__22751 = bitmap__22747 | 1 << i__22745;
        i__22745 = G__22749;
        j__22746 = G__22750;
        bitmap__22747 = G__22751;
        continue
      }else {
        var G__22752 = i__22745 + 1;
        var G__22753 = j__22746;
        var G__22754 = bitmap__22747;
        i__22745 = G__22752;
        j__22746 = G__22753;
        bitmap__22747 = G__22754;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__22747, new_arr__22744)
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
  var this__22755 = this;
  var inode__22756 = this;
  var idx__22757 = hash >>> shift & 31;
  var node__22758 = this__22755.arr[idx__22757];
  if(node__22758 == null) {
    var editable__22759 = cljs.core.edit_and_set.call(null, inode__22756, edit, idx__22757, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__22759.cnt = editable__22759.cnt + 1;
    return editable__22759
  }else {
    var n__22760 = node__22758.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__22760 === node__22758) {
      return inode__22756
    }else {
      return cljs.core.edit_and_set.call(null, inode__22756, edit, idx__22757, n__22760)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__22761 = this;
  var inode__22762 = this;
  return cljs.core.create_array_node_seq.call(null, this__22761.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__22763 = this;
  var inode__22764 = this;
  var idx__22765 = hash >>> shift & 31;
  var node__22766 = this__22763.arr[idx__22765];
  if(node__22766 == null) {
    return inode__22764
  }else {
    var n__22767 = node__22766.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__22767 === node__22766) {
      return inode__22764
    }else {
      if(n__22767 == null) {
        if(this__22763.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__22764, edit, idx__22765)
        }else {
          var editable__22768 = cljs.core.edit_and_set.call(null, inode__22764, edit, idx__22765, n__22767);
          editable__22768.cnt = editable__22768.cnt - 1;
          return editable__22768
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__22764, edit, idx__22765, n__22767)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__22769 = this;
  var inode__22770 = this;
  if(e === this__22769.edit) {
    return inode__22770
  }else {
    return new cljs.core.ArrayNode(e, this__22769.cnt, this__22769.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__22771 = this;
  var inode__22772 = this;
  var len__22773 = this__22771.arr.length;
  var i__22774 = 0;
  var init__22775 = init;
  while(true) {
    if(i__22774 < len__22773) {
      var node__22776 = this__22771.arr[i__22774];
      if(!(node__22776 == null)) {
        var init__22777 = node__22776.kv_reduce(f, init__22775);
        if(cljs.core.reduced_QMARK_.call(null, init__22777)) {
          return cljs.core.deref.call(null, init__22777)
        }else {
          var G__22796 = i__22774 + 1;
          var G__22797 = init__22777;
          i__22774 = G__22796;
          init__22775 = G__22797;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__22775
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__22778 = this;
  var inode__22779 = this;
  var idx__22780 = hash >>> shift & 31;
  var node__22781 = this__22778.arr[idx__22780];
  if(!(node__22781 == null)) {
    return node__22781.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__22782 = this;
  var inode__22783 = this;
  var idx__22784 = hash >>> shift & 31;
  var node__22785 = this__22782.arr[idx__22784];
  if(!(node__22785 == null)) {
    var n__22786 = node__22785.inode_without(shift + 5, hash, key);
    if(n__22786 === node__22785) {
      return inode__22783
    }else {
      if(n__22786 == null) {
        if(this__22782.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__22783, null, idx__22784)
        }else {
          return new cljs.core.ArrayNode(null, this__22782.cnt - 1, cljs.core.clone_and_set.call(null, this__22782.arr, idx__22784, n__22786))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__22782.cnt, cljs.core.clone_and_set.call(null, this__22782.arr, idx__22784, n__22786))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__22783
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__22787 = this;
  var inode__22788 = this;
  var idx__22789 = hash >>> shift & 31;
  var node__22790 = this__22787.arr[idx__22789];
  if(node__22790 == null) {
    return new cljs.core.ArrayNode(null, this__22787.cnt + 1, cljs.core.clone_and_set.call(null, this__22787.arr, idx__22789, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__22791 = node__22790.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__22791 === node__22790) {
      return inode__22788
    }else {
      return new cljs.core.ArrayNode(null, this__22787.cnt, cljs.core.clone_and_set.call(null, this__22787.arr, idx__22789, n__22791))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__22792 = this;
  var inode__22793 = this;
  var idx__22794 = hash >>> shift & 31;
  var node__22795 = this__22792.arr[idx__22794];
  if(!(node__22795 == null)) {
    return node__22795.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__22800 = 2 * cnt;
  var i__22801 = 0;
  while(true) {
    if(i__22801 < lim__22800) {
      if(cljs.core.key_test.call(null, key, arr[i__22801])) {
        return i__22801
      }else {
        var G__22802 = i__22801 + 2;
        i__22801 = G__22802;
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
  var this__22803 = this;
  var inode__22804 = this;
  if(hash === this__22803.collision_hash) {
    var idx__22805 = cljs.core.hash_collision_node_find_index.call(null, this__22803.arr, this__22803.cnt, key);
    if(idx__22805 === -1) {
      if(this__22803.arr.length > 2 * this__22803.cnt) {
        var editable__22806 = cljs.core.edit_and_set.call(null, inode__22804, edit, 2 * this__22803.cnt, key, 2 * this__22803.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__22806.cnt = editable__22806.cnt + 1;
        return editable__22806
      }else {
        var len__22807 = this__22803.arr.length;
        var new_arr__22808 = cljs.core.make_array.call(null, len__22807 + 2);
        cljs.core.array_copy.call(null, this__22803.arr, 0, new_arr__22808, 0, len__22807);
        new_arr__22808[len__22807] = key;
        new_arr__22808[len__22807 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__22804.ensure_editable_array(edit, this__22803.cnt + 1, new_arr__22808)
      }
    }else {
      if(this__22803.arr[idx__22805 + 1] === val) {
        return inode__22804
      }else {
        return cljs.core.edit_and_set.call(null, inode__22804, edit, idx__22805 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__22803.collision_hash >>> shift & 31), [null, inode__22804, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__22809 = this;
  var inode__22810 = this;
  return cljs.core.create_inode_seq.call(null, this__22809.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__22811 = this;
  var inode__22812 = this;
  var idx__22813 = cljs.core.hash_collision_node_find_index.call(null, this__22811.arr, this__22811.cnt, key);
  if(idx__22813 === -1) {
    return inode__22812
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__22811.cnt === 1) {
      return null
    }else {
      var editable__22814 = inode__22812.ensure_editable(edit);
      var earr__22815 = editable__22814.arr;
      earr__22815[idx__22813] = earr__22815[2 * this__22811.cnt - 2];
      earr__22815[idx__22813 + 1] = earr__22815[2 * this__22811.cnt - 1];
      earr__22815[2 * this__22811.cnt - 1] = null;
      earr__22815[2 * this__22811.cnt - 2] = null;
      editable__22814.cnt = editable__22814.cnt - 1;
      return editable__22814
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__22816 = this;
  var inode__22817 = this;
  if(e === this__22816.edit) {
    return inode__22817
  }else {
    var new_arr__22818 = cljs.core.make_array.call(null, 2 * (this__22816.cnt + 1));
    cljs.core.array_copy.call(null, this__22816.arr, 0, new_arr__22818, 0, 2 * this__22816.cnt);
    return new cljs.core.HashCollisionNode(e, this__22816.collision_hash, this__22816.cnt, new_arr__22818)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__22819 = this;
  var inode__22820 = this;
  return cljs.core.inode_kv_reduce.call(null, this__22819.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__22821 = this;
  var inode__22822 = this;
  var idx__22823 = cljs.core.hash_collision_node_find_index.call(null, this__22821.arr, this__22821.cnt, key);
  if(idx__22823 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__22821.arr[idx__22823])) {
      return cljs.core.PersistentVector.fromArray([this__22821.arr[idx__22823], this__22821.arr[idx__22823 + 1]], true)
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
  var this__22824 = this;
  var inode__22825 = this;
  var idx__22826 = cljs.core.hash_collision_node_find_index.call(null, this__22824.arr, this__22824.cnt, key);
  if(idx__22826 === -1) {
    return inode__22825
  }else {
    if(this__22824.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__22824.collision_hash, this__22824.cnt - 1, cljs.core.remove_pair.call(null, this__22824.arr, cljs.core.quot.call(null, idx__22826, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__22827 = this;
  var inode__22828 = this;
  if(hash === this__22827.collision_hash) {
    var idx__22829 = cljs.core.hash_collision_node_find_index.call(null, this__22827.arr, this__22827.cnt, key);
    if(idx__22829 === -1) {
      var len__22830 = this__22827.arr.length;
      var new_arr__22831 = cljs.core.make_array.call(null, len__22830 + 2);
      cljs.core.array_copy.call(null, this__22827.arr, 0, new_arr__22831, 0, len__22830);
      new_arr__22831[len__22830] = key;
      new_arr__22831[len__22830 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__22827.collision_hash, this__22827.cnt + 1, new_arr__22831)
    }else {
      if(cljs.core._EQ_.call(null, this__22827.arr[idx__22829], val)) {
        return inode__22828
      }else {
        return new cljs.core.HashCollisionNode(null, this__22827.collision_hash, this__22827.cnt, cljs.core.clone_and_set.call(null, this__22827.arr, idx__22829 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__22827.collision_hash >>> shift & 31), [null, inode__22828])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__22832 = this;
  var inode__22833 = this;
  var idx__22834 = cljs.core.hash_collision_node_find_index.call(null, this__22832.arr, this__22832.cnt, key);
  if(idx__22834 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__22832.arr[idx__22834])) {
      return this__22832.arr[idx__22834 + 1]
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
  var this__22835 = this;
  var inode__22836 = this;
  if(e === this__22835.edit) {
    this__22835.arr = array;
    this__22835.cnt = count;
    return inode__22836
  }else {
    return new cljs.core.HashCollisionNode(this__22835.edit, this__22835.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__22841 = cljs.core.hash.call(null, key1);
    if(key1hash__22841 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__22841, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___22842 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__22841, key1, val1, added_leaf_QMARK___22842).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___22842)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__22843 = cljs.core.hash.call(null, key1);
    if(key1hash__22843 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__22843, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___22844 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__22843, key1, val1, added_leaf_QMARK___22844).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___22844)
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
  var this__22845 = this;
  var h__2192__auto____22846 = this__22845.__hash;
  if(!(h__2192__auto____22846 == null)) {
    return h__2192__auto____22846
  }else {
    var h__2192__auto____22847 = cljs.core.hash_coll.call(null, coll);
    this__22845.__hash = h__2192__auto____22847;
    return h__2192__auto____22847
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__22848 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__22849 = this;
  var this__22850 = this;
  return cljs.core.pr_str.call(null, this__22850)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__22851 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__22852 = this;
  if(this__22852.s == null) {
    return cljs.core.PersistentVector.fromArray([this__22852.nodes[this__22852.i], this__22852.nodes[this__22852.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__22852.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__22853 = this;
  if(this__22853.s == null) {
    return cljs.core.create_inode_seq.call(null, this__22853.nodes, this__22853.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__22853.nodes, this__22853.i, cljs.core.next.call(null, this__22853.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__22854 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__22855 = this;
  return new cljs.core.NodeSeq(meta, this__22855.nodes, this__22855.i, this__22855.s, this__22855.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__22856 = this;
  return this__22856.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__22857 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__22857.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__22864 = nodes.length;
      var j__22865 = i;
      while(true) {
        if(j__22865 < len__22864) {
          if(!(nodes[j__22865] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__22865, null, null)
          }else {
            var temp__3971__auto____22866 = nodes[j__22865 + 1];
            if(cljs.core.truth_(temp__3971__auto____22866)) {
              var node__22867 = temp__3971__auto____22866;
              var temp__3971__auto____22868 = node__22867.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____22868)) {
                var node_seq__22869 = temp__3971__auto____22868;
                return new cljs.core.NodeSeq(null, nodes, j__22865 + 2, node_seq__22869, null)
              }else {
                var G__22870 = j__22865 + 2;
                j__22865 = G__22870;
                continue
              }
            }else {
              var G__22871 = j__22865 + 2;
              j__22865 = G__22871;
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
  var this__22872 = this;
  var h__2192__auto____22873 = this__22872.__hash;
  if(!(h__2192__auto____22873 == null)) {
    return h__2192__auto____22873
  }else {
    var h__2192__auto____22874 = cljs.core.hash_coll.call(null, coll);
    this__22872.__hash = h__2192__auto____22874;
    return h__2192__auto____22874
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__22875 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__22876 = this;
  var this__22877 = this;
  return cljs.core.pr_str.call(null, this__22877)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__22878 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__22879 = this;
  return cljs.core.first.call(null, this__22879.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__22880 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__22880.nodes, this__22880.i, cljs.core.next.call(null, this__22880.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__22881 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__22882 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__22882.nodes, this__22882.i, this__22882.s, this__22882.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__22883 = this;
  return this__22883.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__22884 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__22884.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__22891 = nodes.length;
      var j__22892 = i;
      while(true) {
        if(j__22892 < len__22891) {
          var temp__3971__auto____22893 = nodes[j__22892];
          if(cljs.core.truth_(temp__3971__auto____22893)) {
            var nj__22894 = temp__3971__auto____22893;
            var temp__3971__auto____22895 = nj__22894.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____22895)) {
              var ns__22896 = temp__3971__auto____22895;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__22892 + 1, ns__22896, null)
            }else {
              var G__22897 = j__22892 + 1;
              j__22892 = G__22897;
              continue
            }
          }else {
            var G__22898 = j__22892 + 1;
            j__22892 = G__22898;
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
  var this__22901 = this;
  return new cljs.core.TransientHashMap({}, this__22901.root, this__22901.cnt, this__22901.has_nil_QMARK_, this__22901.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__22902 = this;
  var h__2192__auto____22903 = this__22902.__hash;
  if(!(h__2192__auto____22903 == null)) {
    return h__2192__auto____22903
  }else {
    var h__2192__auto____22904 = cljs.core.hash_imap.call(null, coll);
    this__22902.__hash = h__2192__auto____22904;
    return h__2192__auto____22904
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__22905 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__22906 = this;
  if(k == null) {
    if(this__22906.has_nil_QMARK_) {
      return this__22906.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__22906.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__22906.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__22907 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____22908 = this__22907.has_nil_QMARK_;
      if(and__3822__auto____22908) {
        return v === this__22907.nil_val
      }else {
        return and__3822__auto____22908
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__22907.meta, this__22907.has_nil_QMARK_ ? this__22907.cnt : this__22907.cnt + 1, this__22907.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___22909 = new cljs.core.Box(false);
    var new_root__22910 = (this__22907.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__22907.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___22909);
    if(new_root__22910 === this__22907.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__22907.meta, added_leaf_QMARK___22909.val ? this__22907.cnt + 1 : this__22907.cnt, new_root__22910, this__22907.has_nil_QMARK_, this__22907.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__22911 = this;
  if(k == null) {
    return this__22911.has_nil_QMARK_
  }else {
    if(this__22911.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__22911.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__22934 = null;
  var G__22934__2 = function(this_sym22912, k) {
    var this__22914 = this;
    var this_sym22912__22915 = this;
    var coll__22916 = this_sym22912__22915;
    return coll__22916.cljs$core$ILookup$_lookup$arity$2(coll__22916, k)
  };
  var G__22934__3 = function(this_sym22913, k, not_found) {
    var this__22914 = this;
    var this_sym22913__22917 = this;
    var coll__22918 = this_sym22913__22917;
    return coll__22918.cljs$core$ILookup$_lookup$arity$3(coll__22918, k, not_found)
  };
  G__22934 = function(this_sym22913, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__22934__2.call(this, this_sym22913, k);
      case 3:
        return G__22934__3.call(this, this_sym22913, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__22934
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym22899, args22900) {
  var this__22919 = this;
  return this_sym22899.call.apply(this_sym22899, [this_sym22899].concat(args22900.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__22920 = this;
  var init__22921 = this__22920.has_nil_QMARK_ ? f.call(null, init, null, this__22920.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__22921)) {
    return cljs.core.deref.call(null, init__22921)
  }else {
    if(!(this__22920.root == null)) {
      return this__22920.root.kv_reduce(f, init__22921)
    }else {
      if("\ufdd0'else") {
        return init__22921
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__22922 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__22923 = this;
  var this__22924 = this;
  return cljs.core.pr_str.call(null, this__22924)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__22925 = this;
  if(this__22925.cnt > 0) {
    var s__22926 = !(this__22925.root == null) ? this__22925.root.inode_seq() : null;
    if(this__22925.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__22925.nil_val], true), s__22926)
    }else {
      return s__22926
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__22927 = this;
  return this__22927.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__22928 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__22929 = this;
  return new cljs.core.PersistentHashMap(meta, this__22929.cnt, this__22929.root, this__22929.has_nil_QMARK_, this__22929.nil_val, this__22929.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__22930 = this;
  return this__22930.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__22931 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__22931.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__22932 = this;
  if(k == null) {
    if(this__22932.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__22932.meta, this__22932.cnt - 1, this__22932.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__22932.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__22933 = this__22932.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__22933 === this__22932.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__22932.meta, this__22932.cnt - 1, new_root__22933, this__22932.has_nil_QMARK_, this__22932.nil_val, null)
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
  var len__22935 = ks.length;
  var i__22936 = 0;
  var out__22937 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__22936 < len__22935) {
      var G__22938 = i__22936 + 1;
      var G__22939 = cljs.core.assoc_BANG_.call(null, out__22937, ks[i__22936], vs[i__22936]);
      i__22936 = G__22938;
      out__22937 = G__22939;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__22937)
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
  var this__22940 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__22941 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__22942 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__22943 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__22944 = this;
  if(k == null) {
    if(this__22944.has_nil_QMARK_) {
      return this__22944.nil_val
    }else {
      return null
    }
  }else {
    if(this__22944.root == null) {
      return null
    }else {
      return this__22944.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__22945 = this;
  if(k == null) {
    if(this__22945.has_nil_QMARK_) {
      return this__22945.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__22945.root == null) {
      return not_found
    }else {
      return this__22945.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__22946 = this;
  if(this__22946.edit) {
    return this__22946.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__22947 = this;
  var tcoll__22948 = this;
  if(this__22947.edit) {
    if(function() {
      var G__22949__22950 = o;
      if(G__22949__22950) {
        if(function() {
          var or__3824__auto____22951 = G__22949__22950.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____22951) {
            return or__3824__auto____22951
          }else {
            return G__22949__22950.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__22949__22950.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__22949__22950)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__22949__22950)
      }
    }()) {
      return tcoll__22948.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__22952 = cljs.core.seq.call(null, o);
      var tcoll__22953 = tcoll__22948;
      while(true) {
        var temp__3971__auto____22954 = cljs.core.first.call(null, es__22952);
        if(cljs.core.truth_(temp__3971__auto____22954)) {
          var e__22955 = temp__3971__auto____22954;
          var G__22966 = cljs.core.next.call(null, es__22952);
          var G__22967 = tcoll__22953.assoc_BANG_(cljs.core.key.call(null, e__22955), cljs.core.val.call(null, e__22955));
          es__22952 = G__22966;
          tcoll__22953 = G__22967;
          continue
        }else {
          return tcoll__22953
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__22956 = this;
  var tcoll__22957 = this;
  if(this__22956.edit) {
    if(k == null) {
      if(this__22956.nil_val === v) {
      }else {
        this__22956.nil_val = v
      }
      if(this__22956.has_nil_QMARK_) {
      }else {
        this__22956.count = this__22956.count + 1;
        this__22956.has_nil_QMARK_ = true
      }
      return tcoll__22957
    }else {
      var added_leaf_QMARK___22958 = new cljs.core.Box(false);
      var node__22959 = (this__22956.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__22956.root).inode_assoc_BANG_(this__22956.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___22958);
      if(node__22959 === this__22956.root) {
      }else {
        this__22956.root = node__22959
      }
      if(added_leaf_QMARK___22958.val) {
        this__22956.count = this__22956.count + 1
      }else {
      }
      return tcoll__22957
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__22960 = this;
  var tcoll__22961 = this;
  if(this__22960.edit) {
    if(k == null) {
      if(this__22960.has_nil_QMARK_) {
        this__22960.has_nil_QMARK_ = false;
        this__22960.nil_val = null;
        this__22960.count = this__22960.count - 1;
        return tcoll__22961
      }else {
        return tcoll__22961
      }
    }else {
      if(this__22960.root == null) {
        return tcoll__22961
      }else {
        var removed_leaf_QMARK___22962 = new cljs.core.Box(false);
        var node__22963 = this__22960.root.inode_without_BANG_(this__22960.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___22962);
        if(node__22963 === this__22960.root) {
        }else {
          this__22960.root = node__22963
        }
        if(cljs.core.truth_(removed_leaf_QMARK___22962[0])) {
          this__22960.count = this__22960.count - 1
        }else {
        }
        return tcoll__22961
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__22964 = this;
  var tcoll__22965 = this;
  if(this__22964.edit) {
    this__22964.edit = null;
    return new cljs.core.PersistentHashMap(null, this__22964.count, this__22964.root, this__22964.has_nil_QMARK_, this__22964.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__22970 = node;
  var stack__22971 = stack;
  while(true) {
    if(!(t__22970 == null)) {
      var G__22972 = ascending_QMARK_ ? t__22970.left : t__22970.right;
      var G__22973 = cljs.core.conj.call(null, stack__22971, t__22970);
      t__22970 = G__22972;
      stack__22971 = G__22973;
      continue
    }else {
      return stack__22971
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
  var this__22974 = this;
  var h__2192__auto____22975 = this__22974.__hash;
  if(!(h__2192__auto____22975 == null)) {
    return h__2192__auto____22975
  }else {
    var h__2192__auto____22976 = cljs.core.hash_coll.call(null, coll);
    this__22974.__hash = h__2192__auto____22976;
    return h__2192__auto____22976
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__22977 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__22978 = this;
  var this__22979 = this;
  return cljs.core.pr_str.call(null, this__22979)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__22980 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__22981 = this;
  if(this__22981.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__22981.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__22982 = this;
  return cljs.core.peek.call(null, this__22982.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__22983 = this;
  var t__22984 = cljs.core.first.call(null, this__22983.stack);
  var next_stack__22985 = cljs.core.tree_map_seq_push.call(null, this__22983.ascending_QMARK_ ? t__22984.right : t__22984.left, cljs.core.next.call(null, this__22983.stack), this__22983.ascending_QMARK_);
  if(!(next_stack__22985 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__22985, this__22983.ascending_QMARK_, this__22983.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__22986 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__22987 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__22987.stack, this__22987.ascending_QMARK_, this__22987.cnt, this__22987.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__22988 = this;
  return this__22988.meta
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
        var and__3822__auto____22990 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____22990) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____22990
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
        var and__3822__auto____22992 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____22992) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____22992
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
  var init__22996 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__22996)) {
    return cljs.core.deref.call(null, init__22996)
  }else {
    var init__22997 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__22996) : init__22996;
    if(cljs.core.reduced_QMARK_.call(null, init__22997)) {
      return cljs.core.deref.call(null, init__22997)
    }else {
      var init__22998 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__22997) : init__22997;
      if(cljs.core.reduced_QMARK_.call(null, init__22998)) {
        return cljs.core.deref.call(null, init__22998)
      }else {
        return init__22998
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
  var this__23001 = this;
  var h__2192__auto____23002 = this__23001.__hash;
  if(!(h__2192__auto____23002 == null)) {
    return h__2192__auto____23002
  }else {
    var h__2192__auto____23003 = cljs.core.hash_coll.call(null, coll);
    this__23001.__hash = h__2192__auto____23003;
    return h__2192__auto____23003
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__23004 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__23005 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__23006 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__23006.key, this__23006.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__23054 = null;
  var G__23054__2 = function(this_sym23007, k) {
    var this__23009 = this;
    var this_sym23007__23010 = this;
    var node__23011 = this_sym23007__23010;
    return node__23011.cljs$core$ILookup$_lookup$arity$2(node__23011, k)
  };
  var G__23054__3 = function(this_sym23008, k, not_found) {
    var this__23009 = this;
    var this_sym23008__23012 = this;
    var node__23013 = this_sym23008__23012;
    return node__23013.cljs$core$ILookup$_lookup$arity$3(node__23013, k, not_found)
  };
  G__23054 = function(this_sym23008, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__23054__2.call(this, this_sym23008, k);
      case 3:
        return G__23054__3.call(this, this_sym23008, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__23054
}();
cljs.core.BlackNode.prototype.apply = function(this_sym22999, args23000) {
  var this__23014 = this;
  return this_sym22999.call.apply(this_sym22999, [this_sym22999].concat(args23000.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__23015 = this;
  return cljs.core.PersistentVector.fromArray([this__23015.key, this__23015.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__23016 = this;
  return this__23016.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__23017 = this;
  return this__23017.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__23018 = this;
  var node__23019 = this;
  return ins.balance_right(node__23019)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__23020 = this;
  var node__23021 = this;
  return new cljs.core.RedNode(this__23020.key, this__23020.val, this__23020.left, this__23020.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__23022 = this;
  var node__23023 = this;
  return cljs.core.balance_right_del.call(null, this__23022.key, this__23022.val, this__23022.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__23024 = this;
  var node__23025 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__23026 = this;
  var node__23027 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__23027, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__23028 = this;
  var node__23029 = this;
  return cljs.core.balance_left_del.call(null, this__23028.key, this__23028.val, del, this__23028.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__23030 = this;
  var node__23031 = this;
  return ins.balance_left(node__23031)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__23032 = this;
  var node__23033 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__23033, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__23055 = null;
  var G__23055__0 = function() {
    var this__23034 = this;
    var this__23036 = this;
    return cljs.core.pr_str.call(null, this__23036)
  };
  G__23055 = function() {
    switch(arguments.length) {
      case 0:
        return G__23055__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__23055
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__23037 = this;
  var node__23038 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__23038, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__23039 = this;
  var node__23040 = this;
  return node__23040
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__23041 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__23042 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__23043 = this;
  return cljs.core.list.call(null, this__23043.key, this__23043.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__23044 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__23045 = this;
  return this__23045.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__23046 = this;
  return cljs.core.PersistentVector.fromArray([this__23046.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__23047 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__23047.key, this__23047.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__23048 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__23049 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__23049.key, this__23049.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__23050 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__23051 = this;
  if(n === 0) {
    return this__23051.key
  }else {
    if(n === 1) {
      return this__23051.val
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
  var this__23052 = this;
  if(n === 0) {
    return this__23052.key
  }else {
    if(n === 1) {
      return this__23052.val
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
  var this__23053 = this;
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
  var this__23058 = this;
  var h__2192__auto____23059 = this__23058.__hash;
  if(!(h__2192__auto____23059 == null)) {
    return h__2192__auto____23059
  }else {
    var h__2192__auto____23060 = cljs.core.hash_coll.call(null, coll);
    this__23058.__hash = h__2192__auto____23060;
    return h__2192__auto____23060
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__23061 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__23062 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__23063 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__23063.key, this__23063.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__23111 = null;
  var G__23111__2 = function(this_sym23064, k) {
    var this__23066 = this;
    var this_sym23064__23067 = this;
    var node__23068 = this_sym23064__23067;
    return node__23068.cljs$core$ILookup$_lookup$arity$2(node__23068, k)
  };
  var G__23111__3 = function(this_sym23065, k, not_found) {
    var this__23066 = this;
    var this_sym23065__23069 = this;
    var node__23070 = this_sym23065__23069;
    return node__23070.cljs$core$ILookup$_lookup$arity$3(node__23070, k, not_found)
  };
  G__23111 = function(this_sym23065, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__23111__2.call(this, this_sym23065, k);
      case 3:
        return G__23111__3.call(this, this_sym23065, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__23111
}();
cljs.core.RedNode.prototype.apply = function(this_sym23056, args23057) {
  var this__23071 = this;
  return this_sym23056.call.apply(this_sym23056, [this_sym23056].concat(args23057.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__23072 = this;
  return cljs.core.PersistentVector.fromArray([this__23072.key, this__23072.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__23073 = this;
  return this__23073.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__23074 = this;
  return this__23074.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__23075 = this;
  var node__23076 = this;
  return new cljs.core.RedNode(this__23075.key, this__23075.val, this__23075.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__23077 = this;
  var node__23078 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__23079 = this;
  var node__23080 = this;
  return new cljs.core.RedNode(this__23079.key, this__23079.val, this__23079.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__23081 = this;
  var node__23082 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__23083 = this;
  var node__23084 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__23084, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__23085 = this;
  var node__23086 = this;
  return new cljs.core.RedNode(this__23085.key, this__23085.val, del, this__23085.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__23087 = this;
  var node__23088 = this;
  return new cljs.core.RedNode(this__23087.key, this__23087.val, ins, this__23087.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__23089 = this;
  var node__23090 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__23089.left)) {
    return new cljs.core.RedNode(this__23089.key, this__23089.val, this__23089.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__23089.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__23089.right)) {
      return new cljs.core.RedNode(this__23089.right.key, this__23089.right.val, new cljs.core.BlackNode(this__23089.key, this__23089.val, this__23089.left, this__23089.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__23089.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__23090, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__23112 = null;
  var G__23112__0 = function() {
    var this__23091 = this;
    var this__23093 = this;
    return cljs.core.pr_str.call(null, this__23093)
  };
  G__23112 = function() {
    switch(arguments.length) {
      case 0:
        return G__23112__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__23112
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__23094 = this;
  var node__23095 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__23094.right)) {
    return new cljs.core.RedNode(this__23094.key, this__23094.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__23094.left, null), this__23094.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__23094.left)) {
      return new cljs.core.RedNode(this__23094.left.key, this__23094.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__23094.left.left, null), new cljs.core.BlackNode(this__23094.key, this__23094.val, this__23094.left.right, this__23094.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__23095, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__23096 = this;
  var node__23097 = this;
  return new cljs.core.BlackNode(this__23096.key, this__23096.val, this__23096.left, this__23096.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__23098 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__23099 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__23100 = this;
  return cljs.core.list.call(null, this__23100.key, this__23100.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__23101 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__23102 = this;
  return this__23102.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__23103 = this;
  return cljs.core.PersistentVector.fromArray([this__23103.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__23104 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__23104.key, this__23104.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__23105 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__23106 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__23106.key, this__23106.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__23107 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__23108 = this;
  if(n === 0) {
    return this__23108.key
  }else {
    if(n === 1) {
      return this__23108.val
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
  var this__23109 = this;
  if(n === 0) {
    return this__23109.key
  }else {
    if(n === 1) {
      return this__23109.val
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
  var this__23110 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__23116 = comp.call(null, k, tree.key);
    if(c__23116 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__23116 < 0) {
        var ins__23117 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__23117 == null)) {
          return tree.add_left(ins__23117)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__23118 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__23118 == null)) {
            return tree.add_right(ins__23118)
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
          var app__23121 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__23121)) {
            return new cljs.core.RedNode(app__23121.key, app__23121.val, new cljs.core.RedNode(left.key, left.val, left.left, app__23121.left, null), new cljs.core.RedNode(right.key, right.val, app__23121.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__23121, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__23122 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__23122)) {
              return new cljs.core.RedNode(app__23122.key, app__23122.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__23122.left, null), new cljs.core.BlackNode(right.key, right.val, app__23122.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__23122, right.right, null))
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
    var c__23128 = comp.call(null, k, tree.key);
    if(c__23128 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__23128 < 0) {
        var del__23129 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____23130 = !(del__23129 == null);
          if(or__3824__auto____23130) {
            return or__3824__auto____23130
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__23129, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__23129, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__23131 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____23132 = !(del__23131 == null);
            if(or__3824__auto____23132) {
              return or__3824__auto____23132
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__23131)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__23131, null)
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
  var tk__23135 = tree.key;
  var c__23136 = comp.call(null, k, tk__23135);
  if(c__23136 === 0) {
    return tree.replace(tk__23135, v, tree.left, tree.right)
  }else {
    if(c__23136 < 0) {
      return tree.replace(tk__23135, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__23135, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__23139 = this;
  var h__2192__auto____23140 = this__23139.__hash;
  if(!(h__2192__auto____23140 == null)) {
    return h__2192__auto____23140
  }else {
    var h__2192__auto____23141 = cljs.core.hash_imap.call(null, coll);
    this__23139.__hash = h__2192__auto____23141;
    return h__2192__auto____23141
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__23142 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__23143 = this;
  var n__23144 = coll.entry_at(k);
  if(!(n__23144 == null)) {
    return n__23144.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__23145 = this;
  var found__23146 = [null];
  var t__23147 = cljs.core.tree_map_add.call(null, this__23145.comp, this__23145.tree, k, v, found__23146);
  if(t__23147 == null) {
    var found_node__23148 = cljs.core.nth.call(null, found__23146, 0);
    if(cljs.core._EQ_.call(null, v, found_node__23148.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__23145.comp, cljs.core.tree_map_replace.call(null, this__23145.comp, this__23145.tree, k, v), this__23145.cnt, this__23145.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__23145.comp, t__23147.blacken(), this__23145.cnt + 1, this__23145.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__23149 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__23183 = null;
  var G__23183__2 = function(this_sym23150, k) {
    var this__23152 = this;
    var this_sym23150__23153 = this;
    var coll__23154 = this_sym23150__23153;
    return coll__23154.cljs$core$ILookup$_lookup$arity$2(coll__23154, k)
  };
  var G__23183__3 = function(this_sym23151, k, not_found) {
    var this__23152 = this;
    var this_sym23151__23155 = this;
    var coll__23156 = this_sym23151__23155;
    return coll__23156.cljs$core$ILookup$_lookup$arity$3(coll__23156, k, not_found)
  };
  G__23183 = function(this_sym23151, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__23183__2.call(this, this_sym23151, k);
      case 3:
        return G__23183__3.call(this, this_sym23151, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__23183
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym23137, args23138) {
  var this__23157 = this;
  return this_sym23137.call.apply(this_sym23137, [this_sym23137].concat(args23138.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__23158 = this;
  if(!(this__23158.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__23158.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__23159 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__23160 = this;
  if(this__23160.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__23160.tree, false, this__23160.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__23161 = this;
  var this__23162 = this;
  return cljs.core.pr_str.call(null, this__23162)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__23163 = this;
  var coll__23164 = this;
  var t__23165 = this__23163.tree;
  while(true) {
    if(!(t__23165 == null)) {
      var c__23166 = this__23163.comp.call(null, k, t__23165.key);
      if(c__23166 === 0) {
        return t__23165
      }else {
        if(c__23166 < 0) {
          var G__23184 = t__23165.left;
          t__23165 = G__23184;
          continue
        }else {
          if("\ufdd0'else") {
            var G__23185 = t__23165.right;
            t__23165 = G__23185;
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
  var this__23167 = this;
  if(this__23167.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__23167.tree, ascending_QMARK_, this__23167.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__23168 = this;
  if(this__23168.cnt > 0) {
    var stack__23169 = null;
    var t__23170 = this__23168.tree;
    while(true) {
      if(!(t__23170 == null)) {
        var c__23171 = this__23168.comp.call(null, k, t__23170.key);
        if(c__23171 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__23169, t__23170), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__23171 < 0) {
              var G__23186 = cljs.core.conj.call(null, stack__23169, t__23170);
              var G__23187 = t__23170.left;
              stack__23169 = G__23186;
              t__23170 = G__23187;
              continue
            }else {
              var G__23188 = stack__23169;
              var G__23189 = t__23170.right;
              stack__23169 = G__23188;
              t__23170 = G__23189;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__23171 > 0) {
                var G__23190 = cljs.core.conj.call(null, stack__23169, t__23170);
                var G__23191 = t__23170.right;
                stack__23169 = G__23190;
                t__23170 = G__23191;
                continue
              }else {
                var G__23192 = stack__23169;
                var G__23193 = t__23170.left;
                stack__23169 = G__23192;
                t__23170 = G__23193;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__23169 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__23169, ascending_QMARK_, -1, null)
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
  var this__23172 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__23173 = this;
  return this__23173.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__23174 = this;
  if(this__23174.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__23174.tree, true, this__23174.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__23175 = this;
  return this__23175.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__23176 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__23177 = this;
  return new cljs.core.PersistentTreeMap(this__23177.comp, this__23177.tree, this__23177.cnt, meta, this__23177.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__23178 = this;
  return this__23178.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__23179 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__23179.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__23180 = this;
  var found__23181 = [null];
  var t__23182 = cljs.core.tree_map_remove.call(null, this__23180.comp, this__23180.tree, k, found__23181);
  if(t__23182 == null) {
    if(cljs.core.nth.call(null, found__23181, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__23180.comp, null, 0, this__23180.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__23180.comp, t__23182.blacken(), this__23180.cnt - 1, this__23180.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__23196 = cljs.core.seq.call(null, keyvals);
    var out__23197 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__23196) {
        var G__23198 = cljs.core.nnext.call(null, in__23196);
        var G__23199 = cljs.core.assoc_BANG_.call(null, out__23197, cljs.core.first.call(null, in__23196), cljs.core.second.call(null, in__23196));
        in__23196 = G__23198;
        out__23197 = G__23199;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__23197)
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
  hash_map.cljs$lang$applyTo = function(arglist__23200) {
    var keyvals = cljs.core.seq(arglist__23200);
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
  array_map.cljs$lang$applyTo = function(arglist__23201) {
    var keyvals = cljs.core.seq(arglist__23201);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__23205 = [];
    var obj__23206 = {};
    var kvs__23207 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__23207) {
        ks__23205.push(cljs.core.first.call(null, kvs__23207));
        obj__23206[cljs.core.first.call(null, kvs__23207)] = cljs.core.second.call(null, kvs__23207);
        var G__23208 = cljs.core.nnext.call(null, kvs__23207);
        kvs__23207 = G__23208;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__23205, obj__23206)
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
  obj_map.cljs$lang$applyTo = function(arglist__23209) {
    var keyvals = cljs.core.seq(arglist__23209);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__23212 = cljs.core.seq.call(null, keyvals);
    var out__23213 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__23212) {
        var G__23214 = cljs.core.nnext.call(null, in__23212);
        var G__23215 = cljs.core.assoc.call(null, out__23213, cljs.core.first.call(null, in__23212), cljs.core.second.call(null, in__23212));
        in__23212 = G__23214;
        out__23213 = G__23215;
        continue
      }else {
        return out__23213
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
  sorted_map.cljs$lang$applyTo = function(arglist__23216) {
    var keyvals = cljs.core.seq(arglist__23216);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__23219 = cljs.core.seq.call(null, keyvals);
    var out__23220 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__23219) {
        var G__23221 = cljs.core.nnext.call(null, in__23219);
        var G__23222 = cljs.core.assoc.call(null, out__23220, cljs.core.first.call(null, in__23219), cljs.core.second.call(null, in__23219));
        in__23219 = G__23221;
        out__23220 = G__23222;
        continue
      }else {
        return out__23220
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__23223) {
    var comparator = cljs.core.first(arglist__23223);
    var keyvals = cljs.core.rest(arglist__23223);
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
      return cljs.core.reduce.call(null, function(p1__23224_SHARP_, p2__23225_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____23227 = p1__23224_SHARP_;
          if(cljs.core.truth_(or__3824__auto____23227)) {
            return or__3824__auto____23227
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__23225_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__23228) {
    var maps = cljs.core.seq(arglist__23228);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__23236 = function(m, e) {
        var k__23234 = cljs.core.first.call(null, e);
        var v__23235 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__23234)) {
          return cljs.core.assoc.call(null, m, k__23234, f.call(null, cljs.core._lookup.call(null, m, k__23234, null), v__23235))
        }else {
          return cljs.core.assoc.call(null, m, k__23234, v__23235)
        }
      };
      var merge2__23238 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__23236, function() {
          var or__3824__auto____23237 = m1;
          if(cljs.core.truth_(or__3824__auto____23237)) {
            return or__3824__auto____23237
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__23238, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__23239) {
    var f = cljs.core.first(arglist__23239);
    var maps = cljs.core.rest(arglist__23239);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__23244 = cljs.core.ObjMap.EMPTY;
  var keys__23245 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__23245) {
      var key__23246 = cljs.core.first.call(null, keys__23245);
      var entry__23247 = cljs.core._lookup.call(null, map, key__23246, "\ufdd0'cljs.core/not-found");
      var G__23248 = cljs.core.not_EQ_.call(null, entry__23247, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__23244, key__23246, entry__23247) : ret__23244;
      var G__23249 = cljs.core.next.call(null, keys__23245);
      ret__23244 = G__23248;
      keys__23245 = G__23249;
      continue
    }else {
      return ret__23244
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
  var this__23253 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__23253.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__23254 = this;
  var h__2192__auto____23255 = this__23254.__hash;
  if(!(h__2192__auto____23255 == null)) {
    return h__2192__auto____23255
  }else {
    var h__2192__auto____23256 = cljs.core.hash_iset.call(null, coll);
    this__23254.__hash = h__2192__auto____23256;
    return h__2192__auto____23256
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__23257 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__23258 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__23258.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__23279 = null;
  var G__23279__2 = function(this_sym23259, k) {
    var this__23261 = this;
    var this_sym23259__23262 = this;
    var coll__23263 = this_sym23259__23262;
    return coll__23263.cljs$core$ILookup$_lookup$arity$2(coll__23263, k)
  };
  var G__23279__3 = function(this_sym23260, k, not_found) {
    var this__23261 = this;
    var this_sym23260__23264 = this;
    var coll__23265 = this_sym23260__23264;
    return coll__23265.cljs$core$ILookup$_lookup$arity$3(coll__23265, k, not_found)
  };
  G__23279 = function(this_sym23260, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__23279__2.call(this, this_sym23260, k);
      case 3:
        return G__23279__3.call(this, this_sym23260, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__23279
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym23251, args23252) {
  var this__23266 = this;
  return this_sym23251.call.apply(this_sym23251, [this_sym23251].concat(args23252.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__23267 = this;
  return new cljs.core.PersistentHashSet(this__23267.meta, cljs.core.assoc.call(null, this__23267.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__23268 = this;
  var this__23269 = this;
  return cljs.core.pr_str.call(null, this__23269)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__23270 = this;
  return cljs.core.keys.call(null, this__23270.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__23271 = this;
  return new cljs.core.PersistentHashSet(this__23271.meta, cljs.core.dissoc.call(null, this__23271.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__23272 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__23273 = this;
  var and__3822__auto____23274 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____23274) {
    var and__3822__auto____23275 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____23275) {
      return cljs.core.every_QMARK_.call(null, function(p1__23250_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__23250_SHARP_)
      }, other)
    }else {
      return and__3822__auto____23275
    }
  }else {
    return and__3822__auto____23274
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__23276 = this;
  return new cljs.core.PersistentHashSet(meta, this__23276.hash_map, this__23276.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__23277 = this;
  return this__23277.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__23278 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__23278.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__23280 = cljs.core.count.call(null, items);
  var i__23281 = 0;
  var out__23282 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__23281 < len__23280) {
      var G__23283 = i__23281 + 1;
      var G__23284 = cljs.core.conj_BANG_.call(null, out__23282, items[i__23281]);
      i__23281 = G__23283;
      out__23282 = G__23284;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__23282)
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
  var G__23302 = null;
  var G__23302__2 = function(this_sym23288, k) {
    var this__23290 = this;
    var this_sym23288__23291 = this;
    var tcoll__23292 = this_sym23288__23291;
    if(cljs.core._lookup.call(null, this__23290.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__23302__3 = function(this_sym23289, k, not_found) {
    var this__23290 = this;
    var this_sym23289__23293 = this;
    var tcoll__23294 = this_sym23289__23293;
    if(cljs.core._lookup.call(null, this__23290.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__23302 = function(this_sym23289, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__23302__2.call(this, this_sym23289, k);
      case 3:
        return G__23302__3.call(this, this_sym23289, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__23302
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym23286, args23287) {
  var this__23295 = this;
  return this_sym23286.call.apply(this_sym23286, [this_sym23286].concat(args23287.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__23296 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__23297 = this;
  if(cljs.core._lookup.call(null, this__23297.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__23298 = this;
  return cljs.core.count.call(null, this__23298.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__23299 = this;
  this__23299.transient_map = cljs.core.dissoc_BANG_.call(null, this__23299.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__23300 = this;
  this__23300.transient_map = cljs.core.assoc_BANG_.call(null, this__23300.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__23301 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__23301.transient_map), null)
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
  var this__23305 = this;
  var h__2192__auto____23306 = this__23305.__hash;
  if(!(h__2192__auto____23306 == null)) {
    return h__2192__auto____23306
  }else {
    var h__2192__auto____23307 = cljs.core.hash_iset.call(null, coll);
    this__23305.__hash = h__2192__auto____23307;
    return h__2192__auto____23307
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__23308 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__23309 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__23309.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__23335 = null;
  var G__23335__2 = function(this_sym23310, k) {
    var this__23312 = this;
    var this_sym23310__23313 = this;
    var coll__23314 = this_sym23310__23313;
    return coll__23314.cljs$core$ILookup$_lookup$arity$2(coll__23314, k)
  };
  var G__23335__3 = function(this_sym23311, k, not_found) {
    var this__23312 = this;
    var this_sym23311__23315 = this;
    var coll__23316 = this_sym23311__23315;
    return coll__23316.cljs$core$ILookup$_lookup$arity$3(coll__23316, k, not_found)
  };
  G__23335 = function(this_sym23311, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__23335__2.call(this, this_sym23311, k);
      case 3:
        return G__23335__3.call(this, this_sym23311, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__23335
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym23303, args23304) {
  var this__23317 = this;
  return this_sym23303.call.apply(this_sym23303, [this_sym23303].concat(args23304.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__23318 = this;
  return new cljs.core.PersistentTreeSet(this__23318.meta, cljs.core.assoc.call(null, this__23318.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__23319 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__23319.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__23320 = this;
  var this__23321 = this;
  return cljs.core.pr_str.call(null, this__23321)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__23322 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__23322.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__23323 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__23323.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__23324 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__23325 = this;
  return cljs.core._comparator.call(null, this__23325.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__23326 = this;
  return cljs.core.keys.call(null, this__23326.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__23327 = this;
  return new cljs.core.PersistentTreeSet(this__23327.meta, cljs.core.dissoc.call(null, this__23327.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__23328 = this;
  return cljs.core.count.call(null, this__23328.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__23329 = this;
  var and__3822__auto____23330 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____23330) {
    var and__3822__auto____23331 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____23331) {
      return cljs.core.every_QMARK_.call(null, function(p1__23285_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__23285_SHARP_)
      }, other)
    }else {
      return and__3822__auto____23331
    }
  }else {
    return and__3822__auto____23330
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__23332 = this;
  return new cljs.core.PersistentTreeSet(meta, this__23332.tree_map, this__23332.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__23333 = this;
  return this__23333.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__23334 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__23334.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__23340__delegate = function(keys) {
      var in__23338 = cljs.core.seq.call(null, keys);
      var out__23339 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__23338)) {
          var G__23341 = cljs.core.next.call(null, in__23338);
          var G__23342 = cljs.core.conj_BANG_.call(null, out__23339, cljs.core.first.call(null, in__23338));
          in__23338 = G__23341;
          out__23339 = G__23342;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__23339)
        }
        break
      }
    };
    var G__23340 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__23340__delegate.call(this, keys)
    };
    G__23340.cljs$lang$maxFixedArity = 0;
    G__23340.cljs$lang$applyTo = function(arglist__23343) {
      var keys = cljs.core.seq(arglist__23343);
      return G__23340__delegate(keys)
    };
    G__23340.cljs$lang$arity$variadic = G__23340__delegate;
    return G__23340
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
  sorted_set.cljs$lang$applyTo = function(arglist__23344) {
    var keys = cljs.core.seq(arglist__23344);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__23346) {
    var comparator = cljs.core.first(arglist__23346);
    var keys = cljs.core.rest(arglist__23346);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__23352 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____23353 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____23353)) {
        var e__23354 = temp__3971__auto____23353;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__23354))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__23352, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__23345_SHARP_) {
      var temp__3971__auto____23355 = cljs.core.find.call(null, smap, p1__23345_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____23355)) {
        var e__23356 = temp__3971__auto____23355;
        return cljs.core.second.call(null, e__23356)
      }else {
        return p1__23345_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__23386 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__23379, seen) {
        while(true) {
          var vec__23380__23381 = p__23379;
          var f__23382 = cljs.core.nth.call(null, vec__23380__23381, 0, null);
          var xs__23383 = vec__23380__23381;
          var temp__3974__auto____23384 = cljs.core.seq.call(null, xs__23383);
          if(temp__3974__auto____23384) {
            var s__23385 = temp__3974__auto____23384;
            if(cljs.core.contains_QMARK_.call(null, seen, f__23382)) {
              var G__23387 = cljs.core.rest.call(null, s__23385);
              var G__23388 = seen;
              p__23379 = G__23387;
              seen = G__23388;
              continue
            }else {
              return cljs.core.cons.call(null, f__23382, step.call(null, cljs.core.rest.call(null, s__23385), cljs.core.conj.call(null, seen, f__23382)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__23386.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__23391 = cljs.core.PersistentVector.EMPTY;
  var s__23392 = s;
  while(true) {
    if(cljs.core.next.call(null, s__23392)) {
      var G__23393 = cljs.core.conj.call(null, ret__23391, cljs.core.first.call(null, s__23392));
      var G__23394 = cljs.core.next.call(null, s__23392);
      ret__23391 = G__23393;
      s__23392 = G__23394;
      continue
    }else {
      return cljs.core.seq.call(null, ret__23391)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____23397 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____23397) {
        return or__3824__auto____23397
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__23398 = x.lastIndexOf("/");
      if(i__23398 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__23398 + 1)
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
    var or__3824__auto____23401 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____23401) {
      return or__3824__auto____23401
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__23402 = x.lastIndexOf("/");
    if(i__23402 > -1) {
      return cljs.core.subs.call(null, x, 2, i__23402)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__23409 = cljs.core.ObjMap.EMPTY;
  var ks__23410 = cljs.core.seq.call(null, keys);
  var vs__23411 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____23412 = ks__23410;
      if(and__3822__auto____23412) {
        return vs__23411
      }else {
        return and__3822__auto____23412
      }
    }()) {
      var G__23413 = cljs.core.assoc.call(null, map__23409, cljs.core.first.call(null, ks__23410), cljs.core.first.call(null, vs__23411));
      var G__23414 = cljs.core.next.call(null, ks__23410);
      var G__23415 = cljs.core.next.call(null, vs__23411);
      map__23409 = G__23413;
      ks__23410 = G__23414;
      vs__23411 = G__23415;
      continue
    }else {
      return map__23409
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
    var G__23418__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__23403_SHARP_, p2__23404_SHARP_) {
        return max_key.call(null, k, p1__23403_SHARP_, p2__23404_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__23418 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__23418__delegate.call(this, k, x, y, more)
    };
    G__23418.cljs$lang$maxFixedArity = 3;
    G__23418.cljs$lang$applyTo = function(arglist__23419) {
      var k = cljs.core.first(arglist__23419);
      var x = cljs.core.first(cljs.core.next(arglist__23419));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__23419)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__23419)));
      return G__23418__delegate(k, x, y, more)
    };
    G__23418.cljs$lang$arity$variadic = G__23418__delegate;
    return G__23418
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
    var G__23420__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__23416_SHARP_, p2__23417_SHARP_) {
        return min_key.call(null, k, p1__23416_SHARP_, p2__23417_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__23420 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__23420__delegate.call(this, k, x, y, more)
    };
    G__23420.cljs$lang$maxFixedArity = 3;
    G__23420.cljs$lang$applyTo = function(arglist__23421) {
      var k = cljs.core.first(arglist__23421);
      var x = cljs.core.first(cljs.core.next(arglist__23421));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__23421)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__23421)));
      return G__23420__delegate(k, x, y, more)
    };
    G__23420.cljs$lang$arity$variadic = G__23420__delegate;
    return G__23420
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
      var temp__3974__auto____23424 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____23424) {
        var s__23425 = temp__3974__auto____23424;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__23425), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__23425)))
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
    var temp__3974__auto____23428 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____23428) {
      var s__23429 = temp__3974__auto____23428;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__23429)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__23429), take_while.call(null, pred, cljs.core.rest.call(null, s__23429)))
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
    var comp__23431 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__23431.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__23443 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____23444 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____23444)) {
        var vec__23445__23446 = temp__3974__auto____23444;
        var e__23447 = cljs.core.nth.call(null, vec__23445__23446, 0, null);
        var s__23448 = vec__23445__23446;
        if(cljs.core.truth_(include__23443.call(null, e__23447))) {
          return s__23448
        }else {
          return cljs.core.next.call(null, s__23448)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__23443, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____23449 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____23449)) {
      var vec__23450__23451 = temp__3974__auto____23449;
      var e__23452 = cljs.core.nth.call(null, vec__23450__23451, 0, null);
      var s__23453 = vec__23450__23451;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__23452)) ? s__23453 : cljs.core.next.call(null, s__23453))
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
    var include__23465 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____23466 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____23466)) {
        var vec__23467__23468 = temp__3974__auto____23466;
        var e__23469 = cljs.core.nth.call(null, vec__23467__23468, 0, null);
        var s__23470 = vec__23467__23468;
        if(cljs.core.truth_(include__23465.call(null, e__23469))) {
          return s__23470
        }else {
          return cljs.core.next.call(null, s__23470)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__23465, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____23471 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____23471)) {
      var vec__23472__23473 = temp__3974__auto____23471;
      var e__23474 = cljs.core.nth.call(null, vec__23472__23473, 0, null);
      var s__23475 = vec__23472__23473;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__23474)) ? s__23475 : cljs.core.next.call(null, s__23475))
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
  var this__23476 = this;
  var h__2192__auto____23477 = this__23476.__hash;
  if(!(h__2192__auto____23477 == null)) {
    return h__2192__auto____23477
  }else {
    var h__2192__auto____23478 = cljs.core.hash_coll.call(null, rng);
    this__23476.__hash = h__2192__auto____23478;
    return h__2192__auto____23478
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__23479 = this;
  if(this__23479.step > 0) {
    if(this__23479.start + this__23479.step < this__23479.end) {
      return new cljs.core.Range(this__23479.meta, this__23479.start + this__23479.step, this__23479.end, this__23479.step, null)
    }else {
      return null
    }
  }else {
    if(this__23479.start + this__23479.step > this__23479.end) {
      return new cljs.core.Range(this__23479.meta, this__23479.start + this__23479.step, this__23479.end, this__23479.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__23480 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__23481 = this;
  var this__23482 = this;
  return cljs.core.pr_str.call(null, this__23482)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__23483 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__23484 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__23485 = this;
  if(this__23485.step > 0) {
    if(this__23485.start < this__23485.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__23485.start > this__23485.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__23486 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__23486.end - this__23486.start) / this__23486.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__23487 = this;
  return this__23487.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__23488 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__23488.meta, this__23488.start + this__23488.step, this__23488.end, this__23488.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__23489 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__23490 = this;
  return new cljs.core.Range(meta, this__23490.start, this__23490.end, this__23490.step, this__23490.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__23491 = this;
  return this__23491.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__23492 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__23492.start + n * this__23492.step
  }else {
    if(function() {
      var and__3822__auto____23493 = this__23492.start > this__23492.end;
      if(and__3822__auto____23493) {
        return this__23492.step === 0
      }else {
        return and__3822__auto____23493
      }
    }()) {
      return this__23492.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__23494 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__23494.start + n * this__23494.step
  }else {
    if(function() {
      var and__3822__auto____23495 = this__23494.start > this__23494.end;
      if(and__3822__auto____23495) {
        return this__23494.step === 0
      }else {
        return and__3822__auto____23495
      }
    }()) {
      return this__23494.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__23496 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__23496.meta)
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
    var temp__3974__auto____23499 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____23499) {
      var s__23500 = temp__3974__auto____23499;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__23500), take_nth.call(null, n, cljs.core.drop.call(null, n, s__23500)))
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
    var temp__3974__auto____23507 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____23507) {
      var s__23508 = temp__3974__auto____23507;
      var fst__23509 = cljs.core.first.call(null, s__23508);
      var fv__23510 = f.call(null, fst__23509);
      var run__23511 = cljs.core.cons.call(null, fst__23509, cljs.core.take_while.call(null, function(p1__23501_SHARP_) {
        return cljs.core._EQ_.call(null, fv__23510, f.call(null, p1__23501_SHARP_))
      }, cljs.core.next.call(null, s__23508)));
      return cljs.core.cons.call(null, run__23511, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__23511), s__23508))))
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
      var temp__3971__auto____23526 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____23526) {
        var s__23527 = temp__3971__auto____23526;
        return reductions.call(null, f, cljs.core.first.call(null, s__23527), cljs.core.rest.call(null, s__23527))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____23528 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____23528) {
        var s__23529 = temp__3974__auto____23528;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__23529)), cljs.core.rest.call(null, s__23529))
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
      var G__23532 = null;
      var G__23532__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__23532__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__23532__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__23532__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__23532__4 = function() {
        var G__23533__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__23533 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__23533__delegate.call(this, x, y, z, args)
        };
        G__23533.cljs$lang$maxFixedArity = 3;
        G__23533.cljs$lang$applyTo = function(arglist__23534) {
          var x = cljs.core.first(arglist__23534);
          var y = cljs.core.first(cljs.core.next(arglist__23534));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__23534)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__23534)));
          return G__23533__delegate(x, y, z, args)
        };
        G__23533.cljs$lang$arity$variadic = G__23533__delegate;
        return G__23533
      }();
      G__23532 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__23532__0.call(this);
          case 1:
            return G__23532__1.call(this, x);
          case 2:
            return G__23532__2.call(this, x, y);
          case 3:
            return G__23532__3.call(this, x, y, z);
          default:
            return G__23532__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__23532.cljs$lang$maxFixedArity = 3;
      G__23532.cljs$lang$applyTo = G__23532__4.cljs$lang$applyTo;
      return G__23532
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__23535 = null;
      var G__23535__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__23535__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__23535__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__23535__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__23535__4 = function() {
        var G__23536__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__23536 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__23536__delegate.call(this, x, y, z, args)
        };
        G__23536.cljs$lang$maxFixedArity = 3;
        G__23536.cljs$lang$applyTo = function(arglist__23537) {
          var x = cljs.core.first(arglist__23537);
          var y = cljs.core.first(cljs.core.next(arglist__23537));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__23537)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__23537)));
          return G__23536__delegate(x, y, z, args)
        };
        G__23536.cljs$lang$arity$variadic = G__23536__delegate;
        return G__23536
      }();
      G__23535 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__23535__0.call(this);
          case 1:
            return G__23535__1.call(this, x);
          case 2:
            return G__23535__2.call(this, x, y);
          case 3:
            return G__23535__3.call(this, x, y, z);
          default:
            return G__23535__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__23535.cljs$lang$maxFixedArity = 3;
      G__23535.cljs$lang$applyTo = G__23535__4.cljs$lang$applyTo;
      return G__23535
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__23538 = null;
      var G__23538__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__23538__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__23538__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__23538__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__23538__4 = function() {
        var G__23539__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__23539 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__23539__delegate.call(this, x, y, z, args)
        };
        G__23539.cljs$lang$maxFixedArity = 3;
        G__23539.cljs$lang$applyTo = function(arglist__23540) {
          var x = cljs.core.first(arglist__23540);
          var y = cljs.core.first(cljs.core.next(arglist__23540));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__23540)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__23540)));
          return G__23539__delegate(x, y, z, args)
        };
        G__23539.cljs$lang$arity$variadic = G__23539__delegate;
        return G__23539
      }();
      G__23538 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__23538__0.call(this);
          case 1:
            return G__23538__1.call(this, x);
          case 2:
            return G__23538__2.call(this, x, y);
          case 3:
            return G__23538__3.call(this, x, y, z);
          default:
            return G__23538__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__23538.cljs$lang$maxFixedArity = 3;
      G__23538.cljs$lang$applyTo = G__23538__4.cljs$lang$applyTo;
      return G__23538
    }()
  };
  var juxt__4 = function() {
    var G__23541__delegate = function(f, g, h, fs) {
      var fs__23531 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__23542 = null;
        var G__23542__0 = function() {
          return cljs.core.reduce.call(null, function(p1__23512_SHARP_, p2__23513_SHARP_) {
            return cljs.core.conj.call(null, p1__23512_SHARP_, p2__23513_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__23531)
        };
        var G__23542__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__23514_SHARP_, p2__23515_SHARP_) {
            return cljs.core.conj.call(null, p1__23514_SHARP_, p2__23515_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__23531)
        };
        var G__23542__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__23516_SHARP_, p2__23517_SHARP_) {
            return cljs.core.conj.call(null, p1__23516_SHARP_, p2__23517_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__23531)
        };
        var G__23542__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__23518_SHARP_, p2__23519_SHARP_) {
            return cljs.core.conj.call(null, p1__23518_SHARP_, p2__23519_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__23531)
        };
        var G__23542__4 = function() {
          var G__23543__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__23520_SHARP_, p2__23521_SHARP_) {
              return cljs.core.conj.call(null, p1__23520_SHARP_, cljs.core.apply.call(null, p2__23521_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__23531)
          };
          var G__23543 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__23543__delegate.call(this, x, y, z, args)
          };
          G__23543.cljs$lang$maxFixedArity = 3;
          G__23543.cljs$lang$applyTo = function(arglist__23544) {
            var x = cljs.core.first(arglist__23544);
            var y = cljs.core.first(cljs.core.next(arglist__23544));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__23544)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__23544)));
            return G__23543__delegate(x, y, z, args)
          };
          G__23543.cljs$lang$arity$variadic = G__23543__delegate;
          return G__23543
        }();
        G__23542 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__23542__0.call(this);
            case 1:
              return G__23542__1.call(this, x);
            case 2:
              return G__23542__2.call(this, x, y);
            case 3:
              return G__23542__3.call(this, x, y, z);
            default:
              return G__23542__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__23542.cljs$lang$maxFixedArity = 3;
        G__23542.cljs$lang$applyTo = G__23542__4.cljs$lang$applyTo;
        return G__23542
      }()
    };
    var G__23541 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__23541__delegate.call(this, f, g, h, fs)
    };
    G__23541.cljs$lang$maxFixedArity = 3;
    G__23541.cljs$lang$applyTo = function(arglist__23545) {
      var f = cljs.core.first(arglist__23545);
      var g = cljs.core.first(cljs.core.next(arglist__23545));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__23545)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__23545)));
      return G__23541__delegate(f, g, h, fs)
    };
    G__23541.cljs$lang$arity$variadic = G__23541__delegate;
    return G__23541
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
        var G__23548 = cljs.core.next.call(null, coll);
        coll = G__23548;
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
        var and__3822__auto____23547 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____23547) {
          return n > 0
        }else {
          return and__3822__auto____23547
        }
      }())) {
        var G__23549 = n - 1;
        var G__23550 = cljs.core.next.call(null, coll);
        n = G__23549;
        coll = G__23550;
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
  var matches__23552 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__23552), s)) {
    if(cljs.core.count.call(null, matches__23552) === 1) {
      return cljs.core.first.call(null, matches__23552)
    }else {
      return cljs.core.vec.call(null, matches__23552)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__23554 = re.exec(s);
  if(matches__23554 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__23554) === 1) {
      return cljs.core.first.call(null, matches__23554)
    }else {
      return cljs.core.vec.call(null, matches__23554)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__23559 = cljs.core.re_find.call(null, re, s);
  var match_idx__23560 = s.search(re);
  var match_str__23561 = cljs.core.coll_QMARK_.call(null, match_data__23559) ? cljs.core.first.call(null, match_data__23559) : match_data__23559;
  var post_match__23562 = cljs.core.subs.call(null, s, match_idx__23560 + cljs.core.count.call(null, match_str__23561));
  if(cljs.core.truth_(match_data__23559)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__23559, re_seq.call(null, re, post_match__23562))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__23569__23570 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___23571 = cljs.core.nth.call(null, vec__23569__23570, 0, null);
  var flags__23572 = cljs.core.nth.call(null, vec__23569__23570, 1, null);
  var pattern__23573 = cljs.core.nth.call(null, vec__23569__23570, 2, null);
  return new RegExp(pattern__23573, flags__23572)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__23563_SHARP_) {
    return print_one.call(null, p1__23563_SHARP_, opts)
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
          var and__3822__auto____23583 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____23583)) {
            var and__3822__auto____23587 = function() {
              var G__23584__23585 = obj;
              if(G__23584__23585) {
                if(function() {
                  var or__3824__auto____23586 = G__23584__23585.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____23586) {
                    return or__3824__auto____23586
                  }else {
                    return G__23584__23585.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__23584__23585.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__23584__23585)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__23584__23585)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____23587)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____23587
            }
          }else {
            return and__3822__auto____23583
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____23588 = !(obj == null);
          if(and__3822__auto____23588) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____23588
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__23589__23590 = obj;
          if(G__23589__23590) {
            if(function() {
              var or__3824__auto____23591 = G__23589__23590.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____23591) {
                return or__3824__auto____23591
              }else {
                return G__23589__23590.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__23589__23590.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__23589__23590)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__23589__23590)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__23611 = new goog.string.StringBuffer;
  var G__23612__23613 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__23612__23613) {
    var string__23614 = cljs.core.first.call(null, G__23612__23613);
    var G__23612__23615 = G__23612__23613;
    while(true) {
      sb__23611.append(string__23614);
      var temp__3974__auto____23616 = cljs.core.next.call(null, G__23612__23615);
      if(temp__3974__auto____23616) {
        var G__23612__23617 = temp__3974__auto____23616;
        var G__23630 = cljs.core.first.call(null, G__23612__23617);
        var G__23631 = G__23612__23617;
        string__23614 = G__23630;
        G__23612__23615 = G__23631;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__23618__23619 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__23618__23619) {
    var obj__23620 = cljs.core.first.call(null, G__23618__23619);
    var G__23618__23621 = G__23618__23619;
    while(true) {
      sb__23611.append(" ");
      var G__23622__23623 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__23620, opts));
      if(G__23622__23623) {
        var string__23624 = cljs.core.first.call(null, G__23622__23623);
        var G__23622__23625 = G__23622__23623;
        while(true) {
          sb__23611.append(string__23624);
          var temp__3974__auto____23626 = cljs.core.next.call(null, G__23622__23625);
          if(temp__3974__auto____23626) {
            var G__23622__23627 = temp__3974__auto____23626;
            var G__23632 = cljs.core.first.call(null, G__23622__23627);
            var G__23633 = G__23622__23627;
            string__23624 = G__23632;
            G__23622__23625 = G__23633;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____23628 = cljs.core.next.call(null, G__23618__23621);
      if(temp__3974__auto____23628) {
        var G__23618__23629 = temp__3974__auto____23628;
        var G__23634 = cljs.core.first.call(null, G__23618__23629);
        var G__23635 = G__23618__23629;
        obj__23620 = G__23634;
        G__23618__23621 = G__23635;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__23611
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__23637 = cljs.core.pr_sb.call(null, objs, opts);
  sb__23637.append("\n");
  return[cljs.core.str(sb__23637)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__23656__23657 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__23656__23657) {
    var string__23658 = cljs.core.first.call(null, G__23656__23657);
    var G__23656__23659 = G__23656__23657;
    while(true) {
      cljs.core.string_print.call(null, string__23658);
      var temp__3974__auto____23660 = cljs.core.next.call(null, G__23656__23659);
      if(temp__3974__auto____23660) {
        var G__23656__23661 = temp__3974__auto____23660;
        var G__23674 = cljs.core.first.call(null, G__23656__23661);
        var G__23675 = G__23656__23661;
        string__23658 = G__23674;
        G__23656__23659 = G__23675;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__23662__23663 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__23662__23663) {
    var obj__23664 = cljs.core.first.call(null, G__23662__23663);
    var G__23662__23665 = G__23662__23663;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__23666__23667 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__23664, opts));
      if(G__23666__23667) {
        var string__23668 = cljs.core.first.call(null, G__23666__23667);
        var G__23666__23669 = G__23666__23667;
        while(true) {
          cljs.core.string_print.call(null, string__23668);
          var temp__3974__auto____23670 = cljs.core.next.call(null, G__23666__23669);
          if(temp__3974__auto____23670) {
            var G__23666__23671 = temp__3974__auto____23670;
            var G__23676 = cljs.core.first.call(null, G__23666__23671);
            var G__23677 = G__23666__23671;
            string__23668 = G__23676;
            G__23666__23669 = G__23677;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____23672 = cljs.core.next.call(null, G__23662__23665);
      if(temp__3974__auto____23672) {
        var G__23662__23673 = temp__3974__auto____23672;
        var G__23678 = cljs.core.first.call(null, G__23662__23673);
        var G__23679 = G__23662__23673;
        obj__23664 = G__23678;
        G__23662__23665 = G__23679;
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
  pr_str.cljs$lang$applyTo = function(arglist__23680) {
    var objs = cljs.core.seq(arglist__23680);
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
  prn_str.cljs$lang$applyTo = function(arglist__23681) {
    var objs = cljs.core.seq(arglist__23681);
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
  pr.cljs$lang$applyTo = function(arglist__23682) {
    var objs = cljs.core.seq(arglist__23682);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__23683) {
    var objs = cljs.core.seq(arglist__23683);
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
  print_str.cljs$lang$applyTo = function(arglist__23684) {
    var objs = cljs.core.seq(arglist__23684);
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
  println.cljs$lang$applyTo = function(arglist__23685) {
    var objs = cljs.core.seq(arglist__23685);
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
  println_str.cljs$lang$applyTo = function(arglist__23686) {
    var objs = cljs.core.seq(arglist__23686);
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
  prn.cljs$lang$applyTo = function(arglist__23687) {
    var objs = cljs.core.seq(arglist__23687);
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
  printf.cljs$lang$applyTo = function(arglist__23688) {
    var fmt = cljs.core.first(arglist__23688);
    var args = cljs.core.rest(arglist__23688);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__23689 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__23689, "{", ", ", "}", opts, coll)
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
  var pr_pair__23690 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__23690, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__23691 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__23691, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____23692 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____23692)) {
        var nspc__23693 = temp__3974__auto____23692;
        return[cljs.core.str(nspc__23693), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____23694 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____23694)) {
          var nspc__23695 = temp__3974__auto____23694;
          return[cljs.core.str(nspc__23695), cljs.core.str("/")].join("")
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
  var pr_pair__23696 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__23696, "{", ", ", "}", opts, coll)
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
  var normalize__23698 = function(n, len) {
    var ns__23697 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__23697) < len) {
        var G__23700 = [cljs.core.str("0"), cljs.core.str(ns__23697)].join("");
        ns__23697 = G__23700;
        continue
      }else {
        return ns__23697
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__23698.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__23698.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__23698.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__23698.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__23698.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__23698.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__23699 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__23699, "{", ", ", "}", opts, coll)
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
  var this__23701 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__23702 = this;
  var G__23703__23704 = cljs.core.seq.call(null, this__23702.watches);
  if(G__23703__23704) {
    var G__23706__23708 = cljs.core.first.call(null, G__23703__23704);
    var vec__23707__23709 = G__23706__23708;
    var key__23710 = cljs.core.nth.call(null, vec__23707__23709, 0, null);
    var f__23711 = cljs.core.nth.call(null, vec__23707__23709, 1, null);
    var G__23703__23712 = G__23703__23704;
    var G__23706__23713 = G__23706__23708;
    var G__23703__23714 = G__23703__23712;
    while(true) {
      var vec__23715__23716 = G__23706__23713;
      var key__23717 = cljs.core.nth.call(null, vec__23715__23716, 0, null);
      var f__23718 = cljs.core.nth.call(null, vec__23715__23716, 1, null);
      var G__23703__23719 = G__23703__23714;
      f__23718.call(null, key__23717, this$, oldval, newval);
      var temp__3974__auto____23720 = cljs.core.next.call(null, G__23703__23719);
      if(temp__3974__auto____23720) {
        var G__23703__23721 = temp__3974__auto____23720;
        var G__23728 = cljs.core.first.call(null, G__23703__23721);
        var G__23729 = G__23703__23721;
        G__23706__23713 = G__23728;
        G__23703__23714 = G__23729;
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
  var this__23722 = this;
  return this$.watches = cljs.core.assoc.call(null, this__23722.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__23723 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__23723.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__23724 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__23724.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__23725 = this;
  return this__23725.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__23726 = this;
  return this__23726.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__23727 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__23741__delegate = function(x, p__23730) {
      var map__23736__23737 = p__23730;
      var map__23736__23738 = cljs.core.seq_QMARK_.call(null, map__23736__23737) ? cljs.core.apply.call(null, cljs.core.hash_map, map__23736__23737) : map__23736__23737;
      var validator__23739 = cljs.core._lookup.call(null, map__23736__23738, "\ufdd0'validator", null);
      var meta__23740 = cljs.core._lookup.call(null, map__23736__23738, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__23740, validator__23739, null)
    };
    var G__23741 = function(x, var_args) {
      var p__23730 = null;
      if(goog.isDef(var_args)) {
        p__23730 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__23741__delegate.call(this, x, p__23730)
    };
    G__23741.cljs$lang$maxFixedArity = 1;
    G__23741.cljs$lang$applyTo = function(arglist__23742) {
      var x = cljs.core.first(arglist__23742);
      var p__23730 = cljs.core.rest(arglist__23742);
      return G__23741__delegate(x, p__23730)
    };
    G__23741.cljs$lang$arity$variadic = G__23741__delegate;
    return G__23741
  }();
  atom = function(x, var_args) {
    var p__23730 = var_args;
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
  var temp__3974__auto____23746 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____23746)) {
    var validate__23747 = temp__3974__auto____23746;
    if(cljs.core.truth_(validate__23747.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__23748 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__23748, new_value);
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
    var G__23749__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__23749 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__23749__delegate.call(this, a, f, x, y, z, more)
    };
    G__23749.cljs$lang$maxFixedArity = 5;
    G__23749.cljs$lang$applyTo = function(arglist__23750) {
      var a = cljs.core.first(arglist__23750);
      var f = cljs.core.first(cljs.core.next(arglist__23750));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__23750)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__23750))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__23750)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__23750)))));
      return G__23749__delegate(a, f, x, y, z, more)
    };
    G__23749.cljs$lang$arity$variadic = G__23749__delegate;
    return G__23749
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__23751) {
    var iref = cljs.core.first(arglist__23751);
    var f = cljs.core.first(cljs.core.next(arglist__23751));
    var args = cljs.core.rest(cljs.core.next(arglist__23751));
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
  var this__23752 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__23752.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__23753 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__23753.state, function(p__23754) {
    var map__23755__23756 = p__23754;
    var map__23755__23757 = cljs.core.seq_QMARK_.call(null, map__23755__23756) ? cljs.core.apply.call(null, cljs.core.hash_map, map__23755__23756) : map__23755__23756;
    var curr_state__23758 = map__23755__23757;
    var done__23759 = cljs.core._lookup.call(null, map__23755__23757, "\ufdd0'done", null);
    if(cljs.core.truth_(done__23759)) {
      return curr_state__23758
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__23753.f.call(null)})
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
    var map__23780__23781 = options;
    var map__23780__23782 = cljs.core.seq_QMARK_.call(null, map__23780__23781) ? cljs.core.apply.call(null, cljs.core.hash_map, map__23780__23781) : map__23780__23781;
    var keywordize_keys__23783 = cljs.core._lookup.call(null, map__23780__23782, "\ufdd0'keywordize-keys", null);
    var keyfn__23784 = cljs.core.truth_(keywordize_keys__23783) ? cljs.core.keyword : cljs.core.str;
    var f__23799 = function thisfn(x) {
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
                var iter__2462__auto____23798 = function iter__23792(s__23793) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__23793__23796 = s__23793;
                    while(true) {
                      if(cljs.core.seq.call(null, s__23793__23796)) {
                        var k__23797 = cljs.core.first.call(null, s__23793__23796);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__23784.call(null, k__23797), thisfn.call(null, x[k__23797])], true), iter__23792.call(null, cljs.core.rest.call(null, s__23793__23796)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____23798.call(null, cljs.core.js_keys.call(null, x))
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
    return f__23799.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__23800) {
    var x = cljs.core.first(arglist__23800);
    var options = cljs.core.rest(arglist__23800);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__23805 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__23809__delegate = function(args) {
      var temp__3971__auto____23806 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__23805), args, null);
      if(cljs.core.truth_(temp__3971__auto____23806)) {
        var v__23807 = temp__3971__auto____23806;
        return v__23807
      }else {
        var ret__23808 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__23805, cljs.core.assoc, args, ret__23808);
        return ret__23808
      }
    };
    var G__23809 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__23809__delegate.call(this, args)
    };
    G__23809.cljs$lang$maxFixedArity = 0;
    G__23809.cljs$lang$applyTo = function(arglist__23810) {
      var args = cljs.core.seq(arglist__23810);
      return G__23809__delegate(args)
    };
    G__23809.cljs$lang$arity$variadic = G__23809__delegate;
    return G__23809
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__23812 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__23812)) {
        var G__23813 = ret__23812;
        f = G__23813;
        continue
      }else {
        return ret__23812
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__23814__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__23814 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__23814__delegate.call(this, f, args)
    };
    G__23814.cljs$lang$maxFixedArity = 1;
    G__23814.cljs$lang$applyTo = function(arglist__23815) {
      var f = cljs.core.first(arglist__23815);
      var args = cljs.core.rest(arglist__23815);
      return G__23814__delegate(f, args)
    };
    G__23814.cljs$lang$arity$variadic = G__23814__delegate;
    return G__23814
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
    var k__23817 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__23817, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__23817, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____23826 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____23826) {
      return or__3824__auto____23826
    }else {
      var or__3824__auto____23827 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____23827) {
        return or__3824__auto____23827
      }else {
        var and__3822__auto____23828 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____23828) {
          var and__3822__auto____23829 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____23829) {
            var and__3822__auto____23830 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____23830) {
              var ret__23831 = true;
              var i__23832 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____23833 = cljs.core.not.call(null, ret__23831);
                  if(or__3824__auto____23833) {
                    return or__3824__auto____23833
                  }else {
                    return i__23832 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__23831
                }else {
                  var G__23834 = isa_QMARK_.call(null, h, child.call(null, i__23832), parent.call(null, i__23832));
                  var G__23835 = i__23832 + 1;
                  ret__23831 = G__23834;
                  i__23832 = G__23835;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____23830
            }
          }else {
            return and__3822__auto____23829
          }
        }else {
          return and__3822__auto____23828
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
    var tp__23844 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__23845 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__23846 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__23847 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____23848 = cljs.core.contains_QMARK_.call(null, tp__23844.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__23846.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__23846.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__23844, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__23847.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__23845, parent, ta__23846), "\ufdd0'descendants":tf__23847.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__23846, tag, td__23845)})
    }();
    if(cljs.core.truth_(or__3824__auto____23848)) {
      return or__3824__auto____23848
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
    var parentMap__23853 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__23854 = cljs.core.truth_(parentMap__23853.call(null, tag)) ? cljs.core.disj.call(null, parentMap__23853.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__23855 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__23854)) ? cljs.core.assoc.call(null, parentMap__23853, tag, childsParents__23854) : cljs.core.dissoc.call(null, parentMap__23853, tag);
    var deriv_seq__23856 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__23836_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__23836_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__23836_SHARP_), cljs.core.second.call(null, p1__23836_SHARP_)))
    }, cljs.core.seq.call(null, newParents__23855)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__23853.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__23837_SHARP_, p2__23838_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__23837_SHARP_, p2__23838_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__23856))
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
  var xprefs__23864 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____23866 = cljs.core.truth_(function() {
    var and__3822__auto____23865 = xprefs__23864;
    if(cljs.core.truth_(and__3822__auto____23865)) {
      return xprefs__23864.call(null, y)
    }else {
      return and__3822__auto____23865
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____23866)) {
    return or__3824__auto____23866
  }else {
    var or__3824__auto____23868 = function() {
      var ps__23867 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__23867) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__23867), prefer_table))) {
          }else {
          }
          var G__23871 = cljs.core.rest.call(null, ps__23867);
          ps__23867 = G__23871;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____23868)) {
      return or__3824__auto____23868
    }else {
      var or__3824__auto____23870 = function() {
        var ps__23869 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__23869) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__23869), y, prefer_table))) {
            }else {
            }
            var G__23872 = cljs.core.rest.call(null, ps__23869);
            ps__23869 = G__23872;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____23870)) {
        return or__3824__auto____23870
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____23874 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____23874)) {
    return or__3824__auto____23874
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__23892 = cljs.core.reduce.call(null, function(be, p__23884) {
    var vec__23885__23886 = p__23884;
    var k__23887 = cljs.core.nth.call(null, vec__23885__23886, 0, null);
    var ___23888 = cljs.core.nth.call(null, vec__23885__23886, 1, null);
    var e__23889 = vec__23885__23886;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__23887)) {
      var be2__23891 = cljs.core.truth_(function() {
        var or__3824__auto____23890 = be == null;
        if(or__3824__auto____23890) {
          return or__3824__auto____23890
        }else {
          return cljs.core.dominates.call(null, k__23887, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__23889 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__23891), k__23887, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__23887), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__23891)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__23891
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__23892)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__23892));
      return cljs.core.second.call(null, best_entry__23892)
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
    var and__3822__auto____23897 = mf;
    if(and__3822__auto____23897) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____23897
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____23898 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____23899 = cljs.core._reset[goog.typeOf(x__2363__auto____23898)];
      if(or__3824__auto____23899) {
        return or__3824__auto____23899
      }else {
        var or__3824__auto____23900 = cljs.core._reset["_"];
        if(or__3824__auto____23900) {
          return or__3824__auto____23900
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____23905 = mf;
    if(and__3822__auto____23905) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____23905
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____23906 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____23907 = cljs.core._add_method[goog.typeOf(x__2363__auto____23906)];
      if(or__3824__auto____23907) {
        return or__3824__auto____23907
      }else {
        var or__3824__auto____23908 = cljs.core._add_method["_"];
        if(or__3824__auto____23908) {
          return or__3824__auto____23908
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____23913 = mf;
    if(and__3822__auto____23913) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____23913
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____23914 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____23915 = cljs.core._remove_method[goog.typeOf(x__2363__auto____23914)];
      if(or__3824__auto____23915) {
        return or__3824__auto____23915
      }else {
        var or__3824__auto____23916 = cljs.core._remove_method["_"];
        if(or__3824__auto____23916) {
          return or__3824__auto____23916
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____23921 = mf;
    if(and__3822__auto____23921) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____23921
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____23922 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____23923 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____23922)];
      if(or__3824__auto____23923) {
        return or__3824__auto____23923
      }else {
        var or__3824__auto____23924 = cljs.core._prefer_method["_"];
        if(or__3824__auto____23924) {
          return or__3824__auto____23924
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____23929 = mf;
    if(and__3822__auto____23929) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____23929
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____23930 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____23931 = cljs.core._get_method[goog.typeOf(x__2363__auto____23930)];
      if(or__3824__auto____23931) {
        return or__3824__auto____23931
      }else {
        var or__3824__auto____23932 = cljs.core._get_method["_"];
        if(or__3824__auto____23932) {
          return or__3824__auto____23932
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____23937 = mf;
    if(and__3822__auto____23937) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____23937
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____23938 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____23939 = cljs.core._methods[goog.typeOf(x__2363__auto____23938)];
      if(or__3824__auto____23939) {
        return or__3824__auto____23939
      }else {
        var or__3824__auto____23940 = cljs.core._methods["_"];
        if(or__3824__auto____23940) {
          return or__3824__auto____23940
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____23945 = mf;
    if(and__3822__auto____23945) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____23945
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____23946 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____23947 = cljs.core._prefers[goog.typeOf(x__2363__auto____23946)];
      if(or__3824__auto____23947) {
        return or__3824__auto____23947
      }else {
        var or__3824__auto____23948 = cljs.core._prefers["_"];
        if(or__3824__auto____23948) {
          return or__3824__auto____23948
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____23953 = mf;
    if(and__3822__auto____23953) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____23953
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____23954 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____23955 = cljs.core._dispatch[goog.typeOf(x__2363__auto____23954)];
      if(or__3824__auto____23955) {
        return or__3824__auto____23955
      }else {
        var or__3824__auto____23956 = cljs.core._dispatch["_"];
        if(or__3824__auto____23956) {
          return or__3824__auto____23956
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__23959 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__23960 = cljs.core._get_method.call(null, mf, dispatch_val__23959);
  if(cljs.core.truth_(target_fn__23960)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__23959)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__23960, args)
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
  var this__23961 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__23962 = this;
  cljs.core.swap_BANG_.call(null, this__23962.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__23962.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__23962.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__23962.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__23963 = this;
  cljs.core.swap_BANG_.call(null, this__23963.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__23963.method_cache, this__23963.method_table, this__23963.cached_hierarchy, this__23963.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__23964 = this;
  cljs.core.swap_BANG_.call(null, this__23964.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__23964.method_cache, this__23964.method_table, this__23964.cached_hierarchy, this__23964.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__23965 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__23965.cached_hierarchy), cljs.core.deref.call(null, this__23965.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__23965.method_cache, this__23965.method_table, this__23965.cached_hierarchy, this__23965.hierarchy)
  }
  var temp__3971__auto____23966 = cljs.core.deref.call(null, this__23965.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____23966)) {
    var target_fn__23967 = temp__3971__auto____23966;
    return target_fn__23967
  }else {
    var temp__3971__auto____23968 = cljs.core.find_and_cache_best_method.call(null, this__23965.name, dispatch_val, this__23965.hierarchy, this__23965.method_table, this__23965.prefer_table, this__23965.method_cache, this__23965.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____23968)) {
      var target_fn__23969 = temp__3971__auto____23968;
      return target_fn__23969
    }else {
      return cljs.core.deref.call(null, this__23965.method_table).call(null, this__23965.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__23970 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__23970.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__23970.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__23970.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__23970.method_cache, this__23970.method_table, this__23970.cached_hierarchy, this__23970.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__23971 = this;
  return cljs.core.deref.call(null, this__23971.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__23972 = this;
  return cljs.core.deref.call(null, this__23972.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__23973 = this;
  return cljs.core.do_dispatch.call(null, mf, this__23973.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__23975__delegate = function(_, args) {
    var self__23974 = this;
    return cljs.core._dispatch.call(null, self__23974, args)
  };
  var G__23975 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__23975__delegate.call(this, _, args)
  };
  G__23975.cljs$lang$maxFixedArity = 1;
  G__23975.cljs$lang$applyTo = function(arglist__23976) {
    var _ = cljs.core.first(arglist__23976);
    var args = cljs.core.rest(arglist__23976);
    return G__23975__delegate(_, args)
  };
  G__23975.cljs$lang$arity$variadic = G__23975__delegate;
  return G__23975
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__23977 = this;
  return cljs.core._dispatch.call(null, self__23977, args)
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
  var this__23978 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_23980, _) {
  var this__23979 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__23979.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__23981 = this;
  var and__3822__auto____23982 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____23982) {
    return this__23981.uuid === other.uuid
  }else {
    return and__3822__auto____23982
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__23983 = this;
  var this__23984 = this;
  return cljs.core.pr_str.call(null, this__23984)
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
  var or__3824__auto____19138 = cljs.core._EQ_.call(null, x, "\t");
  if(or__3824__auto____19138) {
    return or__3824__auto____19138
  }else {
    var or__3824__auto____19139 = cljs.core._EQ_.call(null, x, " ");
    if(or__3824__auto____19139) {
      return or__3824__auto____19139
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
  var and__3822__auto____19143 = function() {
    var and__3822__auto____19142 = 0 <= i;
    if(and__3822__auto____19142) {
      return i <= cljs.core.count.call(null, (new cljs.core.Keyword("\ufdd0'chars")).call(null, p))
    }else {
      return and__3822__auto____19142
    }
  }();
  if(cljs.core.truth_(and__3822__auto____19143)) {
    return cljs.core._EQ_.call(null, mode, subpar.core.get_mode.call(null, p, i))
  }else {
    return and__3822__auto____19143
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
subpar.core.n_str_QMARK_ = cljs.core.complement.call(null, subpar.core.in_string_QMARK_);
subpar.core.get_all_siblings = function get_all_siblings(i, p) {
  return cljs.core.get_in.call(null, p, cljs.core.PersistentVector.fromArray(["\ufdd0'families", subpar.core.get_opening_delimiter_index_with_parse.call(null, p, i), "\ufdd0'children"], true))
};
subpar.core.get_siblings = function get_siblings(i, transform, predicate, p) {
  return cljs.core.sort.call(null, cljs.core.filter.call(null, predicate, transform.call(null, subpar.core.get_all_siblings.call(null, i, p))))
};
subpar.core.count_lines = function count_lines(s, i, j) {
  var and__3822__auto____19147 = i;
  if(cljs.core.truth_(and__3822__auto____19147)) {
    var and__3822__auto____19148 = j;
    if(cljs.core.truth_(and__3822__auto____19148)) {
      return cljs.core.count.call(null, cljs.core.filter.call(null, function(p1__19144_SHARP_) {
        return cljs.core._EQ_.call(null, "\n", p1__19144_SHARP_)
      }, cljs.core.drop.call(null, i, cljs.core.drop_last.call(null, cljs.core.count.call(null, s) - j - 1, cljs.core.take.call(null, cljs.core.count.call(null, s), s))))) + 1
    }else {
      return and__3822__auto____19148
    }
  }else {
    return and__3822__auto____19147
  }
};
subpar.core.escaped_QMARK_ = function escaped_QMARK_(s, i) {
  return cljs.core.odd_QMARK_.call(null, function() {
    var c__19152 = 0;
    var j__19153 = i - 1;
    while(true) {
      var a__19154 = cljs.core.nth.call(null, s, j__19153, null);
      if(j__19153 < 0) {
        return c__19152
      }else {
        if(a__19154 == null) {
          return c__19152
        }else {
          if(cljs.core.not_EQ_.call(null, "\\", a__19154)) {
            return c__19152
          }else {
            if(true) {
              var G__19155 = c__19152 + 1;
              var G__19156 = j__19153 - 1;
              c__19152 = G__19155;
              j__19153 = G__19156;
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
  var vec__19161__19162 = subpar.core.get_wrapper.call(null, subpar.core.parse.call(null, s), i);
  var o__19163 = cljs.core.nth.call(null, vec__19161__19162, 0, null);
  var c__19164 = cljs.core.nth.call(null, vec__19161__19162, 1, null);
  if(cljs.core._EQ_.call(null, -1, o__19163)) {
    return i
  }else {
    return o__19163
  }
};
subpar.core.forward_delete_action = function forward_delete_action(s, i) {
  var p__19169 = subpar.core.parse.call(null, s);
  var h__19170 = i - 1;
  var j__19171 = i + 1;
  var c__19172 = cljs.core.nth.call(null, s, i, null);
  if(i >= cljs.core.count.call(null, s)) {
    return 0
  }else {
    if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, i))) {
      return 2
    }else {
      if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, j__19171))) {
        return 3
      }else {
        if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([h__19170, i], true), subpar.core.get_wrapper.call(null, p__19169, i))) {
          return 2
        }else {
          if(cljs.core.truth_(subpar.core.closes_list_QMARK_.call(null, p__19169, i))) {
            return 0
          }else {
            if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([i, j__19171], true), subpar.core.get_wrapper.call(null, p__19169, j__19171))) {
              return 3
            }else {
              if(cljs.core.truth_(subpar.core.opens_list_QMARK_.call(null, p__19169, i))) {
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
subpar.core.backward_delete_action = function backward_delete_action(s, i) {
  var p__19176 = subpar.core.parse.call(null, s);
  var g__19177 = i - 2;
  var h__19178 = i - 1;
  if(i <= 0) {
    return 0
  }else {
    if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, h__19178))) {
      return 3
    }else {
      if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, i))) {
        return 2
      }else {
        if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([g__19177, h__19178], true), subpar.core.get_wrapper.call(null, p__19176, h__19178))) {
          return 3
        }else {
          if(cljs.core.truth_(subpar.core.closes_list_QMARK_.call(null, p__19176, h__19178))) {
            return 4
          }else {
            if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([h__19178, i], true), subpar.core.get_wrapper.call(null, p__19176, i))) {
              return 2
            }else {
              if(cljs.core.truth_(subpar.core.opens_list_QMARK_.call(null, p__19176, h__19178))) {
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
subpar.core.double_quote_action = function double_quote_action(s, i) {
  var p__19180 = subpar.core.parse.call(null, s);
  if(i < 0) {
    return 0
  }else {
    if(i >= cljs.core.count.call(null, s)) {
      return 0
    }else {
      if(cljs.core.truth_(subpar.core.in_comment_QMARK_.call(null, p__19180, i))) {
        return 3
      }else {
        if(cljs.core.truth_(subpar.core.n_str_QMARK_.call(null, p__19180, i))) {
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
subpar.core.close_expression_vals = function close_expression_vals(p, i) {
  var vec__19190__19191 = subpar.core.get_wrapper.call(null, p, i);
  var o__19192 = cljs.core.nth.call(null, vec__19190__19191, 0, null);
  var c__19193 = cljs.core.nth.call(null, vec__19190__19191, 1, null);
  if(cljs.core._EQ_.call(null, -1, o__19192)) {
    return cljs.core.PersistentVector.EMPTY
  }else {
    var start__19195 = function() {
      var or__3824__auto____19194 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, cljs.core.identity, p));
      if(cljs.core.truth_(or__3824__auto____19194)) {
        return or__3824__auto____19194
      }else {
        return o__19192
      }
    }() + 1;
    var delete__19196 = cljs.core.not_EQ_.call(null, start__19195, c__19193);
    var dest__19197 = delete__19196 ? start__19195 + 1 : c__19193 + 1;
    return cljs.core.PersistentVector.fromArray([delete__19196, start__19195, c__19193, dest__19197], true)
  }
};
subpar.core.get_start_of_next_list = function get_start_of_next_list(s, i) {
  var p__19201 = subpar.core.parse.call(null, s);
  var r__19203 = cljs.core.first.call(null, subpar.core.get_siblings.call(null, i, cljs.core.keys, function(p1__19181_SHARP_) {
    var and__3822__auto____19202 = p1__19181_SHARP_ >= i;
    if(and__3822__auto____19202) {
      return cljs.core.get_in.call(null, p__19201, cljs.core.PersistentVector.fromArray(["\ufdd0'families", p1__19181_SHARP_], true))
    }else {
      return and__3822__auto____19202
    }
  }, p__19201));
  if(r__19203 == null) {
    return false
  }else {
    return r__19203
  }
};
subpar.core.forward_down_fn = function forward_down_fn(s, i) {
  var r__19206 = subpar.core.get_start_of_next_list.call(null, s, i);
  if(cljs.core.truth_(r__19206)) {
    return r__19206 + 1
  }else {
    return i
  }
};
subpar.core.backward_fn = function backward_fn(s, i) {
  var p__19212 = subpar.core.parse.call(null, s);
  var b__19213 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.keys, function(p1__19204_SHARP_) {
    return p1__19204_SHARP_ < i
  }, p__19212));
  var o__19214 = subpar.core.get_opening_delimiter_index_with_parse.call(null, p__19212, i);
  var or__3824__auto____19215 = b__19213;
  if(cljs.core.truth_(or__3824__auto____19215)) {
    return or__3824__auto____19215
  }else {
    if(o__19214 < 0) {
      return 0
    }else {
      return o__19214
    }
  }
};
subpar.core.backward_down_fn = function backward_down_fn(s, i) {
  var p__19220 = subpar.core.parse.call(null, s);
  var b__19222 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, function(p1__19207_SHARP_) {
    var and__3822__auto____19221 = p1__19207_SHARP_ < i;
    if(and__3822__auto____19221) {
      return subpar.core.closes_list_QMARK_.call(null, p__19220, p1__19207_SHARP_)
    }else {
      return and__3822__auto____19221
    }
  }, p__19220));
  var or__3824__auto____19223 = b__19222;
  if(cljs.core.truth_(or__3824__auto____19223)) {
    return or__3824__auto____19223
  }else {
    return i
  }
};
subpar.core.forward_up_fn = function forward_up_fn(s, i) {
  var p__19232 = subpar.core.parse.call(null, s);
  var vec__19231__19233 = subpar.core.get_wrapper.call(null, p__19232, i);
  var o__19234 = cljs.core.nth.call(null, vec__19231__19233, 0, null);
  var c__19235 = cljs.core.nth.call(null, vec__19231__19233, 1, null);
  var in_list__19236 = cljs.core.not_EQ_.call(null, -1, o__19234);
  if(in_list__19236) {
    return c__19235 + 1
  }else {
    return i
  }
};
subpar.core.forward_fn = function forward_fn(s, i) {
  var p__19242 = subpar.core.parse.call(null, s);
  var b__19243 = cljs.core.first.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, function(p1__19224_SHARP_) {
    return p1__19224_SHARP_ >= i
  }, p__19242));
  var c__19244 = subpar.core.get_closing_delimiter_index_with_parse.call(null, p__19242, i);
  var l__19245 = cljs.core.count.call(null, s);
  if(cljs.core.truth_(b__19243)) {
    return b__19243 + 1
  }else {
    if(cljs.core.truth_(c__19244)) {
      return c__19244 + 1 < l__19245 ? c__19244 + 1 : l__19245
    }else {
      if(true) {
        return l__19245
      }else {
        return null
      }
    }
  }
};
subpar.core.forward_slurp_vals = function forward_slurp_vals(s, i) {
  var p__19260 = subpar.core.parse.call(null, s);
  var vec__19259__19261 = subpar.core.get_wrapper.call(null, p__19260, i);
  var o__19262 = cljs.core.nth.call(null, vec__19259__19261, 0, null);
  var c__19263 = cljs.core.nth.call(null, vec__19259__19261, 1, null);
  var in_list__19264 = cljs.core.not_EQ_.call(null, -1, o__19262);
  var a__19266 = function() {
    var and__3822__auto____19265 = in_list__19264;
    if(and__3822__auto____19265) {
      return cljs.core.nth.call(null, s, c__19263, false)
    }else {
      return and__3822__auto____19265
    }
  }();
  var d__19268 = function() {
    var and__3822__auto____19267 = in_list__19264;
    if(and__3822__auto____19267) {
      return cljs.core.first.call(null, subpar.core.get_siblings.call(null, o__19262, cljs.core.vals, function(p1__19237_SHARP_) {
        return p1__19237_SHARP_ > c__19263
      }, p__19260))
    }else {
      return and__3822__auto____19267
    }
  }();
  if(cljs.core.truth_(function() {
    var and__3822__auto____19269 = a__19266;
    if(cljs.core.truth_(and__3822__auto____19269)) {
      var and__3822__auto____19270 = c__19263;
      if(cljs.core.truth_(and__3822__auto____19270)) {
        return d__19268
      }else {
        return and__3822__auto____19270
      }
    }else {
      return and__3822__auto____19269
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([a__19266, c__19263, d__19268 + 1, subpar.core.count_lines.call(null, s, o__19262, d__19268 + 1)], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
subpar.core.backward_slurp_vals = function backward_slurp_vals(s, i) {
  var p__19283 = subpar.core.parse.call(null, s);
  var vec__19282__19284 = subpar.core.get_wrapper.call(null, p__19283, i);
  var o__19285 = cljs.core.nth.call(null, vec__19282__19284, 0, null);
  var c__19286 = cljs.core.nth.call(null, vec__19282__19284, 1, null);
  var in_list__19287 = cljs.core.not_EQ_.call(null, -1, o__19285);
  var d__19289 = function() {
    var and__3822__auto____19288 = in_list__19287;
    if(and__3822__auto____19288) {
      return cljs.core.last.call(null, subpar.core.get_siblings.call(null, o__19285, cljs.core.keys, function(p1__19246_SHARP_) {
        return p1__19246_SHARP_ < o__19285
      }, p__19283))
    }else {
      return and__3822__auto____19288
    }
  }();
  var a__19291 = function() {
    var and__3822__auto____19290 = in_list__19287;
    if(and__3822__auto____19290) {
      return cljs.core.nth.call(null, s, o__19285, false)
    }else {
      return and__3822__auto____19290
    }
  }();
  if(cljs.core.truth_(function() {
    var and__3822__auto____19292 = a__19291;
    if(cljs.core.truth_(and__3822__auto____19292)) {
      return d__19289
    }else {
      return and__3822__auto____19292
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([a__19291, o__19285, d__19289, subpar.core.count_lines.call(null, s, d__19289, c__19286)], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
subpar.core.forward_barf_vals = function forward_barf_vals(s, i) {
  var p__19308 = subpar.core.parse.call(null, s);
  var vec__19307__19309 = subpar.core.get_wrapper.call(null, p__19308, i);
  var o__19310 = cljs.core.nth.call(null, vec__19307__19309, 0, null);
  var c__19311 = cljs.core.nth.call(null, vec__19307__19309, 1, null);
  var in_list__19312 = cljs.core.not_EQ_.call(null, -1, o__19310);
  var endings__19314 = function() {
    var and__3822__auto____19313 = in_list__19312;
    if(and__3822__auto____19313) {
      return subpar.core.get_siblings.call(null, i, cljs.core.vals, cljs.core.constantly.call(null, true), p__19308)
    }else {
      return and__3822__auto____19313
    }
  }();
  var a__19317 = function() {
    var and__3822__auto____19315 = c__19311;
    if(cljs.core.truth_(and__3822__auto____19315)) {
      var and__3822__auto____19316 = in_list__19312;
      if(and__3822__auto____19316) {
        return cljs.core.nth.call(null, s, c__19311, null)
      }else {
        return and__3822__auto____19316
      }
    }else {
      return and__3822__auto____19315
    }
  }();
  var r__19319 = function() {
    var or__3824__auto____19318 = subpar.core.count_lines.call(null, s, o__19310, c__19311);
    if(cljs.core.truth_(or__3824__auto____19318)) {
      return or__3824__auto____19318
    }else {
      return 1
    }
  }();
  var num__19320 = cljs.core.truth_(endings__19314) ? cljs.core.count.call(null, endings__19314) : 0;
  if(num__19320 > 1) {
    return cljs.core.PersistentVector.fromArray([a__19317, c__19311, cljs.core.nth.call(null, endings__19314, num__19320 - 2) + 1, false, r__19319, o__19310], true)
  }else {
    if(cljs.core._EQ_.call(null, num__19320, 1)) {
      return cljs.core.PersistentVector.fromArray([a__19317, c__19311, o__19310 + 1, true, r__19319, o__19310], true)
    }else {
      if(true) {
        return cljs.core.PersistentVector.EMPTY
      }else {
        return null
      }
    }
  }
};
subpar.core.backward_barf_vals = function backward_barf_vals(s, i) {
  var p__19336 = subpar.core.parse.call(null, s);
  var vec__19335__19337 = subpar.core.get_wrapper.call(null, p__19336, i);
  var o__19338 = cljs.core.nth.call(null, vec__19335__19337, 0, null);
  var c__19339 = cljs.core.nth.call(null, vec__19335__19337, 1, null);
  var in_list__19340 = cljs.core.not_EQ_.call(null, -1, o__19338);
  var starts__19342 = function() {
    var and__3822__auto____19341 = in_list__19340;
    if(and__3822__auto____19341) {
      return subpar.core.get_siblings.call(null, i, cljs.core.keys, cljs.core.constantly.call(null, true), p__19336)
    }else {
      return and__3822__auto____19341
    }
  }();
  var a__19345 = function() {
    var and__3822__auto____19343 = o__19338;
    if(cljs.core.truth_(and__3822__auto____19343)) {
      var and__3822__auto____19344 = in_list__19340;
      if(and__3822__auto____19344) {
        return cljs.core.nth.call(null, s, o__19338, null)
      }else {
        return and__3822__auto____19344
      }
    }else {
      return and__3822__auto____19343
    }
  }();
  var r__19347 = function() {
    var or__3824__auto____19346 = subpar.core.count_lines.call(null, s, o__19338, c__19339);
    if(cljs.core.truth_(or__3824__auto____19346)) {
      return or__3824__auto____19346
    }else {
      return 1
    }
  }();
  var num__19348 = cljs.core.truth_(starts__19342) ? cljs.core.count.call(null, starts__19342) : 0;
  if(num__19348 > 1) {
    return cljs.core.PersistentVector.fromArray([a__19345, o__19338, cljs.core.second.call(null, starts__19342), false, r__19347], true)
  }else {
    if(cljs.core._EQ_.call(null, num__19348, 1)) {
      return cljs.core.PersistentVector.fromArray([a__19345, o__19338, c__19339, true, r__19347], true)
    }else {
      if(true) {
        return cljs.core.PersistentVector.EMPTY
      }else {
        return null
      }
    }
  }
};
subpar.core.splice_vals = function splice_vals(s, i) {
  var p__19361 = subpar.core.parse.call(null, s);
  var vec__19360__19362 = subpar.core.get_wrapper.call(null, p__19361, i);
  var o__19363 = cljs.core.nth.call(null, vec__19360__19362, 0, null);
  var c__19364 = cljs.core.nth.call(null, vec__19360__19362, 1, null);
  var in_list__19365 = cljs.core.not_EQ_.call(null, -1, o__19363);
  if(in_list__19365) {
    var vec__19366__19367 = subpar.core.get_wrapper.call(null, p__19361, o__19363);
    var n__19368 = cljs.core.nth.call(null, vec__19366__19367, 0, null);
    var d__19369 = cljs.core.nth.call(null, vec__19366__19367, 1, null);
    var r__19370 = subpar.core.count_lines.call(null, s, n__19368, d__19369);
    return cljs.core.PersistentVector.fromArray([o__19363, c__19364, 0 > n__19368 ? 0 : n__19368, r__19370], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
subpar.core.splice_delete_backward_vals = function splice_delete_backward_vals(s, i) {
  var p__19383 = subpar.core.parse.call(null, s);
  var vec__19382__19384 = subpar.core.get_wrapper.call(null, p__19383, i);
  var o__19385 = cljs.core.nth.call(null, vec__19382__19384, 0, null);
  var c__19386 = cljs.core.nth.call(null, vec__19382__19384, 1, null);
  var in_list__19387 = cljs.core.not_EQ_.call(null, -1, o__19385);
  if(in_list__19387) {
    var vec__19388__19389 = subpar.core.get_wrapper.call(null, p__19383, o__19385);
    var n__19390 = cljs.core.nth.call(null, vec__19388__19389, 0, null);
    var d__19391 = cljs.core.nth.call(null, vec__19388__19389, 1, null);
    var r__19392 = subpar.core.count_lines.call(null, s, n__19390, d__19391);
    return cljs.core.PersistentVector.fromArray([o__19385, o__19385 > i ? o__19385 : i, c__19386, 0 > n__19390 ? 0 : n__19390, r__19392], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
subpar.core.splice_delete_forward_vals = function splice_delete_forward_vals(s, i) {
  var p__19405 = subpar.core.parse.call(null, s);
  var vec__19404__19406 = subpar.core.get_wrapper.call(null, p__19405, i);
  var o__19407 = cljs.core.nth.call(null, vec__19404__19406, 0, null);
  var c__19408 = cljs.core.nth.call(null, vec__19404__19406, 1, null);
  var in_list__19409 = cljs.core.not_EQ_.call(null, -1, o__19407);
  if(in_list__19409) {
    var vec__19410__19411 = subpar.core.get_wrapper.call(null, p__19405, o__19407);
    var n__19412 = cljs.core.nth.call(null, vec__19410__19411, 0, null);
    var d__19413 = cljs.core.nth.call(null, vec__19410__19411, 1, null);
    var r__19414 = subpar.core.count_lines.call(null, s, n__19412, d__19413);
    return cljs.core.PersistentVector.fromArray([o__19407, i, c__19408 + 1, 0 > n__19412 ? 0 : n__19412, r__19414], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
subpar.core.parse = function parse(ss) {
  var s__19453 = [cljs.core.str(ss), cljs.core.str(" ")].join("");
  var i__19454 = 0;
  var mode__19455 = subpar.core.code;
  var openings__19456 = cljs.core.list.call(null, -1);
  var start__19457 = -1;
  var t__19458 = cljs.core.PersistentVector.EMPTY;
  var families__19459 = cljs.core.PersistentArrayMap.fromArrays([-1], [cljs.core.ObjMap.fromObject(["\ufdd0'children"], {"\ufdd0'children":cljs.core.ObjMap.EMPTY})]);
  var escaping__19460 = false;
  var in_word__19461 = false;
  while(true) {
    var a__19462 = cljs.core.nth.call(null, s__19453, i__19454, null);
    var j__19463 = i__19454 + 1;
    var o__19464 = cljs.core.peek.call(null, openings__19456);
    if(cljs.core.truth_(function() {
      var and__3822__auto____19465 = a__19462 == null;
      if(and__3822__auto____19465) {
        return in_word__19461
      }else {
        return and__3822__auto____19465
      }
    }())) {
      return cljs.core.ObjMap.fromObject(["\ufdd0'chars", "\ufdd0'families"], {"\ufdd0'chars":t__19458, "\ufdd0'families":cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([-1, "\ufdd0'closer"], true), i__19454 - 1), cljs.core.PersistentVector.fromArray([-1, "\ufdd0'children", start__19457], true), i__19454 - 1)})
    }else {
      if(a__19462 == null) {
        return cljs.core.ObjMap.fromObject(["\ufdd0'chars", "\ufdd0'families"], {"\ufdd0'chars":t__19458, "\ufdd0'families":cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([-1, "\ufdd0'closer"], true), i__19454 - 1)})
      }else {
        if(function() {
          var and__3822__auto____19466 = cljs.core.not_EQ_.call(null, subpar.core.cmmnt, mode__19455);
          if(and__3822__auto____19466) {
            var and__3822__auto____19467 = cljs.core._EQ_.call(null, "\\", a__19462);
            if(and__3822__auto____19467) {
              var and__3822__auto____19468 = cljs.core.not.call(null, escaping__19460);
              if(and__3822__auto____19468) {
                return cljs.core.not.call(null, in_word__19461)
              }else {
                return and__3822__auto____19468
              }
            }else {
              return and__3822__auto____19467
            }
          }else {
            return and__3822__auto____19466
          }
        }()) {
          var G__19491 = j__19463;
          var G__19492 = mode__19455;
          var G__19493 = openings__19456;
          var G__19494 = i__19454;
          var G__19495 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
          var G__19496 = cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'children", i__19454], true), j__19463);
          var G__19497 = true;
          var G__19498 = true;
          i__19454 = G__19491;
          mode__19455 = G__19492;
          openings__19456 = G__19493;
          start__19457 = G__19494;
          t__19458 = G__19495;
          families__19459 = G__19496;
          escaping__19460 = G__19497;
          in_word__19461 = G__19498;
          continue
        }else {
          if(function() {
            var and__3822__auto____19469 = cljs.core.not_EQ_.call(null, subpar.core.cmmnt, mode__19455);
            if(and__3822__auto____19469) {
              var and__3822__auto____19470 = cljs.core._EQ_.call(null, "\\", a__19462);
              if(and__3822__auto____19470) {
                return cljs.core.not.call(null, escaping__19460)
              }else {
                return and__3822__auto____19470
              }
            }else {
              return and__3822__auto____19469
            }
          }()) {
            var G__19499 = j__19463;
            var G__19500 = mode__19455;
            var G__19501 = openings__19456;
            var G__19502 = i__19454;
            var G__19503 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
            var G__19504 = families__19459;
            var G__19505 = true;
            var G__19506 = true;
            i__19454 = G__19499;
            mode__19455 = G__19500;
            openings__19456 = G__19501;
            start__19457 = G__19502;
            t__19458 = G__19503;
            families__19459 = G__19504;
            escaping__19460 = G__19505;
            in_word__19461 = G__19506;
            continue
          }else {
            if(function() {
              var and__3822__auto____19471 = cljs.core._EQ_.call(null, subpar.core.code, mode__19455);
              if(and__3822__auto____19471) {
                var and__3822__auto____19472 = cljs.core._EQ_.call(null, ";", a__19462);
                if(and__3822__auto____19472) {
                  return cljs.core.not.call(null, escaping__19460)
                }else {
                  return and__3822__auto____19472
                }
              }else {
                return and__3822__auto____19471
              }
            }()) {
              var G__19507 = j__19463;
              var G__19508 = subpar.core.cmmnt;
              var G__19509 = openings__19456;
              var G__19510 = start__19457;
              var G__19511 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
              var G__19512 = families__19459;
              var G__19513 = false;
              var G__19514 = false;
              i__19454 = G__19507;
              mode__19455 = G__19508;
              openings__19456 = G__19509;
              start__19457 = G__19510;
              t__19458 = G__19511;
              families__19459 = G__19512;
              escaping__19460 = G__19513;
              in_word__19461 = G__19514;
              continue
            }else {
              if(function() {
                var and__3822__auto____19473 = cljs.core._EQ_.call(null, subpar.core.cmmnt, mode__19455);
                if(and__3822__auto____19473) {
                  return cljs.core._EQ_.call(null, "\n", a__19462)
                }else {
                  return and__3822__auto____19473
                }
              }()) {
                var G__19515 = j__19463;
                var G__19516 = subpar.core.code;
                var G__19517 = openings__19456;
                var G__19518 = start__19457;
                var G__19519 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                var G__19520 = families__19459;
                var G__19521 = false;
                var G__19522 = false;
                i__19454 = G__19515;
                mode__19455 = G__19516;
                openings__19456 = G__19517;
                start__19457 = G__19518;
                t__19458 = G__19519;
                families__19459 = G__19520;
                escaping__19460 = G__19521;
                in_word__19461 = G__19522;
                continue
              }else {
                if(cljs.core._EQ_.call(null, subpar.core.cmmnt, mode__19455)) {
                  var G__19523 = j__19463;
                  var G__19524 = subpar.core.cmmnt;
                  var G__19525 = openings__19456;
                  var G__19526 = start__19457;
                  var G__19527 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                  var G__19528 = families__19459;
                  var G__19529 = false;
                  var G__19530 = false;
                  i__19454 = G__19523;
                  mode__19455 = G__19524;
                  openings__19456 = G__19525;
                  start__19457 = G__19526;
                  t__19458 = G__19527;
                  families__19459 = G__19528;
                  escaping__19460 = G__19529;
                  in_word__19461 = G__19530;
                  continue
                }else {
                  if(function() {
                    var and__3822__auto____19474 = cljs.core._EQ_.call(null, subpar.core.code, mode__19455);
                    if(and__3822__auto____19474) {
                      var and__3822__auto____19475 = cljs.core._EQ_.call(null, '"', a__19462);
                      if(and__3822__auto____19475) {
                        return cljs.core.not.call(null, escaping__19460)
                      }else {
                        return and__3822__auto____19475
                      }
                    }else {
                      return and__3822__auto____19474
                    }
                  }()) {
                    var G__19531 = j__19463;
                    var G__19532 = subpar.core.string;
                    var G__19533 = cljs.core.conj.call(null, openings__19456, i__19454);
                    var G__19534 = -1;
                    var G__19535 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                    var G__19536 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([i__19454, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY), cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'children", i__19454], true), j__19463);
                    var G__19537 = false;
                    var G__19538 = false;
                    i__19454 = G__19531;
                    mode__19455 = G__19532;
                    openings__19456 = G__19533;
                    start__19457 = G__19534;
                    t__19458 = G__19535;
                    families__19459 = G__19536;
                    escaping__19460 = G__19537;
                    in_word__19461 = G__19538;
                    continue
                  }else {
                    if(cljs.core.truth_(function() {
                      var and__3822__auto____19476 = cljs.core._EQ_.call(null, subpar.core.string, mode__19455);
                      if(and__3822__auto____19476) {
                        var and__3822__auto____19477 = cljs.core._EQ_.call(null, '"', a__19462);
                        if(and__3822__auto____19477) {
                          var and__3822__auto____19478 = cljs.core.not.call(null, escaping__19460);
                          if(and__3822__auto____19478) {
                            return in_word__19461
                          }else {
                            return and__3822__auto____19478
                          }
                        }else {
                          return and__3822__auto____19477
                        }
                      }else {
                        return and__3822__auto____19476
                      }
                    }())) {
                      var G__19539 = j__19463;
                      var G__19540 = subpar.core.code;
                      var G__19541 = cljs.core.pop.call(null, openings__19456);
                      var G__19542 = -1;
                      var G__19543 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                      var G__19544 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'closer"], true), i__19454), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__19456), "\ufdd0'children", o__19464], true), i__19454), cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'children", start__19457], true), i__19454 - 1);
                      var G__19545 = false;
                      var G__19546 = false;
                      i__19454 = G__19539;
                      mode__19455 = G__19540;
                      openings__19456 = G__19541;
                      start__19457 = G__19542;
                      t__19458 = G__19543;
                      families__19459 = G__19544;
                      escaping__19460 = G__19545;
                      in_word__19461 = G__19546;
                      continue
                    }else {
                      if(function() {
                        var and__3822__auto____19479 = cljs.core._EQ_.call(null, subpar.core.string, mode__19455);
                        if(and__3822__auto____19479) {
                          var and__3822__auto____19480 = cljs.core._EQ_.call(null, '"', a__19462);
                          if(and__3822__auto____19480) {
                            return cljs.core.not.call(null, escaping__19460)
                          }else {
                            return and__3822__auto____19480
                          }
                        }else {
                          return and__3822__auto____19479
                        }
                      }()) {
                        var G__19547 = j__19463;
                        var G__19548 = subpar.core.code;
                        var G__19549 = cljs.core.pop.call(null, openings__19456);
                        var G__19550 = -1;
                        var G__19551 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                        var G__19552 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'closer"], true), i__19454), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__19456), "\ufdd0'children", o__19464], true), i__19454);
                        var G__19553 = false;
                        var G__19554 = false;
                        i__19454 = G__19547;
                        mode__19455 = G__19548;
                        openings__19456 = G__19549;
                        start__19457 = G__19550;
                        t__19458 = G__19551;
                        families__19459 = G__19552;
                        escaping__19460 = G__19553;
                        in_word__19461 = G__19554;
                        continue
                      }else {
                        if(function() {
                          var and__3822__auto____19481 = cljs.core._EQ_.call(null, subpar.core.string, mode__19455);
                          if(and__3822__auto____19481) {
                            var and__3822__auto____19482 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__19462));
                            if(and__3822__auto____19482) {
                              return cljs.core.not.call(null, in_word__19461)
                            }else {
                              return and__3822__auto____19482
                            }
                          }else {
                            return and__3822__auto____19481
                          }
                        }()) {
                          var G__19555 = j__19463;
                          var G__19556 = subpar.core.string;
                          var G__19557 = openings__19456;
                          var G__19558 = i__19454;
                          var G__19559 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                          var G__19560 = cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'children", i__19454], true), i__19454);
                          var G__19561 = false;
                          var G__19562 = true;
                          i__19454 = G__19555;
                          mode__19455 = G__19556;
                          openings__19456 = G__19557;
                          start__19457 = G__19558;
                          t__19458 = G__19559;
                          families__19459 = G__19560;
                          escaping__19460 = G__19561;
                          in_word__19461 = G__19562;
                          continue
                        }else {
                          if(cljs.core.truth_(function() {
                            var and__3822__auto____19483 = cljs.core._EQ_.call(null, subpar.core.string, mode__19455);
                            if(and__3822__auto____19483) {
                              var and__3822__auto____19484 = subpar.core.whitespace_QMARK_.call(null, a__19462);
                              if(cljs.core.truth_(and__3822__auto____19484)) {
                                return in_word__19461
                              }else {
                                return and__3822__auto____19484
                              }
                            }else {
                              return and__3822__auto____19483
                            }
                          }())) {
                            var G__19563 = j__19463;
                            var G__19564 = subpar.core.string;
                            var G__19565 = openings__19456;
                            var G__19566 = -1;
                            var G__19567 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                            var G__19568 = cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'children", start__19457], true), i__19454 - 1);
                            var G__19569 = false;
                            var G__19570 = false;
                            i__19454 = G__19563;
                            mode__19455 = G__19564;
                            openings__19456 = G__19565;
                            start__19457 = G__19566;
                            t__19458 = G__19567;
                            families__19459 = G__19568;
                            escaping__19460 = G__19569;
                            in_word__19461 = G__19570;
                            continue
                          }else {
                            if(cljs.core._EQ_.call(null, subpar.core.string, mode__19455)) {
                              var G__19571 = j__19463;
                              var G__19572 = subpar.core.string;
                              var G__19573 = openings__19456;
                              var G__19574 = start__19457;
                              var G__19575 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                              var G__19576 = families__19459;
                              var G__19577 = false;
                              var G__19578 = in_word__19461;
                              i__19454 = G__19571;
                              mode__19455 = G__19572;
                              openings__19456 = G__19573;
                              start__19457 = G__19574;
                              t__19458 = G__19575;
                              families__19459 = G__19576;
                              escaping__19460 = G__19577;
                              in_word__19461 = G__19578;
                              continue
                            }else {
                              if(cljs.core.truth_(function() {
                                var and__3822__auto____19485 = subpar.core.opener_QMARK_.call(null, a__19462);
                                if(cljs.core.truth_(and__3822__auto____19485)) {
                                  return in_word__19461
                                }else {
                                  return and__3822__auto____19485
                                }
                              }())) {
                                var G__19579 = j__19463;
                                var G__19580 = subpar.core.code;
                                var G__19581 = cljs.core.conj.call(null, openings__19456, i__19454);
                                var G__19582 = -1;
                                var G__19583 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                                var G__19584 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'children", start__19457], true), i__19454 - 1), cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'children", i__19454], true), i__19454), cljs.core.PersistentVector.fromArray([i__19454, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY);
                                var G__19585 = false;
                                var G__19586 = false;
                                i__19454 = G__19579;
                                mode__19455 = G__19580;
                                openings__19456 = G__19581;
                                start__19457 = G__19582;
                                t__19458 = G__19583;
                                families__19459 = G__19584;
                                escaping__19460 = G__19585;
                                in_word__19461 = G__19586;
                                continue
                              }else {
                                if(cljs.core.truth_(subpar.core.opener_QMARK_.call(null, a__19462))) {
                                  var G__19587 = j__19463;
                                  var G__19588 = subpar.core.code;
                                  var G__19589 = cljs.core.conj.call(null, openings__19456, i__19454);
                                  var G__19590 = -1;
                                  var G__19591 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                                  var G__19592 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'children", i__19454], true), i__19454), cljs.core.PersistentVector.fromArray([i__19454, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY);
                                  var G__19593 = false;
                                  var G__19594 = false;
                                  i__19454 = G__19587;
                                  mode__19455 = G__19588;
                                  openings__19456 = G__19589;
                                  start__19457 = G__19590;
                                  t__19458 = G__19591;
                                  families__19459 = G__19592;
                                  escaping__19460 = G__19593;
                                  in_word__19461 = G__19594;
                                  continue
                                }else {
                                  if(cljs.core.truth_(function() {
                                    var and__3822__auto____19486 = subpar.core.closer_QMARK_.call(null, a__19462);
                                    if(cljs.core.truth_(and__3822__auto____19486)) {
                                      return in_word__19461
                                    }else {
                                      return and__3822__auto____19486
                                    }
                                  }())) {
                                    var G__19595 = j__19463;
                                    var G__19596 = subpar.core.code;
                                    var G__19597 = cljs.core.pop.call(null, openings__19456);
                                    var G__19598 = -1;
                                    var G__19599 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                                    var G__19600 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'children", start__19457], true), i__19454 - 1), cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'closer"], true), i__19454), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__19456), "\ufdd0'children", o__19464], true), i__19454);
                                    var G__19601 = false;
                                    var G__19602 = false;
                                    i__19454 = G__19595;
                                    mode__19455 = G__19596;
                                    openings__19456 = G__19597;
                                    start__19457 = G__19598;
                                    t__19458 = G__19599;
                                    families__19459 = G__19600;
                                    escaping__19460 = G__19601;
                                    in_word__19461 = G__19602;
                                    continue
                                  }else {
                                    if(cljs.core.truth_(subpar.core.closer_QMARK_.call(null, a__19462))) {
                                      var G__19603 = j__19463;
                                      var G__19604 = subpar.core.code;
                                      var G__19605 = cljs.core.pop.call(null, openings__19456);
                                      var G__19606 = -1;
                                      var G__19607 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                                      var G__19608 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'closer"], true), i__19454), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__19456), "\ufdd0'children", o__19464], true), i__19454);
                                      var G__19609 = false;
                                      var G__19610 = false;
                                      i__19454 = G__19603;
                                      mode__19455 = G__19604;
                                      openings__19456 = G__19605;
                                      start__19457 = G__19606;
                                      t__19458 = G__19607;
                                      families__19459 = G__19608;
                                      escaping__19460 = G__19609;
                                      in_word__19461 = G__19610;
                                      continue
                                    }else {
                                      if(function() {
                                        var and__3822__auto____19487 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__19462));
                                        if(and__3822__auto____19487) {
                                          return cljs.core.not.call(null, in_word__19461)
                                        }else {
                                          return and__3822__auto____19487
                                        }
                                      }()) {
                                        var G__19611 = j__19463;
                                        var G__19612 = subpar.core.code;
                                        var G__19613 = openings__19456;
                                        var G__19614 = i__19454;
                                        var G__19615 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                                        var G__19616 = cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'children", i__19454], true), i__19454);
                                        var G__19617 = false;
                                        var G__19618 = true;
                                        i__19454 = G__19611;
                                        mode__19455 = G__19612;
                                        openings__19456 = G__19613;
                                        start__19457 = G__19614;
                                        t__19458 = G__19615;
                                        families__19459 = G__19616;
                                        escaping__19460 = G__19617;
                                        in_word__19461 = G__19618;
                                        continue
                                      }else {
                                        if(cljs.core.truth_(function() {
                                          var and__3822__auto____19488 = subpar.core.whitespace_QMARK_.call(null, a__19462);
                                          if(cljs.core.truth_(and__3822__auto____19488)) {
                                            return in_word__19461
                                          }else {
                                            return and__3822__auto____19488
                                          }
                                        }())) {
                                          var G__19619 = j__19463;
                                          var G__19620 = subpar.core.code;
                                          var G__19621 = openings__19456;
                                          var G__19622 = -1;
                                          var G__19623 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                                          var G__19624 = cljs.core.assoc_in.call(null, families__19459, cljs.core.PersistentVector.fromArray([o__19464, "\ufdd0'children", start__19457], true), i__19454 - 1);
                                          var G__19625 = false;
                                          var G__19626 = false;
                                          i__19454 = G__19619;
                                          mode__19455 = G__19620;
                                          openings__19456 = G__19621;
                                          start__19457 = G__19622;
                                          t__19458 = G__19623;
                                          families__19459 = G__19624;
                                          escaping__19460 = G__19625;
                                          in_word__19461 = G__19626;
                                          continue
                                        }else {
                                          if(cljs.core.truth_(function() {
                                            var and__3822__auto____19489 = subpar.core.whitespace_QMARK_.call(null, a__19462);
                                            if(cljs.core.truth_(and__3822__auto____19489)) {
                                              return cljs.core.not.call(null, in_word__19461)
                                            }else {
                                              return and__3822__auto____19489
                                            }
                                          }())) {
                                            var G__19627 = j__19463;
                                            var G__19628 = subpar.core.code;
                                            var G__19629 = openings__19456;
                                            var G__19630 = -1;
                                            var G__19631 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                                            var G__19632 = families__19459;
                                            var G__19633 = false;
                                            var G__19634 = false;
                                            i__19454 = G__19627;
                                            mode__19455 = G__19628;
                                            openings__19456 = G__19629;
                                            start__19457 = G__19630;
                                            t__19458 = G__19631;
                                            families__19459 = G__19632;
                                            escaping__19460 = G__19633;
                                            in_word__19461 = G__19634;
                                            continue
                                          }else {
                                            if(cljs.core.truth_(function() {
                                              var and__3822__auto____19490 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__19462));
                                              if(and__3822__auto____19490) {
                                                return in_word__19461
                                              }else {
                                                return and__3822__auto____19490
                                              }
                                            }())) {
                                              var G__19635 = j__19463;
                                              var G__19636 = subpar.core.code;
                                              var G__19637 = openings__19456;
                                              var G__19638 = start__19457;
                                              var G__19639 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray([mode__19455, o__19464], true));
                                              var G__19640 = families__19459;
                                              var G__19641 = false;
                                              var G__19642 = true;
                                              i__19454 = G__19635;
                                              mode__19455 = G__19636;
                                              openings__19456 = G__19637;
                                              start__19457 = G__19638;
                                              t__19458 = G__19639;
                                              families__19459 = G__19640;
                                              escaping__19460 = G__19641;
                                              in_word__19461 = G__19642;
                                              continue
                                            }else {
                                              if("\ufdd0'default") {
                                                var G__19643 = j__19463;
                                                var G__19644 = subpar.core.code;
                                                var G__19645 = openings__19456;
                                                var G__19646 = start__19457;
                                                var G__19647 = cljs.core.conj.call(null, t__19458, cljs.core.PersistentVector.fromArray(["?", o__19464], true));
                                                var G__19648 = families__19459;
                                                var G__19649 = escaping__19460;
                                                var G__19650 = in_word__19461;
                                                i__19454 = G__19643;
                                                mode__19455 = G__19644;
                                                openings__19456 = G__19645;
                                                start__19457 = G__19646;
                                                t__19458 = G__19647;
                                                families__19459 = G__19648;
                                                escaping__19460 = G__19649;
                                                in_word__19461 = G__19650;
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
  var vec__19656__19657 = subpar.core.get_info.call(null, cm);
  var cur__19658 = cljs.core.nth.call(null, vec__19656__19657, 0, null);
  var i__19659 = cljs.core.nth.call(null, vec__19656__19657, 1, null);
  var s__19660 = cljs.core.nth.call(null, vec__19656__19657, 2, null);
  if(cljs.core.truth_(subpar.core.in_string.call(null, s__19660, i__19659))) {
    cm.replaceRange(cljs.core.nth.call(null, pair, 0), cur__19658);
    return cm.setCursor(cur__19658.line, cur__19658.ch + 1)
  }else {
    return cm.compoundChange(function() {
      cm.replaceRange(pair, cur__19658);
      cm.setCursor(cur__19658.line, cur__19658.ch + 1);
      return cm.indentLine(cur__19658.line)
    })
  }
};
goog.exportSymbol("subpar.core.open_expression", subpar.core.open_expression);
subpar.core.forward_delete = function forward_delete(cm) {
  if(cljs.core.truth_(subpar.core.nothing_selected_QMARK_.call(null, cm))) {
    var vec__19678__19679 = subpar.core.get_info.call(null, cm);
    var cur__19680 = cljs.core.nth.call(null, vec__19678__19679, 0, null);
    var i__19681 = cljs.core.nth.call(null, vec__19678__19679, 1, null);
    var s__19682 = cljs.core.nth.call(null, vec__19678__19679, 2, null);
    var act__19683 = subpar.core.forward_delete_action.call(null, s__19682, i__19681);
    var s1__19684 = cm.posFromIndex(i__19681);
    var e1__19685 = cm.posFromIndex(i__19681 + 1);
    var s2__19686 = cm.posFromIndex(i__19681 - 1);
    var e2__19687 = e1__19685;
    var s3__19688 = s1__19684;
    var e3__19689 = cm.posFromIndex(i__19681 + 2);
    var pred__19690__19693 = cljs.core._EQ_;
    var expr__19691__19694 = act__19683;
    if(pred__19690__19693.call(null, 1, expr__19691__19694)) {
      return cm.replaceRange("", s1__19684, e1__19685)
    }else {
      if(pred__19690__19693.call(null, 2, expr__19691__19694)) {
        return cm.replaceRange("", s2__19686, e2__19687)
      }else {
        if(pred__19690__19693.call(null, 3, expr__19691__19694)) {
          return cm.replaceRange("", s3__19688, e3__19689)
        }else {
          if(pred__19690__19693.call(null, 4, expr__19691__19694)) {
            return cm.setCursor(e1__19685)
          }else {
            throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__19691__19694)].join(""));
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
    var vec__19712__19713 = subpar.core.get_info.call(null, cm);
    var cur__19714 = cljs.core.nth.call(null, vec__19712__19713, 0, null);
    var i__19715 = cljs.core.nth.call(null, vec__19712__19713, 1, null);
    var s__19716 = cljs.core.nth.call(null, vec__19712__19713, 2, null);
    var act__19717 = subpar.core.backward_delete_action.call(null, s__19716, i__19715);
    var s1__19718 = cm.posFromIndex(i__19715 - 1);
    var e1__19719 = cm.posFromIndex(i__19715);
    var s2__19720 = s1__19718;
    var e2__19721 = cm.posFromIndex(i__19715 + 1);
    var s3__19722 = cm.posFromIndex(i__19715 - 2);
    var e3__19723 = e1__19719;
    var pred__19724__19727 = cljs.core._EQ_;
    var expr__19725__19728 = act__19717;
    if(pred__19724__19727.call(null, 1, expr__19725__19728)) {
      return cm.replaceRange("", s1__19718, e1__19719)
    }else {
      if(pred__19724__19727.call(null, 2, expr__19725__19728)) {
        return cm.replaceRange("", s2__19720, e2__19721)
      }else {
        if(pred__19724__19727.call(null, 3, expr__19725__19728)) {
          return cm.replaceRange("", s3__19722, e3__19723)
        }else {
          if(pred__19724__19727.call(null, 4, expr__19725__19728)) {
            return cm.setCursor(s1__19718)
          }else {
            throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__19725__19728)].join(""));
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
  var vec__19740__19741 = subpar.core.get_info.call(null, cm);
  var cur__19742 = cljs.core.nth.call(null, vec__19740__19741, 0, null);
  var i__19743 = cljs.core.nth.call(null, vec__19740__19741, 1, null);
  var s__19744 = cljs.core.nth.call(null, vec__19740__19741, 2, null);
  var act__19745 = subpar.core.double_quote_action.call(null, s__19744, i__19743);
  var pred__19746__19749 = cljs.core._EQ_;
  var expr__19747__19750 = act__19745;
  if(pred__19746__19749.call(null, 0, expr__19747__19750)) {
    return subpar.core.open_expression.call(null, cm, '""')
  }else {
    if(pred__19746__19749.call(null, 1, expr__19747__19750)) {
      return cm.replaceRange('\\"', cur__19742)
    }else {
      if(pred__19746__19749.call(null, 2, expr__19747__19750)) {
        return subpar.core.go_to_index.call(null, cm, i__19743, i__19743 + 1)
      }else {
        if(pred__19746__19749.call(null, 3, expr__19747__19750)) {
          return cm.replaceRange('"', cur__19742)
        }else {
          throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__19747__19750)].join(""));
        }
      }
    }
  }
};
goog.exportSymbol("subpar.core.double_quote", subpar.core.double_quote);
subpar.core.close_expression = function close_expression(cm, c) {
  var vec__19763__19764 = subpar.core.get_info.call(null, cm);
  var cur__19765 = cljs.core.nth.call(null, vec__19763__19764, 0, null);
  var i__19766 = cljs.core.nth.call(null, vec__19763__19764, 1, null);
  var s__19767 = cljs.core.nth.call(null, vec__19763__19764, 2, null);
  var p__19768 = subpar.core.parse.call(null, s__19767);
  if(cljs.core.truth_(subpar.core.in_string_QMARK_.call(null, p__19768, i__19766))) {
    cm.replaceRange(c, cur__19765);
    return cm.setCursor(cur__19765.line, cur__19765.ch + 1)
  }else {
    var vec__19769__19770 = subpar.core.close_expression_vals.call(null, p__19768, i__19766);
    var del__19771 = cljs.core.nth.call(null, vec__19769__19770, 0, null);
    var beg__19772 = cljs.core.nth.call(null, vec__19769__19770, 1, null);
    var end__19773 = cljs.core.nth.call(null, vec__19769__19770, 2, null);
    var dst__19774 = cljs.core.nth.call(null, vec__19769__19770, 3, null);
    if(cljs.core.truth_(dst__19774)) {
      if(cljs.core.truth_(del__19771)) {
        cm.replaceRange("", cm.posFromIndex(beg__19772), cm.posFromIndex(end__19773))
      }else {
      }
      return subpar.core.go_to_index.call(null, cm, i__19766, dst__19774)
    }else {
      return null
    }
  }
};
goog.exportSymbol("subpar.core.close_expression", subpar.core.close_expression);
subpar.core.go = function go(cm, f) {
  var vec__19781__19782 = subpar.core.get_info.call(null, cm);
  var cur__19783 = cljs.core.nth.call(null, vec__19781__19782, 0, null);
  var i__19784 = cljs.core.nth.call(null, vec__19781__19782, 1, null);
  var s__19785 = cljs.core.nth.call(null, vec__19781__19782, 2, null);
  var j__19786 = f.call(null, s__19785, i__19784);
  return subpar.core.go_to_index.call(null, cm, i__19784, j__19786)
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
  var vec__19805__19807 = subpar.core.get_info.call(null, cm);
  var cur__19808 = cljs.core.nth.call(null, vec__19805__19807, 0, null);
  var i__19809 = cljs.core.nth.call(null, vec__19805__19807, 1, null);
  var s__19810 = cljs.core.nth.call(null, vec__19805__19807, 2, null);
  var vec__19806__19811 = subpar.core.forward_slurp_vals.call(null, s__19810, i__19809);
  var delimiter__19812 = cljs.core.nth.call(null, vec__19806__19811, 0, null);
  var si__19813 = cljs.core.nth.call(null, vec__19806__19811, 1, null);
  var di__19814 = cljs.core.nth.call(null, vec__19806__19811, 2, null);
  var ri__19815 = cljs.core.nth.call(null, vec__19806__19811, 3, null);
  if(cljs.core.truth_(ri__19815)) {
    var start__19816 = cm.posFromIndex(si__19813);
    var end__19817 = cm.posFromIndex(si__19813 + 1);
    var destination__19818 = cm.posFromIndex(di__19814);
    var line__19819 = start__19816.line;
    var update__19820 = function() {
      cm.replaceRange(delimiter__19812, destination__19818);
      cm.replaceRange("", start__19816, end__19817);
      return cljs.core.map.call(null, function(p1__19787_SHARP_) {
        return cm.indentLine(p1__19787_SHARP_)
      }, cljs.core.range.call(null, line__19819, line__19819 + ri__19815))
    };
    return cm.compoundChange(update__19820)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.forward_slurp", subpar.core.forward_slurp);
subpar.core.backward_slurp = function backward_slurp(cm) {
  var vec__19838__19840 = subpar.core.get_info.call(null, cm);
  var cur__19841 = cljs.core.nth.call(null, vec__19838__19840, 0, null);
  var i__19842 = cljs.core.nth.call(null, vec__19838__19840, 1, null);
  var s__19843 = cljs.core.nth.call(null, vec__19838__19840, 2, null);
  var vec__19839__19844 = subpar.core.backward_slurp_vals.call(null, s__19843, i__19842);
  var delimiter__19845 = cljs.core.nth.call(null, vec__19839__19844, 0, null);
  var si__19846 = cljs.core.nth.call(null, vec__19839__19844, 1, null);
  var di__19847 = cljs.core.nth.call(null, vec__19839__19844, 2, null);
  var ri__19848 = cljs.core.nth.call(null, vec__19839__19844, 3, null);
  if(cljs.core.truth_(ri__19848)) {
    var start__19849 = cm.posFromIndex(si__19846);
    var end__19850 = cm.posFromIndex(si__19846 + 1);
    var destination__19851 = cm.posFromIndex(di__19847);
    var line__19852 = start__19849.line;
    var update__19853 = function() {
      cm.replaceRange("", start__19849, end__19850);
      cm.replaceRange(delimiter__19845, destination__19851);
      return cljs.core.map.call(null, function(p1__19788_SHARP_) {
        return cm.indentLine(p1__19788_SHARP_)
      }, cljs.core.range.call(null, line__19852, line__19852 + ri__19848))
    };
    return cm.compoundChange(update__19853)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.backward_slurp", subpar.core.backward_slurp);
subpar.core.backward_barf = function backward_barf(cm) {
  var vec__19873__19875 = subpar.core.get_info.call(null, cm);
  var cur__19876 = cljs.core.nth.call(null, vec__19873__19875, 0, null);
  var i__19877 = cljs.core.nth.call(null, vec__19873__19875, 1, null);
  var s__19878 = cljs.core.nth.call(null, vec__19873__19875, 2, null);
  var vec__19874__19879 = subpar.core.backward_barf_vals.call(null, s__19878, i__19877);
  var delimiter__19880 = cljs.core.nth.call(null, vec__19874__19879, 0, null);
  var si__19881 = cljs.core.nth.call(null, vec__19874__19879, 1, null);
  var di__19882 = cljs.core.nth.call(null, vec__19874__19879, 2, null);
  var pad__19883 = cljs.core.nth.call(null, vec__19874__19879, 3, null);
  var ri__19884 = cljs.core.nth.call(null, vec__19874__19879, 4, null);
  if(cljs.core.truth_(ri__19884)) {
    var delimiter__19885 = cljs.core.truth_(pad__19883) ? [cljs.core.str(" "), cljs.core.str(delimiter__19880)].join("") : delimiter__19880;
    var destination__19886 = cm.posFromIndex(di__19882);
    var start__19887 = cm.posFromIndex(si__19881);
    var end__19888 = cm.posFromIndex(si__19881 + 1);
    var line__19889 = start__19887.line;
    var update__19890 = function() {
      cm.replaceRange(delimiter__19885, destination__19886);
      cm.replaceRange("", start__19887, end__19888);
      return cljs.core.map.call(null, function(p1__19821_SHARP_) {
        return cm.indentLine(p1__19821_SHARP_)
      }, cljs.core.range.call(null, line__19889, line__19889 + ri__19884))
    };
    return cm.compoundChange(update__19890)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.backward_barf", subpar.core.backward_barf);
subpar.core.forward_barf = function forward_barf(cm) {
  var vec__19911__19913 = subpar.core.get_info.call(null, cm);
  var cur__19914 = cljs.core.nth.call(null, vec__19911__19913, 0, null);
  var i__19915 = cljs.core.nth.call(null, vec__19911__19913, 1, null);
  var s__19916 = cljs.core.nth.call(null, vec__19911__19913, 2, null);
  var vec__19912__19917 = subpar.core.forward_barf_vals.call(null, s__19916, i__19915);
  var delimiter__19918 = cljs.core.nth.call(null, vec__19912__19917, 0, null);
  var si__19919 = cljs.core.nth.call(null, vec__19912__19917, 1, null);
  var di__19920 = cljs.core.nth.call(null, vec__19912__19917, 2, null);
  var pad__19921 = cljs.core.nth.call(null, vec__19912__19917, 3, null);
  var ri__19922 = cljs.core.nth.call(null, vec__19912__19917, 4, null);
  var i0__19923 = cljs.core.nth.call(null, vec__19912__19917, 5, null);
  if(cljs.core.truth_(ri__19922)) {
    var delimiter__19924 = cljs.core.truth_(pad__19921) ? [cljs.core.str(" "), cljs.core.str(delimiter__19918)].join("") : delimiter__19918;
    var destination__19925 = cm.posFromIndex(di__19920);
    var start__19926 = cm.posFromIndex(si__19919);
    var end__19927 = cm.posFromIndex(si__19919 + 1);
    var line__19928 = cm.posFromIndex(i0__19923).line;
    var update__19929 = function() {
      cm.replaceRange("", start__19926, end__19927);
      cm.replaceRange(delimiter__19924, destination__19925);
      return cljs.core.map.call(null, function(p1__19854_SHARP_) {
        return cm.indentLine(p1__19854_SHARP_)
      }, cljs.core.range.call(null, line__19928, line__19928 + ri__19922))
    };
    return cm.compoundChange(update__19929)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.forward_barf", subpar.core.forward_barf);
subpar.core.splice_delete_backward = function splice_delete_backward(cm) {
  var vec__19949__19951 = subpar.core.get_info.call(null, cm);
  var cur__19952 = cljs.core.nth.call(null, vec__19949__19951, 0, null);
  var i__19953 = cljs.core.nth.call(null, vec__19949__19951, 1, null);
  var s__19954 = cljs.core.nth.call(null, vec__19949__19951, 2, null);
  var vec__19950__19955 = subpar.core.splice_delete_backward_vals.call(null, s__19954, i__19953);
  var start__19956 = cljs.core.nth.call(null, vec__19950__19955, 0, null);
  var end__19957 = cljs.core.nth.call(null, vec__19950__19955, 1, null);
  var closer__19958 = cljs.core.nth.call(null, vec__19950__19955, 2, null);
  var reindent__19959 = cljs.core.nth.call(null, vec__19950__19955, 3, null);
  var num__19960 = cljs.core.nth.call(null, vec__19950__19955, 4, null);
  if(cljs.core.truth_(reindent__19959)) {
    var line__19961 = cm.posFromIndex(reindent__19959).line;
    var c0__19962 = cm.posFromIndex(closer__19958);
    var c1__19963 = cm.posFromIndex(closer__19958 + 1);
    var s0__19964 = cm.posFromIndex(start__19956);
    var s1__19965 = cm.posFromIndex(end__19957);
    var update__19966 = function() {
      cm.replaceRange("", c0__19962, c1__19963);
      cm.replaceRange("", s0__19964, s1__19965);
      return cljs.core.map.call(null, function(p1__19891_SHARP_) {
        return cm.indentLine(p1__19891_SHARP_)
      }, cljs.core.range.call(null, line__19961, line__19961 + num__19960))
    };
    return cm.compoundChange(update__19966)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.splice_delete_backward", subpar.core.splice_delete_backward);
subpar.core.splice_delete_forward = function splice_delete_forward(cm) {
  var vec__19986__19988 = subpar.core.get_info.call(null, cm);
  var cur__19989 = cljs.core.nth.call(null, vec__19986__19988, 0, null);
  var i__19990 = cljs.core.nth.call(null, vec__19986__19988, 1, null);
  var s__19991 = cljs.core.nth.call(null, vec__19986__19988, 2, null);
  var vec__19987__19992 = subpar.core.splice_delete_forward_vals.call(null, s__19991, i__19990);
  var opener__19993 = cljs.core.nth.call(null, vec__19987__19992, 0, null);
  var start__19994 = cljs.core.nth.call(null, vec__19987__19992, 1, null);
  var end__19995 = cljs.core.nth.call(null, vec__19987__19992, 2, null);
  var reindent__19996 = cljs.core.nth.call(null, vec__19987__19992, 3, null);
  var num__19997 = cljs.core.nth.call(null, vec__19987__19992, 4, null);
  if(cljs.core.truth_(reindent__19996)) {
    var line__19998 = cm.posFromIndex(reindent__19996).line;
    var o0__19999 = cm.posFromIndex(opener__19993);
    var o1__20000 = cm.posFromIndex(opener__19993 + 1);
    var s0__20001 = cm.posFromIndex(start__19994);
    var s1__20002 = cm.posFromIndex(end__19995);
    var update__20003 = function() {
      cm.replaceRange("", s0__20001, s1__20002);
      cm.replaceRange("", o0__19999, o1__20000);
      return cljs.core.map.call(null, function(p1__19930_SHARP_) {
        return cm.indentLine(p1__19930_SHARP_)
      }, cljs.core.range.call(null, line__19998, line__19998 + num__19997))
    };
    return cm.compoundChange(update__20003)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.splice_delete_forward", subpar.core.splice_delete_forward);
subpar.core.splice = function splice(cm) {
  var vec__20022__20024 = subpar.core.get_info.call(null, cm);
  var cur__20025 = cljs.core.nth.call(null, vec__20022__20024, 0, null);
  var i__20026 = cljs.core.nth.call(null, vec__20022__20024, 1, null);
  var s__20027 = cljs.core.nth.call(null, vec__20022__20024, 2, null);
  var vec__20023__20028 = subpar.core.splice_vals.call(null, s__20027, i__20026);
  var opener__20029 = cljs.core.nth.call(null, vec__20023__20028, 0, null);
  var closer__20030 = cljs.core.nth.call(null, vec__20023__20028, 1, null);
  var reindent__20031 = cljs.core.nth.call(null, vec__20023__20028, 2, null);
  var num__20032 = cljs.core.nth.call(null, vec__20023__20028, 3, null);
  if(cljs.core.truth_(reindent__20031)) {
    var line__20033 = cm.posFromIndex(reindent__20031).line;
    var o0__20034 = cm.posFromIndex(opener__20029);
    var o1__20035 = cm.posFromIndex(opener__20029 + 1);
    var c0__20036 = cm.posFromIndex(closer__20030);
    var c1__20037 = cm.posFromIndex(closer__20030 + 1);
    var update__20038 = function() {
      cm.replaceRange("", c0__20036, c1__20037);
      cm.replaceRange("", o0__20034, o1__20035);
      return cljs.core.map.call(null, function(p1__19967_SHARP_) {
        return cm.indentLine(p1__19967_SHARP_)
      }, cljs.core.range.call(null, line__20033, line__20033 + num__20032))
    };
    return cm.compoundChange(update__20038)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.splice", subpar.core.splice);
subpar.core.indent_selection = function indent_selection(cm) {
  if(cljs.core.truth_(cm.somethingSelected())) {
    var start__20042 = cm.getCursor(true).line;
    var end__20043 = cm.getCursor(false).line;
    var f__20044 = function() {
      return cljs.core.map.call(null, function(p1__20004_SHARP_) {
        return cm.indentLine(p1__20004_SHARP_)
      }, cljs.core.range.call(null, start__20042, end__20043 + 1))
    };
    return cm.compoundChange(f__20044)
  }else {
    return cm.indentLine(cm.getCursor().line)
  }
};
goog.exportSymbol("subpar.core.indent_selection", subpar.core.indent_selection);
