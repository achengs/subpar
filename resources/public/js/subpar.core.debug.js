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
  var x__6619 = x == null ? null : x;
  if(p[goog.typeOf(x__6619)]) {
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
    var G__6620__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6620 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6620__delegate.call(this, array, i, idxs)
    };
    G__6620.cljs$lang$maxFixedArity = 2;
    G__6620.cljs$lang$applyTo = function(arglist__6621) {
      var array = cljs.core.first(arglist__6621);
      var i = cljs.core.first(cljs.core.next(arglist__6621));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6621));
      return G__6620__delegate(array, i, idxs)
    };
    G__6620.cljs$lang$arity$variadic = G__6620__delegate;
    return G__6620
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
      var and__3822__auto____6706 = this$;
      if(and__3822__auto____6706) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6706
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____6707 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6708 = cljs.core._invoke[goog.typeOf(x__2363__auto____6707)];
        if(or__3824__auto____6708) {
          return or__3824__auto____6708
        }else {
          var or__3824__auto____6709 = cljs.core._invoke["_"];
          if(or__3824__auto____6709) {
            return or__3824__auto____6709
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6710 = this$;
      if(and__3822__auto____6710) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6710
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____6711 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6712 = cljs.core._invoke[goog.typeOf(x__2363__auto____6711)];
        if(or__3824__auto____6712) {
          return or__3824__auto____6712
        }else {
          var or__3824__auto____6713 = cljs.core._invoke["_"];
          if(or__3824__auto____6713) {
            return or__3824__auto____6713
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6714 = this$;
      if(and__3822__auto____6714) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6714
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____6715 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6716 = cljs.core._invoke[goog.typeOf(x__2363__auto____6715)];
        if(or__3824__auto____6716) {
          return or__3824__auto____6716
        }else {
          var or__3824__auto____6717 = cljs.core._invoke["_"];
          if(or__3824__auto____6717) {
            return or__3824__auto____6717
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6718 = this$;
      if(and__3822__auto____6718) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6718
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____6719 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6720 = cljs.core._invoke[goog.typeOf(x__2363__auto____6719)];
        if(or__3824__auto____6720) {
          return or__3824__auto____6720
        }else {
          var or__3824__auto____6721 = cljs.core._invoke["_"];
          if(or__3824__auto____6721) {
            return or__3824__auto____6721
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6722 = this$;
      if(and__3822__auto____6722) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6722
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____6723 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6724 = cljs.core._invoke[goog.typeOf(x__2363__auto____6723)];
        if(or__3824__auto____6724) {
          return or__3824__auto____6724
        }else {
          var or__3824__auto____6725 = cljs.core._invoke["_"];
          if(or__3824__auto____6725) {
            return or__3824__auto____6725
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6726 = this$;
      if(and__3822__auto____6726) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6726
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____6727 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6728 = cljs.core._invoke[goog.typeOf(x__2363__auto____6727)];
        if(or__3824__auto____6728) {
          return or__3824__auto____6728
        }else {
          var or__3824__auto____6729 = cljs.core._invoke["_"];
          if(or__3824__auto____6729) {
            return or__3824__auto____6729
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6730 = this$;
      if(and__3822__auto____6730) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6730
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____6731 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6732 = cljs.core._invoke[goog.typeOf(x__2363__auto____6731)];
        if(or__3824__auto____6732) {
          return or__3824__auto____6732
        }else {
          var or__3824__auto____6733 = cljs.core._invoke["_"];
          if(or__3824__auto____6733) {
            return or__3824__auto____6733
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6734 = this$;
      if(and__3822__auto____6734) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6734
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____6735 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6736 = cljs.core._invoke[goog.typeOf(x__2363__auto____6735)];
        if(or__3824__auto____6736) {
          return or__3824__auto____6736
        }else {
          var or__3824__auto____6737 = cljs.core._invoke["_"];
          if(or__3824__auto____6737) {
            return or__3824__auto____6737
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6738 = this$;
      if(and__3822__auto____6738) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6738
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____6739 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6740 = cljs.core._invoke[goog.typeOf(x__2363__auto____6739)];
        if(or__3824__auto____6740) {
          return or__3824__auto____6740
        }else {
          var or__3824__auto____6741 = cljs.core._invoke["_"];
          if(or__3824__auto____6741) {
            return or__3824__auto____6741
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6742 = this$;
      if(and__3822__auto____6742) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6742
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____6743 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6744 = cljs.core._invoke[goog.typeOf(x__2363__auto____6743)];
        if(or__3824__auto____6744) {
          return or__3824__auto____6744
        }else {
          var or__3824__auto____6745 = cljs.core._invoke["_"];
          if(or__3824__auto____6745) {
            return or__3824__auto____6745
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6746 = this$;
      if(and__3822__auto____6746) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6746
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____6747 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6748 = cljs.core._invoke[goog.typeOf(x__2363__auto____6747)];
        if(or__3824__auto____6748) {
          return or__3824__auto____6748
        }else {
          var or__3824__auto____6749 = cljs.core._invoke["_"];
          if(or__3824__auto____6749) {
            return or__3824__auto____6749
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6750 = this$;
      if(and__3822__auto____6750) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6750
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____6751 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6752 = cljs.core._invoke[goog.typeOf(x__2363__auto____6751)];
        if(or__3824__auto____6752) {
          return or__3824__auto____6752
        }else {
          var or__3824__auto____6753 = cljs.core._invoke["_"];
          if(or__3824__auto____6753) {
            return or__3824__auto____6753
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6754 = this$;
      if(and__3822__auto____6754) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6754
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____6755 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6756 = cljs.core._invoke[goog.typeOf(x__2363__auto____6755)];
        if(or__3824__auto____6756) {
          return or__3824__auto____6756
        }else {
          var or__3824__auto____6757 = cljs.core._invoke["_"];
          if(or__3824__auto____6757) {
            return or__3824__auto____6757
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6758 = this$;
      if(and__3822__auto____6758) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6758
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____6759 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6760 = cljs.core._invoke[goog.typeOf(x__2363__auto____6759)];
        if(or__3824__auto____6760) {
          return or__3824__auto____6760
        }else {
          var or__3824__auto____6761 = cljs.core._invoke["_"];
          if(or__3824__auto____6761) {
            return or__3824__auto____6761
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6762 = this$;
      if(and__3822__auto____6762) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6762
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____6763 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6764 = cljs.core._invoke[goog.typeOf(x__2363__auto____6763)];
        if(or__3824__auto____6764) {
          return or__3824__auto____6764
        }else {
          var or__3824__auto____6765 = cljs.core._invoke["_"];
          if(or__3824__auto____6765) {
            return or__3824__auto____6765
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6766 = this$;
      if(and__3822__auto____6766) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6766
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____6767 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6768 = cljs.core._invoke[goog.typeOf(x__2363__auto____6767)];
        if(or__3824__auto____6768) {
          return or__3824__auto____6768
        }else {
          var or__3824__auto____6769 = cljs.core._invoke["_"];
          if(or__3824__auto____6769) {
            return or__3824__auto____6769
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6770 = this$;
      if(and__3822__auto____6770) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6770
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____6771 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6772 = cljs.core._invoke[goog.typeOf(x__2363__auto____6771)];
        if(or__3824__auto____6772) {
          return or__3824__auto____6772
        }else {
          var or__3824__auto____6773 = cljs.core._invoke["_"];
          if(or__3824__auto____6773) {
            return or__3824__auto____6773
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6774 = this$;
      if(and__3822__auto____6774) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6774
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____6775 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6776 = cljs.core._invoke[goog.typeOf(x__2363__auto____6775)];
        if(or__3824__auto____6776) {
          return or__3824__auto____6776
        }else {
          var or__3824__auto____6777 = cljs.core._invoke["_"];
          if(or__3824__auto____6777) {
            return or__3824__auto____6777
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6778 = this$;
      if(and__3822__auto____6778) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6778
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____6779 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6780 = cljs.core._invoke[goog.typeOf(x__2363__auto____6779)];
        if(or__3824__auto____6780) {
          return or__3824__auto____6780
        }else {
          var or__3824__auto____6781 = cljs.core._invoke["_"];
          if(or__3824__auto____6781) {
            return or__3824__auto____6781
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6782 = this$;
      if(and__3822__auto____6782) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6782
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____6783 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6784 = cljs.core._invoke[goog.typeOf(x__2363__auto____6783)];
        if(or__3824__auto____6784) {
          return or__3824__auto____6784
        }else {
          var or__3824__auto____6785 = cljs.core._invoke["_"];
          if(or__3824__auto____6785) {
            return or__3824__auto____6785
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6786 = this$;
      if(and__3822__auto____6786) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6786
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____6787 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6788 = cljs.core._invoke[goog.typeOf(x__2363__auto____6787)];
        if(or__3824__auto____6788) {
          return or__3824__auto____6788
        }else {
          var or__3824__auto____6789 = cljs.core._invoke["_"];
          if(or__3824__auto____6789) {
            return or__3824__auto____6789
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
    var and__3822__auto____6794 = coll;
    if(and__3822__auto____6794) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6794
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____6795 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6796 = cljs.core._count[goog.typeOf(x__2363__auto____6795)];
      if(or__3824__auto____6796) {
        return or__3824__auto____6796
      }else {
        var or__3824__auto____6797 = cljs.core._count["_"];
        if(or__3824__auto____6797) {
          return or__3824__auto____6797
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
    var and__3822__auto____6802 = coll;
    if(and__3822__auto____6802) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6802
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____6803 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6804 = cljs.core._empty[goog.typeOf(x__2363__auto____6803)];
      if(or__3824__auto____6804) {
        return or__3824__auto____6804
      }else {
        var or__3824__auto____6805 = cljs.core._empty["_"];
        if(or__3824__auto____6805) {
          return or__3824__auto____6805
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
    var and__3822__auto____6810 = coll;
    if(and__3822__auto____6810) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6810
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____6811 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6812 = cljs.core._conj[goog.typeOf(x__2363__auto____6811)];
      if(or__3824__auto____6812) {
        return or__3824__auto____6812
      }else {
        var or__3824__auto____6813 = cljs.core._conj["_"];
        if(or__3824__auto____6813) {
          return or__3824__auto____6813
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
      var and__3822__auto____6822 = coll;
      if(and__3822__auto____6822) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6822
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____6823 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6824 = cljs.core._nth[goog.typeOf(x__2363__auto____6823)];
        if(or__3824__auto____6824) {
          return or__3824__auto____6824
        }else {
          var or__3824__auto____6825 = cljs.core._nth["_"];
          if(or__3824__auto____6825) {
            return or__3824__auto____6825
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6826 = coll;
      if(and__3822__auto____6826) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6826
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____6827 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6828 = cljs.core._nth[goog.typeOf(x__2363__auto____6827)];
        if(or__3824__auto____6828) {
          return or__3824__auto____6828
        }else {
          var or__3824__auto____6829 = cljs.core._nth["_"];
          if(or__3824__auto____6829) {
            return or__3824__auto____6829
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
    var and__3822__auto____6834 = coll;
    if(and__3822__auto____6834) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6834
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____6835 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6836 = cljs.core._first[goog.typeOf(x__2363__auto____6835)];
      if(or__3824__auto____6836) {
        return or__3824__auto____6836
      }else {
        var or__3824__auto____6837 = cljs.core._first["_"];
        if(or__3824__auto____6837) {
          return or__3824__auto____6837
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6842 = coll;
    if(and__3822__auto____6842) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6842
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____6843 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6844 = cljs.core._rest[goog.typeOf(x__2363__auto____6843)];
      if(or__3824__auto____6844) {
        return or__3824__auto____6844
      }else {
        var or__3824__auto____6845 = cljs.core._rest["_"];
        if(or__3824__auto____6845) {
          return or__3824__auto____6845
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
    var and__3822__auto____6850 = coll;
    if(and__3822__auto____6850) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6850
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____6851 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6852 = cljs.core._next[goog.typeOf(x__2363__auto____6851)];
      if(or__3824__auto____6852) {
        return or__3824__auto____6852
      }else {
        var or__3824__auto____6853 = cljs.core._next["_"];
        if(or__3824__auto____6853) {
          return or__3824__auto____6853
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
      var and__3822__auto____6862 = o;
      if(and__3822__auto____6862) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6862
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____6863 = o == null ? null : o;
      return function() {
        var or__3824__auto____6864 = cljs.core._lookup[goog.typeOf(x__2363__auto____6863)];
        if(or__3824__auto____6864) {
          return or__3824__auto____6864
        }else {
          var or__3824__auto____6865 = cljs.core._lookup["_"];
          if(or__3824__auto____6865) {
            return or__3824__auto____6865
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6866 = o;
      if(and__3822__auto____6866) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6866
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____6867 = o == null ? null : o;
      return function() {
        var or__3824__auto____6868 = cljs.core._lookup[goog.typeOf(x__2363__auto____6867)];
        if(or__3824__auto____6868) {
          return or__3824__auto____6868
        }else {
          var or__3824__auto____6869 = cljs.core._lookup["_"];
          if(or__3824__auto____6869) {
            return or__3824__auto____6869
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
    var and__3822__auto____6874 = coll;
    if(and__3822__auto____6874) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6874
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____6875 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6876 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____6875)];
      if(or__3824__auto____6876) {
        return or__3824__auto____6876
      }else {
        var or__3824__auto____6877 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6877) {
          return or__3824__auto____6877
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6882 = coll;
    if(and__3822__auto____6882) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6882
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____6883 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6884 = cljs.core._assoc[goog.typeOf(x__2363__auto____6883)];
      if(or__3824__auto____6884) {
        return or__3824__auto____6884
      }else {
        var or__3824__auto____6885 = cljs.core._assoc["_"];
        if(or__3824__auto____6885) {
          return or__3824__auto____6885
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
    var and__3822__auto____6890 = coll;
    if(and__3822__auto____6890) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6890
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____6891 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6892 = cljs.core._dissoc[goog.typeOf(x__2363__auto____6891)];
      if(or__3824__auto____6892) {
        return or__3824__auto____6892
      }else {
        var or__3824__auto____6893 = cljs.core._dissoc["_"];
        if(or__3824__auto____6893) {
          return or__3824__auto____6893
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
    var and__3822__auto____6898 = coll;
    if(and__3822__auto____6898) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6898
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____6899 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6900 = cljs.core._key[goog.typeOf(x__2363__auto____6899)];
      if(or__3824__auto____6900) {
        return or__3824__auto____6900
      }else {
        var or__3824__auto____6901 = cljs.core._key["_"];
        if(or__3824__auto____6901) {
          return or__3824__auto____6901
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6906 = coll;
    if(and__3822__auto____6906) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6906
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____6907 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6908 = cljs.core._val[goog.typeOf(x__2363__auto____6907)];
      if(or__3824__auto____6908) {
        return or__3824__auto____6908
      }else {
        var or__3824__auto____6909 = cljs.core._val["_"];
        if(or__3824__auto____6909) {
          return or__3824__auto____6909
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
    var and__3822__auto____6914 = coll;
    if(and__3822__auto____6914) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6914
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____6915 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6916 = cljs.core._disjoin[goog.typeOf(x__2363__auto____6915)];
      if(or__3824__auto____6916) {
        return or__3824__auto____6916
      }else {
        var or__3824__auto____6917 = cljs.core._disjoin["_"];
        if(or__3824__auto____6917) {
          return or__3824__auto____6917
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
    var and__3822__auto____6922 = coll;
    if(and__3822__auto____6922) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6922
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____6923 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6924 = cljs.core._peek[goog.typeOf(x__2363__auto____6923)];
      if(or__3824__auto____6924) {
        return or__3824__auto____6924
      }else {
        var or__3824__auto____6925 = cljs.core._peek["_"];
        if(or__3824__auto____6925) {
          return or__3824__auto____6925
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6930 = coll;
    if(and__3822__auto____6930) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6930
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____6931 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6932 = cljs.core._pop[goog.typeOf(x__2363__auto____6931)];
      if(or__3824__auto____6932) {
        return or__3824__auto____6932
      }else {
        var or__3824__auto____6933 = cljs.core._pop["_"];
        if(or__3824__auto____6933) {
          return or__3824__auto____6933
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
    var and__3822__auto____6938 = coll;
    if(and__3822__auto____6938) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6938
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____6939 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6940 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____6939)];
      if(or__3824__auto____6940) {
        return or__3824__auto____6940
      }else {
        var or__3824__auto____6941 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6941) {
          return or__3824__auto____6941
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
    var and__3822__auto____6946 = o;
    if(and__3822__auto____6946) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6946
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____6947 = o == null ? null : o;
    return function() {
      var or__3824__auto____6948 = cljs.core._deref[goog.typeOf(x__2363__auto____6947)];
      if(or__3824__auto____6948) {
        return or__3824__auto____6948
      }else {
        var or__3824__auto____6949 = cljs.core._deref["_"];
        if(or__3824__auto____6949) {
          return or__3824__auto____6949
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
    var and__3822__auto____6954 = o;
    if(and__3822__auto____6954) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6954
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____6955 = o == null ? null : o;
    return function() {
      var or__3824__auto____6956 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____6955)];
      if(or__3824__auto____6956) {
        return or__3824__auto____6956
      }else {
        var or__3824__auto____6957 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6957) {
          return or__3824__auto____6957
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
    var and__3822__auto____6962 = o;
    if(and__3822__auto____6962) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6962
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____6963 = o == null ? null : o;
    return function() {
      var or__3824__auto____6964 = cljs.core._meta[goog.typeOf(x__2363__auto____6963)];
      if(or__3824__auto____6964) {
        return or__3824__auto____6964
      }else {
        var or__3824__auto____6965 = cljs.core._meta["_"];
        if(or__3824__auto____6965) {
          return or__3824__auto____6965
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
    var and__3822__auto____6970 = o;
    if(and__3822__auto____6970) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6970
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____6971 = o == null ? null : o;
    return function() {
      var or__3824__auto____6972 = cljs.core._with_meta[goog.typeOf(x__2363__auto____6971)];
      if(or__3824__auto____6972) {
        return or__3824__auto____6972
      }else {
        var or__3824__auto____6973 = cljs.core._with_meta["_"];
        if(or__3824__auto____6973) {
          return or__3824__auto____6973
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
      var and__3822__auto____6982 = coll;
      if(and__3822__auto____6982) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6982
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____6983 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6984 = cljs.core._reduce[goog.typeOf(x__2363__auto____6983)];
        if(or__3824__auto____6984) {
          return or__3824__auto____6984
        }else {
          var or__3824__auto____6985 = cljs.core._reduce["_"];
          if(or__3824__auto____6985) {
            return or__3824__auto____6985
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6986 = coll;
      if(and__3822__auto____6986) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6986
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____6987 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6988 = cljs.core._reduce[goog.typeOf(x__2363__auto____6987)];
        if(or__3824__auto____6988) {
          return or__3824__auto____6988
        }else {
          var or__3824__auto____6989 = cljs.core._reduce["_"];
          if(or__3824__auto____6989) {
            return or__3824__auto____6989
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
    var and__3822__auto____6994 = coll;
    if(and__3822__auto____6994) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6994
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____6995 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6996 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____6995)];
      if(or__3824__auto____6996) {
        return or__3824__auto____6996
      }else {
        var or__3824__auto____6997 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6997) {
          return or__3824__auto____6997
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
    var and__3822__auto____7002 = o;
    if(and__3822__auto____7002) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____7002
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____7003 = o == null ? null : o;
    return function() {
      var or__3824__auto____7004 = cljs.core._equiv[goog.typeOf(x__2363__auto____7003)];
      if(or__3824__auto____7004) {
        return or__3824__auto____7004
      }else {
        var or__3824__auto____7005 = cljs.core._equiv["_"];
        if(or__3824__auto____7005) {
          return or__3824__auto____7005
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
    var and__3822__auto____7010 = o;
    if(and__3822__auto____7010) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____7010
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____7011 = o == null ? null : o;
    return function() {
      var or__3824__auto____7012 = cljs.core._hash[goog.typeOf(x__2363__auto____7011)];
      if(or__3824__auto____7012) {
        return or__3824__auto____7012
      }else {
        var or__3824__auto____7013 = cljs.core._hash["_"];
        if(or__3824__auto____7013) {
          return or__3824__auto____7013
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
    var and__3822__auto____7018 = o;
    if(and__3822__auto____7018) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____7018
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____7019 = o == null ? null : o;
    return function() {
      var or__3824__auto____7020 = cljs.core._seq[goog.typeOf(x__2363__auto____7019)];
      if(or__3824__auto____7020) {
        return or__3824__auto____7020
      }else {
        var or__3824__auto____7021 = cljs.core._seq["_"];
        if(or__3824__auto____7021) {
          return or__3824__auto____7021
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
    var and__3822__auto____7026 = coll;
    if(and__3822__auto____7026) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____7026
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____7027 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7028 = cljs.core._rseq[goog.typeOf(x__2363__auto____7027)];
      if(or__3824__auto____7028) {
        return or__3824__auto____7028
      }else {
        var or__3824__auto____7029 = cljs.core._rseq["_"];
        if(or__3824__auto____7029) {
          return or__3824__auto____7029
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
    var and__3822__auto____7034 = coll;
    if(and__3822__auto____7034) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____7034
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____7035 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7036 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____7035)];
      if(or__3824__auto____7036) {
        return or__3824__auto____7036
      }else {
        var or__3824__auto____7037 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____7037) {
          return or__3824__auto____7037
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____7042 = coll;
    if(and__3822__auto____7042) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____7042
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____7043 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7044 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____7043)];
      if(or__3824__auto____7044) {
        return or__3824__auto____7044
      }else {
        var or__3824__auto____7045 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____7045) {
          return or__3824__auto____7045
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____7050 = coll;
    if(and__3822__auto____7050) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____7050
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____7051 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7052 = cljs.core._entry_key[goog.typeOf(x__2363__auto____7051)];
      if(or__3824__auto____7052) {
        return or__3824__auto____7052
      }else {
        var or__3824__auto____7053 = cljs.core._entry_key["_"];
        if(or__3824__auto____7053) {
          return or__3824__auto____7053
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____7058 = coll;
    if(and__3822__auto____7058) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____7058
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____7059 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7060 = cljs.core._comparator[goog.typeOf(x__2363__auto____7059)];
      if(or__3824__auto____7060) {
        return or__3824__auto____7060
      }else {
        var or__3824__auto____7061 = cljs.core._comparator["_"];
        if(or__3824__auto____7061) {
          return or__3824__auto____7061
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
    var and__3822__auto____7066 = o;
    if(and__3822__auto____7066) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____7066
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____7067 = o == null ? null : o;
    return function() {
      var or__3824__auto____7068 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____7067)];
      if(or__3824__auto____7068) {
        return or__3824__auto____7068
      }else {
        var or__3824__auto____7069 = cljs.core._pr_seq["_"];
        if(or__3824__auto____7069) {
          return or__3824__auto____7069
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
    var and__3822__auto____7074 = d;
    if(and__3822__auto____7074) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____7074
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____7075 = d == null ? null : d;
    return function() {
      var or__3824__auto____7076 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____7075)];
      if(or__3824__auto____7076) {
        return or__3824__auto____7076
      }else {
        var or__3824__auto____7077 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____7077) {
          return or__3824__auto____7077
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
    var and__3822__auto____7082 = this$;
    if(and__3822__auto____7082) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____7082
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____7083 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7084 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____7083)];
      if(or__3824__auto____7084) {
        return or__3824__auto____7084
      }else {
        var or__3824__auto____7085 = cljs.core._notify_watches["_"];
        if(or__3824__auto____7085) {
          return or__3824__auto____7085
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____7090 = this$;
    if(and__3822__auto____7090) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____7090
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____7091 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7092 = cljs.core._add_watch[goog.typeOf(x__2363__auto____7091)];
      if(or__3824__auto____7092) {
        return or__3824__auto____7092
      }else {
        var or__3824__auto____7093 = cljs.core._add_watch["_"];
        if(or__3824__auto____7093) {
          return or__3824__auto____7093
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____7098 = this$;
    if(and__3822__auto____7098) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____7098
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____7099 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7100 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____7099)];
      if(or__3824__auto____7100) {
        return or__3824__auto____7100
      }else {
        var or__3824__auto____7101 = cljs.core._remove_watch["_"];
        if(or__3824__auto____7101) {
          return or__3824__auto____7101
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
    var and__3822__auto____7106 = coll;
    if(and__3822__auto____7106) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____7106
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____7107 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7108 = cljs.core._as_transient[goog.typeOf(x__2363__auto____7107)];
      if(or__3824__auto____7108) {
        return or__3824__auto____7108
      }else {
        var or__3824__auto____7109 = cljs.core._as_transient["_"];
        if(or__3824__auto____7109) {
          return or__3824__auto____7109
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
    var and__3822__auto____7114 = tcoll;
    if(and__3822__auto____7114) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____7114
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____7115 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7116 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____7115)];
      if(or__3824__auto____7116) {
        return or__3824__auto____7116
      }else {
        var or__3824__auto____7117 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____7117) {
          return or__3824__auto____7117
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7122 = tcoll;
    if(and__3822__auto____7122) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____7122
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____7123 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7124 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____7123)];
      if(or__3824__auto____7124) {
        return or__3824__auto____7124
      }else {
        var or__3824__auto____7125 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____7125) {
          return or__3824__auto____7125
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
    var and__3822__auto____7130 = tcoll;
    if(and__3822__auto____7130) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____7130
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____7131 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7132 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____7131)];
      if(or__3824__auto____7132) {
        return or__3824__auto____7132
      }else {
        var or__3824__auto____7133 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____7133) {
          return or__3824__auto____7133
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
    var and__3822__auto____7138 = tcoll;
    if(and__3822__auto____7138) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____7138
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____7139 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7140 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____7139)];
      if(or__3824__auto____7140) {
        return or__3824__auto____7140
      }else {
        var or__3824__auto____7141 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____7141) {
          return or__3824__auto____7141
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
    var and__3822__auto____7146 = tcoll;
    if(and__3822__auto____7146) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____7146
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____7147 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7148 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____7147)];
      if(or__3824__auto____7148) {
        return or__3824__auto____7148
      }else {
        var or__3824__auto____7149 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____7149) {
          return or__3824__auto____7149
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7154 = tcoll;
    if(and__3822__auto____7154) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____7154
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____7155 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7156 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____7155)];
      if(or__3824__auto____7156) {
        return or__3824__auto____7156
      }else {
        var or__3824__auto____7157 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____7157) {
          return or__3824__auto____7157
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
    var and__3822__auto____7162 = tcoll;
    if(and__3822__auto____7162) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____7162
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____7163 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7164 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____7163)];
      if(or__3824__auto____7164) {
        return or__3824__auto____7164
      }else {
        var or__3824__auto____7165 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____7165) {
          return or__3824__auto____7165
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
    var and__3822__auto____7170 = x;
    if(and__3822__auto____7170) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____7170
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____7171 = x == null ? null : x;
    return function() {
      var or__3824__auto____7172 = cljs.core._compare[goog.typeOf(x__2363__auto____7171)];
      if(or__3824__auto____7172) {
        return or__3824__auto____7172
      }else {
        var or__3824__auto____7173 = cljs.core._compare["_"];
        if(or__3824__auto____7173) {
          return or__3824__auto____7173
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
    var and__3822__auto____7178 = coll;
    if(and__3822__auto____7178) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____7178
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____7179 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7180 = cljs.core._drop_first[goog.typeOf(x__2363__auto____7179)];
      if(or__3824__auto____7180) {
        return or__3824__auto____7180
      }else {
        var or__3824__auto____7181 = cljs.core._drop_first["_"];
        if(or__3824__auto____7181) {
          return or__3824__auto____7181
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
    var and__3822__auto____7186 = coll;
    if(and__3822__auto____7186) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____7186
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____7187 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7188 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____7187)];
      if(or__3824__auto____7188) {
        return or__3824__auto____7188
      }else {
        var or__3824__auto____7189 = cljs.core._chunked_first["_"];
        if(or__3824__auto____7189) {
          return or__3824__auto____7189
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____7194 = coll;
    if(and__3822__auto____7194) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____7194
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____7195 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7196 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____7195)];
      if(or__3824__auto____7196) {
        return or__3824__auto____7196
      }else {
        var or__3824__auto____7197 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____7197) {
          return or__3824__auto____7197
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
    var and__3822__auto____7202 = coll;
    if(and__3822__auto____7202) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____7202
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____7203 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7204 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____7203)];
      if(or__3824__auto____7204) {
        return or__3824__auto____7204
      }else {
        var or__3824__auto____7205 = cljs.core._chunked_next["_"];
        if(or__3824__auto____7205) {
          return or__3824__auto____7205
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
    var or__3824__auto____7207 = x === y;
    if(or__3824__auto____7207) {
      return or__3824__auto____7207
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__7208__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7209 = y;
            var G__7210 = cljs.core.first.call(null, more);
            var G__7211 = cljs.core.next.call(null, more);
            x = G__7209;
            y = G__7210;
            more = G__7211;
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
    var G__7208 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7208__delegate.call(this, x, y, more)
    };
    G__7208.cljs$lang$maxFixedArity = 2;
    G__7208.cljs$lang$applyTo = function(arglist__7212) {
      var x = cljs.core.first(arglist__7212);
      var y = cljs.core.first(cljs.core.next(arglist__7212));
      var more = cljs.core.rest(cljs.core.next(arglist__7212));
      return G__7208__delegate(x, y, more)
    };
    G__7208.cljs$lang$arity$variadic = G__7208__delegate;
    return G__7208
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
  var G__7213 = null;
  var G__7213__2 = function(o, k) {
    return null
  };
  var G__7213__3 = function(o, k, not_found) {
    return not_found
  };
  G__7213 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7213__2.call(this, o, k);
      case 3:
        return G__7213__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7213
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
  var G__7214 = null;
  var G__7214__2 = function(_, f) {
    return f.call(null)
  };
  var G__7214__3 = function(_, f, start) {
    return start
  };
  G__7214 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7214__2.call(this, _, f);
      case 3:
        return G__7214__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7214
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
  var G__7215 = null;
  var G__7215__2 = function(_, n) {
    return null
  };
  var G__7215__3 = function(_, n, not_found) {
    return not_found
  };
  G__7215 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7215__2.call(this, _, n);
      case 3:
        return G__7215__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7215
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
  var and__3822__auto____7216 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____7216) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____7216
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
    var cnt__7229 = cljs.core._count.call(null, cicoll);
    if(cnt__7229 === 0) {
      return f.call(null)
    }else {
      var val__7230 = cljs.core._nth.call(null, cicoll, 0);
      var n__7231 = 1;
      while(true) {
        if(n__7231 < cnt__7229) {
          var nval__7232 = f.call(null, val__7230, cljs.core._nth.call(null, cicoll, n__7231));
          if(cljs.core.reduced_QMARK_.call(null, nval__7232)) {
            return cljs.core.deref.call(null, nval__7232)
          }else {
            var G__7241 = nval__7232;
            var G__7242 = n__7231 + 1;
            val__7230 = G__7241;
            n__7231 = G__7242;
            continue
          }
        }else {
          return val__7230
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__7233 = cljs.core._count.call(null, cicoll);
    var val__7234 = val;
    var n__7235 = 0;
    while(true) {
      if(n__7235 < cnt__7233) {
        var nval__7236 = f.call(null, val__7234, cljs.core._nth.call(null, cicoll, n__7235));
        if(cljs.core.reduced_QMARK_.call(null, nval__7236)) {
          return cljs.core.deref.call(null, nval__7236)
        }else {
          var G__7243 = nval__7236;
          var G__7244 = n__7235 + 1;
          val__7234 = G__7243;
          n__7235 = G__7244;
          continue
        }
      }else {
        return val__7234
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__7237 = cljs.core._count.call(null, cicoll);
    var val__7238 = val;
    var n__7239 = idx;
    while(true) {
      if(n__7239 < cnt__7237) {
        var nval__7240 = f.call(null, val__7238, cljs.core._nth.call(null, cicoll, n__7239));
        if(cljs.core.reduced_QMARK_.call(null, nval__7240)) {
          return cljs.core.deref.call(null, nval__7240)
        }else {
          var G__7245 = nval__7240;
          var G__7246 = n__7239 + 1;
          val__7238 = G__7245;
          n__7239 = G__7246;
          continue
        }
      }else {
        return val__7238
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
    var cnt__7259 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__7260 = arr[0];
      var n__7261 = 1;
      while(true) {
        if(n__7261 < cnt__7259) {
          var nval__7262 = f.call(null, val__7260, arr[n__7261]);
          if(cljs.core.reduced_QMARK_.call(null, nval__7262)) {
            return cljs.core.deref.call(null, nval__7262)
          }else {
            var G__7271 = nval__7262;
            var G__7272 = n__7261 + 1;
            val__7260 = G__7271;
            n__7261 = G__7272;
            continue
          }
        }else {
          return val__7260
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__7263 = arr.length;
    var val__7264 = val;
    var n__7265 = 0;
    while(true) {
      if(n__7265 < cnt__7263) {
        var nval__7266 = f.call(null, val__7264, arr[n__7265]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7266)) {
          return cljs.core.deref.call(null, nval__7266)
        }else {
          var G__7273 = nval__7266;
          var G__7274 = n__7265 + 1;
          val__7264 = G__7273;
          n__7265 = G__7274;
          continue
        }
      }else {
        return val__7264
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__7267 = arr.length;
    var val__7268 = val;
    var n__7269 = idx;
    while(true) {
      if(n__7269 < cnt__7267) {
        var nval__7270 = f.call(null, val__7268, arr[n__7269]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7270)) {
          return cljs.core.deref.call(null, nval__7270)
        }else {
          var G__7275 = nval__7270;
          var G__7276 = n__7269 + 1;
          val__7268 = G__7275;
          n__7269 = G__7276;
          continue
        }
      }else {
        return val__7268
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
  var this__7277 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__7278 = this;
  if(this__7278.i + 1 < this__7278.a.length) {
    return new cljs.core.IndexedSeq(this__7278.a, this__7278.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7279 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__7280 = this;
  var c__7281 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__7281 > 0) {
    return new cljs.core.RSeq(coll, c__7281 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__7282 = this;
  var this__7283 = this;
  return cljs.core.pr_str.call(null, this__7283)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7284 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7284.a)) {
    return cljs.core.ci_reduce.call(null, this__7284.a, f, this__7284.a[this__7284.i], this__7284.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__7284.a[this__7284.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7285 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7285.a)) {
    return cljs.core.ci_reduce.call(null, this__7285.a, f, start, this__7285.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7286 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7287 = this;
  return this__7287.a.length - this__7287.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__7288 = this;
  return this__7288.a[this__7288.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__7289 = this;
  if(this__7289.i + 1 < this__7289.a.length) {
    return new cljs.core.IndexedSeq(this__7289.a, this__7289.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7290 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7291 = this;
  var i__7292 = n + this__7291.i;
  if(i__7292 < this__7291.a.length) {
    return this__7291.a[i__7292]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7293 = this;
  var i__7294 = n + this__7293.i;
  if(i__7294 < this__7293.a.length) {
    return this__7293.a[i__7294]
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
  var G__7295 = null;
  var G__7295__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__7295__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__7295 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7295__2.call(this, array, f);
      case 3:
        return G__7295__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7295
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__7296 = null;
  var G__7296__2 = function(array, k) {
    return array[k]
  };
  var G__7296__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__7296 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7296__2.call(this, array, k);
      case 3:
        return G__7296__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7296
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__7297 = null;
  var G__7297__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__7297__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__7297 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7297__2.call(this, array, n);
      case 3:
        return G__7297__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7297
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
  var this__7298 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7299 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__7300 = this;
  var this__7301 = this;
  return cljs.core.pr_str.call(null, this__7301)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7302 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7303 = this;
  return this__7303.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7304 = this;
  return cljs.core._nth.call(null, this__7304.ci, this__7304.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7305 = this;
  if(this__7305.i > 0) {
    return new cljs.core.RSeq(this__7305.ci, this__7305.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7306 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__7307 = this;
  return new cljs.core.RSeq(this__7307.ci, this__7307.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7308 = this;
  return this__7308.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7312__7313 = coll;
      if(G__7312__7313) {
        if(function() {
          var or__3824__auto____7314 = G__7312__7313.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____7314) {
            return or__3824__auto____7314
          }else {
            return G__7312__7313.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__7312__7313.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7312__7313)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7312__7313)
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
      var G__7319__7320 = coll;
      if(G__7319__7320) {
        if(function() {
          var or__3824__auto____7321 = G__7319__7320.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7321) {
            return or__3824__auto____7321
          }else {
            return G__7319__7320.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7319__7320.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7319__7320)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7319__7320)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__7322 = cljs.core.seq.call(null, coll);
      if(s__7322 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__7322)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__7327__7328 = coll;
      if(G__7327__7328) {
        if(function() {
          var or__3824__auto____7329 = G__7327__7328.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7329) {
            return or__3824__auto____7329
          }else {
            return G__7327__7328.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7327__7328.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7327__7328)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7327__7328)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__7330 = cljs.core.seq.call(null, coll);
      if(!(s__7330 == null)) {
        return cljs.core._rest.call(null, s__7330)
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
      var G__7334__7335 = coll;
      if(G__7334__7335) {
        if(function() {
          var or__3824__auto____7336 = G__7334__7335.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____7336) {
            return or__3824__auto____7336
          }else {
            return G__7334__7335.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__7334__7335.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7334__7335)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7334__7335)
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
    var sn__7338 = cljs.core.next.call(null, s);
    if(!(sn__7338 == null)) {
      var G__7339 = sn__7338;
      s = G__7339;
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
    var G__7340__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__7341 = conj.call(null, coll, x);
          var G__7342 = cljs.core.first.call(null, xs);
          var G__7343 = cljs.core.next.call(null, xs);
          coll = G__7341;
          x = G__7342;
          xs = G__7343;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__7340 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7340__delegate.call(this, coll, x, xs)
    };
    G__7340.cljs$lang$maxFixedArity = 2;
    G__7340.cljs$lang$applyTo = function(arglist__7344) {
      var coll = cljs.core.first(arglist__7344);
      var x = cljs.core.first(cljs.core.next(arglist__7344));
      var xs = cljs.core.rest(cljs.core.next(arglist__7344));
      return G__7340__delegate(coll, x, xs)
    };
    G__7340.cljs$lang$arity$variadic = G__7340__delegate;
    return G__7340
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
  var s__7347 = cljs.core.seq.call(null, coll);
  var acc__7348 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__7347)) {
      return acc__7348 + cljs.core._count.call(null, s__7347)
    }else {
      var G__7349 = cljs.core.next.call(null, s__7347);
      var G__7350 = acc__7348 + 1;
      s__7347 = G__7349;
      acc__7348 = G__7350;
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
        var G__7357__7358 = coll;
        if(G__7357__7358) {
          if(function() {
            var or__3824__auto____7359 = G__7357__7358.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7359) {
              return or__3824__auto____7359
            }else {
              return G__7357__7358.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7357__7358.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7357__7358)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7357__7358)
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
        var G__7360__7361 = coll;
        if(G__7360__7361) {
          if(function() {
            var or__3824__auto____7362 = G__7360__7361.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7362) {
              return or__3824__auto____7362
            }else {
              return G__7360__7361.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7360__7361.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7360__7361)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7360__7361)
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
    var G__7365__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__7364 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__7366 = ret__7364;
          var G__7367 = cljs.core.first.call(null, kvs);
          var G__7368 = cljs.core.second.call(null, kvs);
          var G__7369 = cljs.core.nnext.call(null, kvs);
          coll = G__7366;
          k = G__7367;
          v = G__7368;
          kvs = G__7369;
          continue
        }else {
          return ret__7364
        }
        break
      }
    };
    var G__7365 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7365__delegate.call(this, coll, k, v, kvs)
    };
    G__7365.cljs$lang$maxFixedArity = 3;
    G__7365.cljs$lang$applyTo = function(arglist__7370) {
      var coll = cljs.core.first(arglist__7370);
      var k = cljs.core.first(cljs.core.next(arglist__7370));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7370)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7370)));
      return G__7365__delegate(coll, k, v, kvs)
    };
    G__7365.cljs$lang$arity$variadic = G__7365__delegate;
    return G__7365
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
    var G__7373__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7372 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7374 = ret__7372;
          var G__7375 = cljs.core.first.call(null, ks);
          var G__7376 = cljs.core.next.call(null, ks);
          coll = G__7374;
          k = G__7375;
          ks = G__7376;
          continue
        }else {
          return ret__7372
        }
        break
      }
    };
    var G__7373 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7373__delegate.call(this, coll, k, ks)
    };
    G__7373.cljs$lang$maxFixedArity = 2;
    G__7373.cljs$lang$applyTo = function(arglist__7377) {
      var coll = cljs.core.first(arglist__7377);
      var k = cljs.core.first(cljs.core.next(arglist__7377));
      var ks = cljs.core.rest(cljs.core.next(arglist__7377));
      return G__7373__delegate(coll, k, ks)
    };
    G__7373.cljs$lang$arity$variadic = G__7373__delegate;
    return G__7373
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
    var G__7381__7382 = o;
    if(G__7381__7382) {
      if(function() {
        var or__3824__auto____7383 = G__7381__7382.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____7383) {
          return or__3824__auto____7383
        }else {
          return G__7381__7382.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7381__7382.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7381__7382)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7381__7382)
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
    var G__7386__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7385 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7387 = ret__7385;
          var G__7388 = cljs.core.first.call(null, ks);
          var G__7389 = cljs.core.next.call(null, ks);
          coll = G__7387;
          k = G__7388;
          ks = G__7389;
          continue
        }else {
          return ret__7385
        }
        break
      }
    };
    var G__7386 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7386__delegate.call(this, coll, k, ks)
    };
    G__7386.cljs$lang$maxFixedArity = 2;
    G__7386.cljs$lang$applyTo = function(arglist__7390) {
      var coll = cljs.core.first(arglist__7390);
      var k = cljs.core.first(cljs.core.next(arglist__7390));
      var ks = cljs.core.rest(cljs.core.next(arglist__7390));
      return G__7386__delegate(coll, k, ks)
    };
    G__7386.cljs$lang$arity$variadic = G__7386__delegate;
    return G__7386
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
  var h__7392 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__7392;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__7392
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__7394 = cljs.core.string_hash_cache[k];
  if(!(h__7394 == null)) {
    return h__7394
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
      var and__3822__auto____7396 = goog.isString(o);
      if(and__3822__auto____7396) {
        return check_cache
      }else {
        return and__3822__auto____7396
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
    var G__7400__7401 = x;
    if(G__7400__7401) {
      if(function() {
        var or__3824__auto____7402 = G__7400__7401.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____7402) {
          return or__3824__auto____7402
        }else {
          return G__7400__7401.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__7400__7401.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7400__7401)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7400__7401)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7406__7407 = x;
    if(G__7406__7407) {
      if(function() {
        var or__3824__auto____7408 = G__7406__7407.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____7408) {
          return or__3824__auto____7408
        }else {
          return G__7406__7407.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__7406__7407.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7406__7407)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7406__7407)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__7412__7413 = x;
  if(G__7412__7413) {
    if(function() {
      var or__3824__auto____7414 = G__7412__7413.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____7414) {
        return or__3824__auto____7414
      }else {
        return G__7412__7413.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__7412__7413.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7412__7413)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7412__7413)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__7418__7419 = x;
  if(G__7418__7419) {
    if(function() {
      var or__3824__auto____7420 = G__7418__7419.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____7420) {
        return or__3824__auto____7420
      }else {
        return G__7418__7419.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__7418__7419.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7418__7419)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7418__7419)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__7424__7425 = x;
  if(G__7424__7425) {
    if(function() {
      var or__3824__auto____7426 = G__7424__7425.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____7426) {
        return or__3824__auto____7426
      }else {
        return G__7424__7425.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__7424__7425.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7424__7425)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7424__7425)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__7430__7431 = x;
  if(G__7430__7431) {
    if(function() {
      var or__3824__auto____7432 = G__7430__7431.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____7432) {
        return or__3824__auto____7432
      }else {
        return G__7430__7431.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__7430__7431.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7430__7431)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7430__7431)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__7436__7437 = x;
  if(G__7436__7437) {
    if(function() {
      var or__3824__auto____7438 = G__7436__7437.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____7438) {
        return or__3824__auto____7438
      }else {
        return G__7436__7437.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__7436__7437.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7436__7437)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7436__7437)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7442__7443 = x;
    if(G__7442__7443) {
      if(function() {
        var or__3824__auto____7444 = G__7442__7443.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____7444) {
          return or__3824__auto____7444
        }else {
          return G__7442__7443.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7442__7443.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7442__7443)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7442__7443)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7448__7449 = x;
  if(G__7448__7449) {
    if(function() {
      var or__3824__auto____7450 = G__7448__7449.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____7450) {
        return or__3824__auto____7450
      }else {
        return G__7448__7449.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7448__7449.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7448__7449)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7448__7449)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7454__7455 = x;
  if(G__7454__7455) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____7456 = null;
      if(cljs.core.truth_(or__3824__auto____7456)) {
        return or__3824__auto____7456
      }else {
        return G__7454__7455.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__7454__7455.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7454__7455)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7454__7455)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7457__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7457 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7457__delegate.call(this, keyvals)
    };
    G__7457.cljs$lang$maxFixedArity = 0;
    G__7457.cljs$lang$applyTo = function(arglist__7458) {
      var keyvals = cljs.core.seq(arglist__7458);
      return G__7457__delegate(keyvals)
    };
    G__7457.cljs$lang$arity$variadic = G__7457__delegate;
    return G__7457
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
  var keys__7460 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7460.push(key)
  });
  return keys__7460
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7464 = i;
  var j__7465 = j;
  var len__7466 = len;
  while(true) {
    if(len__7466 === 0) {
      return to
    }else {
      to[j__7465] = from[i__7464];
      var G__7467 = i__7464 + 1;
      var G__7468 = j__7465 + 1;
      var G__7469 = len__7466 - 1;
      i__7464 = G__7467;
      j__7465 = G__7468;
      len__7466 = G__7469;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7473 = i + (len - 1);
  var j__7474 = j + (len - 1);
  var len__7475 = len;
  while(true) {
    if(len__7475 === 0) {
      return to
    }else {
      to[j__7474] = from[i__7473];
      var G__7476 = i__7473 - 1;
      var G__7477 = j__7474 - 1;
      var G__7478 = len__7475 - 1;
      i__7473 = G__7476;
      j__7474 = G__7477;
      len__7475 = G__7478;
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
    var G__7482__7483 = s;
    if(G__7482__7483) {
      if(function() {
        var or__3824__auto____7484 = G__7482__7483.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7484) {
          return or__3824__auto____7484
        }else {
          return G__7482__7483.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7482__7483.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7482__7483)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7482__7483)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7488__7489 = s;
  if(G__7488__7489) {
    if(function() {
      var or__3824__auto____7490 = G__7488__7489.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7490) {
        return or__3824__auto____7490
      }else {
        return G__7488__7489.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7488__7489.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7488__7489)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7488__7489)
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
  var and__3822__auto____7493 = goog.isString(x);
  if(and__3822__auto____7493) {
    return!function() {
      var or__3824__auto____7494 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7494) {
        return or__3824__auto____7494
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7493
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7496 = goog.isString(x);
  if(and__3822__auto____7496) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7496
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7498 = goog.isString(x);
  if(and__3822__auto____7498) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7498
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7503 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7503) {
    return or__3824__auto____7503
  }else {
    var G__7504__7505 = f;
    if(G__7504__7505) {
      if(function() {
        var or__3824__auto____7506 = G__7504__7505.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7506) {
          return or__3824__auto____7506
        }else {
          return G__7504__7505.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7504__7505.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7504__7505)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7504__7505)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7508 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7508) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7508
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
    var and__3822__auto____7511 = coll;
    if(cljs.core.truth_(and__3822__auto____7511)) {
      var and__3822__auto____7512 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7512) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7512
      }
    }else {
      return and__3822__auto____7511
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
    var G__7521__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7517 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7518 = more;
        while(true) {
          var x__7519 = cljs.core.first.call(null, xs__7518);
          var etc__7520 = cljs.core.next.call(null, xs__7518);
          if(cljs.core.truth_(xs__7518)) {
            if(cljs.core.contains_QMARK_.call(null, s__7517, x__7519)) {
              return false
            }else {
              var G__7522 = cljs.core.conj.call(null, s__7517, x__7519);
              var G__7523 = etc__7520;
              s__7517 = G__7522;
              xs__7518 = G__7523;
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
    var G__7521 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7521__delegate.call(this, x, y, more)
    };
    G__7521.cljs$lang$maxFixedArity = 2;
    G__7521.cljs$lang$applyTo = function(arglist__7524) {
      var x = cljs.core.first(arglist__7524);
      var y = cljs.core.first(cljs.core.next(arglist__7524));
      var more = cljs.core.rest(cljs.core.next(arglist__7524));
      return G__7521__delegate(x, y, more)
    };
    G__7521.cljs$lang$arity$variadic = G__7521__delegate;
    return G__7521
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
            var G__7528__7529 = x;
            if(G__7528__7529) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7530 = null;
                if(cljs.core.truth_(or__3824__auto____7530)) {
                  return or__3824__auto____7530
                }else {
                  return G__7528__7529.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7528__7529.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7528__7529)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7528__7529)
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
    var xl__7535 = cljs.core.count.call(null, xs);
    var yl__7536 = cljs.core.count.call(null, ys);
    if(xl__7535 < yl__7536) {
      return-1
    }else {
      if(xl__7535 > yl__7536) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7535, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7537 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7538 = d__7537 === 0;
        if(and__3822__auto____7538) {
          return n + 1 < len
        }else {
          return and__3822__auto____7538
        }
      }()) {
        var G__7539 = xs;
        var G__7540 = ys;
        var G__7541 = len;
        var G__7542 = n + 1;
        xs = G__7539;
        ys = G__7540;
        len = G__7541;
        n = G__7542;
        continue
      }else {
        return d__7537
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
      var r__7544 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7544)) {
        return r__7544
      }else {
        if(cljs.core.truth_(r__7544)) {
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
      var a__7546 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7546, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7546)
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
    var temp__3971__auto____7552 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7552) {
      var s__7553 = temp__3971__auto____7552;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7553), cljs.core.next.call(null, s__7553))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7554 = val;
    var coll__7555 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7555) {
        var nval__7556 = f.call(null, val__7554, cljs.core.first.call(null, coll__7555));
        if(cljs.core.reduced_QMARK_.call(null, nval__7556)) {
          return cljs.core.deref.call(null, nval__7556)
        }else {
          var G__7557 = nval__7556;
          var G__7558 = cljs.core.next.call(null, coll__7555);
          val__7554 = G__7557;
          coll__7555 = G__7558;
          continue
        }
      }else {
        return val__7554
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
  var a__7560 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7560);
  return cljs.core.vec.call(null, a__7560)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7567__7568 = coll;
      if(G__7567__7568) {
        if(function() {
          var or__3824__auto____7569 = G__7567__7568.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7569) {
            return or__3824__auto____7569
          }else {
            return G__7567__7568.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7567__7568.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7567__7568)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7567__7568)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7570__7571 = coll;
      if(G__7570__7571) {
        if(function() {
          var or__3824__auto____7572 = G__7570__7571.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7572) {
            return or__3824__auto____7572
          }else {
            return G__7570__7571.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7570__7571.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7570__7571)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7570__7571)
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
  var this__7573 = this;
  return this__7573.val
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
    var G__7574__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7574 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7574__delegate.call(this, x, y, more)
    };
    G__7574.cljs$lang$maxFixedArity = 2;
    G__7574.cljs$lang$applyTo = function(arglist__7575) {
      var x = cljs.core.first(arglist__7575);
      var y = cljs.core.first(cljs.core.next(arglist__7575));
      var more = cljs.core.rest(cljs.core.next(arglist__7575));
      return G__7574__delegate(x, y, more)
    };
    G__7574.cljs$lang$arity$variadic = G__7574__delegate;
    return G__7574
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
    var G__7576__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7576 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7576__delegate.call(this, x, y, more)
    };
    G__7576.cljs$lang$maxFixedArity = 2;
    G__7576.cljs$lang$applyTo = function(arglist__7577) {
      var x = cljs.core.first(arglist__7577);
      var y = cljs.core.first(cljs.core.next(arglist__7577));
      var more = cljs.core.rest(cljs.core.next(arglist__7577));
      return G__7576__delegate(x, y, more)
    };
    G__7576.cljs$lang$arity$variadic = G__7576__delegate;
    return G__7576
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
    var G__7578__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7578 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7578__delegate.call(this, x, y, more)
    };
    G__7578.cljs$lang$maxFixedArity = 2;
    G__7578.cljs$lang$applyTo = function(arglist__7579) {
      var x = cljs.core.first(arglist__7579);
      var y = cljs.core.first(cljs.core.next(arglist__7579));
      var more = cljs.core.rest(cljs.core.next(arglist__7579));
      return G__7578__delegate(x, y, more)
    };
    G__7578.cljs$lang$arity$variadic = G__7578__delegate;
    return G__7578
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
    var G__7580__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7580 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7580__delegate.call(this, x, y, more)
    };
    G__7580.cljs$lang$maxFixedArity = 2;
    G__7580.cljs$lang$applyTo = function(arglist__7581) {
      var x = cljs.core.first(arglist__7581);
      var y = cljs.core.first(cljs.core.next(arglist__7581));
      var more = cljs.core.rest(cljs.core.next(arglist__7581));
      return G__7580__delegate(x, y, more)
    };
    G__7580.cljs$lang$arity$variadic = G__7580__delegate;
    return G__7580
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
    var G__7582__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7583 = y;
            var G__7584 = cljs.core.first.call(null, more);
            var G__7585 = cljs.core.next.call(null, more);
            x = G__7583;
            y = G__7584;
            more = G__7585;
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
    var G__7582 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7582__delegate.call(this, x, y, more)
    };
    G__7582.cljs$lang$maxFixedArity = 2;
    G__7582.cljs$lang$applyTo = function(arglist__7586) {
      var x = cljs.core.first(arglist__7586);
      var y = cljs.core.first(cljs.core.next(arglist__7586));
      var more = cljs.core.rest(cljs.core.next(arglist__7586));
      return G__7582__delegate(x, y, more)
    };
    G__7582.cljs$lang$arity$variadic = G__7582__delegate;
    return G__7582
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
    var G__7587__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7588 = y;
            var G__7589 = cljs.core.first.call(null, more);
            var G__7590 = cljs.core.next.call(null, more);
            x = G__7588;
            y = G__7589;
            more = G__7590;
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
    var G__7587 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7587__delegate.call(this, x, y, more)
    };
    G__7587.cljs$lang$maxFixedArity = 2;
    G__7587.cljs$lang$applyTo = function(arglist__7591) {
      var x = cljs.core.first(arglist__7591);
      var y = cljs.core.first(cljs.core.next(arglist__7591));
      var more = cljs.core.rest(cljs.core.next(arglist__7591));
      return G__7587__delegate(x, y, more)
    };
    G__7587.cljs$lang$arity$variadic = G__7587__delegate;
    return G__7587
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
    var G__7592__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7593 = y;
            var G__7594 = cljs.core.first.call(null, more);
            var G__7595 = cljs.core.next.call(null, more);
            x = G__7593;
            y = G__7594;
            more = G__7595;
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
    var G__7592 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7592__delegate.call(this, x, y, more)
    };
    G__7592.cljs$lang$maxFixedArity = 2;
    G__7592.cljs$lang$applyTo = function(arglist__7596) {
      var x = cljs.core.first(arglist__7596);
      var y = cljs.core.first(cljs.core.next(arglist__7596));
      var more = cljs.core.rest(cljs.core.next(arglist__7596));
      return G__7592__delegate(x, y, more)
    };
    G__7592.cljs$lang$arity$variadic = G__7592__delegate;
    return G__7592
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
    var G__7597__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7598 = y;
            var G__7599 = cljs.core.first.call(null, more);
            var G__7600 = cljs.core.next.call(null, more);
            x = G__7598;
            y = G__7599;
            more = G__7600;
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
    var G__7597 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7597__delegate.call(this, x, y, more)
    };
    G__7597.cljs$lang$maxFixedArity = 2;
    G__7597.cljs$lang$applyTo = function(arglist__7601) {
      var x = cljs.core.first(arglist__7601);
      var y = cljs.core.first(cljs.core.next(arglist__7601));
      var more = cljs.core.rest(cljs.core.next(arglist__7601));
      return G__7597__delegate(x, y, more)
    };
    G__7597.cljs$lang$arity$variadic = G__7597__delegate;
    return G__7597
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
    var G__7602__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7602 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7602__delegate.call(this, x, y, more)
    };
    G__7602.cljs$lang$maxFixedArity = 2;
    G__7602.cljs$lang$applyTo = function(arglist__7603) {
      var x = cljs.core.first(arglist__7603);
      var y = cljs.core.first(cljs.core.next(arglist__7603));
      var more = cljs.core.rest(cljs.core.next(arglist__7603));
      return G__7602__delegate(x, y, more)
    };
    G__7602.cljs$lang$arity$variadic = G__7602__delegate;
    return G__7602
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
    var G__7604__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7604 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7604__delegate.call(this, x, y, more)
    };
    G__7604.cljs$lang$maxFixedArity = 2;
    G__7604.cljs$lang$applyTo = function(arglist__7605) {
      var x = cljs.core.first(arglist__7605);
      var y = cljs.core.first(cljs.core.next(arglist__7605));
      var more = cljs.core.rest(cljs.core.next(arglist__7605));
      return G__7604__delegate(x, y, more)
    };
    G__7604.cljs$lang$arity$variadic = G__7604__delegate;
    return G__7604
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
  var rem__7607 = n % d;
  return cljs.core.fix.call(null, (n - rem__7607) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7609 = cljs.core.quot.call(null, n, d);
  return n - d * q__7609
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
  var v__7612 = v - (v >> 1 & 1431655765);
  var v__7613 = (v__7612 & 858993459) + (v__7612 >> 2 & 858993459);
  return(v__7613 + (v__7613 >> 4) & 252645135) * 16843009 >> 24
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
    var G__7614__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7615 = y;
            var G__7616 = cljs.core.first.call(null, more);
            var G__7617 = cljs.core.next.call(null, more);
            x = G__7615;
            y = G__7616;
            more = G__7617;
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
    var G__7614 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7614__delegate.call(this, x, y, more)
    };
    G__7614.cljs$lang$maxFixedArity = 2;
    G__7614.cljs$lang$applyTo = function(arglist__7618) {
      var x = cljs.core.first(arglist__7618);
      var y = cljs.core.first(cljs.core.next(arglist__7618));
      var more = cljs.core.rest(cljs.core.next(arglist__7618));
      return G__7614__delegate(x, y, more)
    };
    G__7614.cljs$lang$arity$variadic = G__7614__delegate;
    return G__7614
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
  var n__7622 = n;
  var xs__7623 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7624 = xs__7623;
      if(and__3822__auto____7624) {
        return n__7622 > 0
      }else {
        return and__3822__auto____7624
      }
    }())) {
      var G__7625 = n__7622 - 1;
      var G__7626 = cljs.core.next.call(null, xs__7623);
      n__7622 = G__7625;
      xs__7623 = G__7626;
      continue
    }else {
      return xs__7623
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
    var G__7627__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7628 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7629 = cljs.core.next.call(null, more);
            sb = G__7628;
            more = G__7629;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7627 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7627__delegate.call(this, x, ys)
    };
    G__7627.cljs$lang$maxFixedArity = 1;
    G__7627.cljs$lang$applyTo = function(arglist__7630) {
      var x = cljs.core.first(arglist__7630);
      var ys = cljs.core.rest(arglist__7630);
      return G__7627__delegate(x, ys)
    };
    G__7627.cljs$lang$arity$variadic = G__7627__delegate;
    return G__7627
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
    var G__7631__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7632 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7633 = cljs.core.next.call(null, more);
            sb = G__7632;
            more = G__7633;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7631 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7631__delegate.call(this, x, ys)
    };
    G__7631.cljs$lang$maxFixedArity = 1;
    G__7631.cljs$lang$applyTo = function(arglist__7634) {
      var x = cljs.core.first(arglist__7634);
      var ys = cljs.core.rest(arglist__7634);
      return G__7631__delegate(x, ys)
    };
    G__7631.cljs$lang$arity$variadic = G__7631__delegate;
    return G__7631
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
  format.cljs$lang$applyTo = function(arglist__7635) {
    var fmt = cljs.core.first(arglist__7635);
    var args = cljs.core.rest(arglist__7635);
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
    var xs__7638 = cljs.core.seq.call(null, x);
    var ys__7639 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7638 == null) {
        return ys__7639 == null
      }else {
        if(ys__7639 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7638), cljs.core.first.call(null, ys__7639))) {
            var G__7640 = cljs.core.next.call(null, xs__7638);
            var G__7641 = cljs.core.next.call(null, ys__7639);
            xs__7638 = G__7640;
            ys__7639 = G__7641;
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
  return cljs.core.reduce.call(null, function(p1__7642_SHARP_, p2__7643_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7642_SHARP_, cljs.core.hash.call(null, p2__7643_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7647 = 0;
  var s__7648 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7648) {
      var e__7649 = cljs.core.first.call(null, s__7648);
      var G__7650 = (h__7647 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7649)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7649)))) % 4503599627370496;
      var G__7651 = cljs.core.next.call(null, s__7648);
      h__7647 = G__7650;
      s__7648 = G__7651;
      continue
    }else {
      return h__7647
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7655 = 0;
  var s__7656 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7656) {
      var e__7657 = cljs.core.first.call(null, s__7656);
      var G__7658 = (h__7655 + cljs.core.hash.call(null, e__7657)) % 4503599627370496;
      var G__7659 = cljs.core.next.call(null, s__7656);
      h__7655 = G__7658;
      s__7656 = G__7659;
      continue
    }else {
      return h__7655
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7680__7681 = cljs.core.seq.call(null, fn_map);
  if(G__7680__7681) {
    var G__7683__7685 = cljs.core.first.call(null, G__7680__7681);
    var vec__7684__7686 = G__7683__7685;
    var key_name__7687 = cljs.core.nth.call(null, vec__7684__7686, 0, null);
    var f__7688 = cljs.core.nth.call(null, vec__7684__7686, 1, null);
    var G__7680__7689 = G__7680__7681;
    var G__7683__7690 = G__7683__7685;
    var G__7680__7691 = G__7680__7689;
    while(true) {
      var vec__7692__7693 = G__7683__7690;
      var key_name__7694 = cljs.core.nth.call(null, vec__7692__7693, 0, null);
      var f__7695 = cljs.core.nth.call(null, vec__7692__7693, 1, null);
      var G__7680__7696 = G__7680__7691;
      var str_name__7697 = cljs.core.name.call(null, key_name__7694);
      obj[str_name__7697] = f__7695;
      var temp__3974__auto____7698 = cljs.core.next.call(null, G__7680__7696);
      if(temp__3974__auto____7698) {
        var G__7680__7699 = temp__3974__auto____7698;
        var G__7700 = cljs.core.first.call(null, G__7680__7699);
        var G__7701 = G__7680__7699;
        G__7683__7690 = G__7700;
        G__7680__7691 = G__7701;
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
  var this__7702 = this;
  var h__2192__auto____7703 = this__7702.__hash;
  if(!(h__2192__auto____7703 == null)) {
    return h__2192__auto____7703
  }else {
    var h__2192__auto____7704 = cljs.core.hash_coll.call(null, coll);
    this__7702.__hash = h__2192__auto____7704;
    return h__2192__auto____7704
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7705 = this;
  if(this__7705.count === 1) {
    return null
  }else {
    return this__7705.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7706 = this;
  return new cljs.core.List(this__7706.meta, o, coll, this__7706.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7707 = this;
  var this__7708 = this;
  return cljs.core.pr_str.call(null, this__7708)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7709 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7710 = this;
  return this__7710.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7711 = this;
  return this__7711.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7712 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7713 = this;
  return this__7713.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7714 = this;
  if(this__7714.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7714.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7715 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7716 = this;
  return new cljs.core.List(meta, this__7716.first, this__7716.rest, this__7716.count, this__7716.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7717 = this;
  return this__7717.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7718 = this;
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
  var this__7719 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7720 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7721 = this;
  return new cljs.core.List(this__7721.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7722 = this;
  var this__7723 = this;
  return cljs.core.pr_str.call(null, this__7723)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7724 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7725 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7726 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7727 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7728 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7729 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7730 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7731 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7732 = this;
  return this__7732.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7733 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7737__7738 = coll;
  if(G__7737__7738) {
    if(function() {
      var or__3824__auto____7739 = G__7737__7738.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7739) {
        return or__3824__auto____7739
      }else {
        return G__7737__7738.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7737__7738.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7737__7738)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7737__7738)
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
    var G__7740__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7740 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7740__delegate.call(this, x, y, z, items)
    };
    G__7740.cljs$lang$maxFixedArity = 3;
    G__7740.cljs$lang$applyTo = function(arglist__7741) {
      var x = cljs.core.first(arglist__7741);
      var y = cljs.core.first(cljs.core.next(arglist__7741));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7741)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7741)));
      return G__7740__delegate(x, y, z, items)
    };
    G__7740.cljs$lang$arity$variadic = G__7740__delegate;
    return G__7740
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
  var this__7742 = this;
  var h__2192__auto____7743 = this__7742.__hash;
  if(!(h__2192__auto____7743 == null)) {
    return h__2192__auto____7743
  }else {
    var h__2192__auto____7744 = cljs.core.hash_coll.call(null, coll);
    this__7742.__hash = h__2192__auto____7744;
    return h__2192__auto____7744
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7745 = this;
  if(this__7745.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7745.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7746 = this;
  return new cljs.core.Cons(null, o, coll, this__7746.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7747 = this;
  var this__7748 = this;
  return cljs.core.pr_str.call(null, this__7748)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7749 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7750 = this;
  return this__7750.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7751 = this;
  if(this__7751.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7751.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7752 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7753 = this;
  return new cljs.core.Cons(meta, this__7753.first, this__7753.rest, this__7753.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7754 = this;
  return this__7754.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7755 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7755.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7760 = coll == null;
    if(or__3824__auto____7760) {
      return or__3824__auto____7760
    }else {
      var G__7761__7762 = coll;
      if(G__7761__7762) {
        if(function() {
          var or__3824__auto____7763 = G__7761__7762.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7763) {
            return or__3824__auto____7763
          }else {
            return G__7761__7762.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7761__7762.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7761__7762)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7761__7762)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7767__7768 = x;
  if(G__7767__7768) {
    if(function() {
      var or__3824__auto____7769 = G__7767__7768.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7769) {
        return or__3824__auto____7769
      }else {
        return G__7767__7768.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7767__7768.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7767__7768)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7767__7768)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7770 = null;
  var G__7770__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7770__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7770 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7770__2.call(this, string, f);
      case 3:
        return G__7770__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7770
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7771 = null;
  var G__7771__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7771__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7771 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7771__2.call(this, string, k);
      case 3:
        return G__7771__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7771
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7772 = null;
  var G__7772__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7772__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7772 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7772__2.call(this, string, n);
      case 3:
        return G__7772__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7772
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
  var G__7784 = null;
  var G__7784__2 = function(this_sym7775, coll) {
    var this__7777 = this;
    var this_sym7775__7778 = this;
    var ___7779 = this_sym7775__7778;
    if(coll == null) {
      return null
    }else {
      var strobj__7780 = coll.strobj;
      if(strobj__7780 == null) {
        return cljs.core._lookup.call(null, coll, this__7777.k, null)
      }else {
        return strobj__7780[this__7777.k]
      }
    }
  };
  var G__7784__3 = function(this_sym7776, coll, not_found) {
    var this__7777 = this;
    var this_sym7776__7781 = this;
    var ___7782 = this_sym7776__7781;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7777.k, not_found)
    }
  };
  G__7784 = function(this_sym7776, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7784__2.call(this, this_sym7776, coll);
      case 3:
        return G__7784__3.call(this, this_sym7776, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7784
}();
cljs.core.Keyword.prototype.apply = function(this_sym7773, args7774) {
  var this__7783 = this;
  return this_sym7773.call.apply(this_sym7773, [this_sym7773].concat(args7774.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7793 = null;
  var G__7793__2 = function(this_sym7787, coll) {
    var this_sym7787__7789 = this;
    var this__7790 = this_sym7787__7789;
    return cljs.core._lookup.call(null, coll, this__7790.toString(), null)
  };
  var G__7793__3 = function(this_sym7788, coll, not_found) {
    var this_sym7788__7791 = this;
    var this__7792 = this_sym7788__7791;
    return cljs.core._lookup.call(null, coll, this__7792.toString(), not_found)
  };
  G__7793 = function(this_sym7788, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7793__2.call(this, this_sym7788, coll);
      case 3:
        return G__7793__3.call(this, this_sym7788, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7793
}();
String.prototype.apply = function(this_sym7785, args7786) {
  return this_sym7785.call.apply(this_sym7785, [this_sym7785].concat(args7786.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7795 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7795
  }else {
    lazy_seq.x = x__7795.call(null);
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
  var this__7796 = this;
  var h__2192__auto____7797 = this__7796.__hash;
  if(!(h__2192__auto____7797 == null)) {
    return h__2192__auto____7797
  }else {
    var h__2192__auto____7798 = cljs.core.hash_coll.call(null, coll);
    this__7796.__hash = h__2192__auto____7798;
    return h__2192__auto____7798
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7799 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7800 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7801 = this;
  var this__7802 = this;
  return cljs.core.pr_str.call(null, this__7802)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7803 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7804 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7805 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7806 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7807 = this;
  return new cljs.core.LazySeq(meta, this__7807.realized, this__7807.x, this__7807.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7808 = this;
  return this__7808.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7809 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7809.meta)
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
  var this__7810 = this;
  return this__7810.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7811 = this;
  var ___7812 = this;
  this__7811.buf[this__7811.end] = o;
  return this__7811.end = this__7811.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7813 = this;
  var ___7814 = this;
  var ret__7815 = new cljs.core.ArrayChunk(this__7813.buf, 0, this__7813.end);
  this__7813.buf = null;
  return ret__7815
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
  var this__7816 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7816.arr[this__7816.off], this__7816.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7817 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7817.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7818 = this;
  if(this__7818.off === this__7818.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7818.arr, this__7818.off + 1, this__7818.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7819 = this;
  return this__7819.arr[this__7819.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7820 = this;
  if(function() {
    var and__3822__auto____7821 = i >= 0;
    if(and__3822__auto____7821) {
      return i < this__7820.end - this__7820.off
    }else {
      return and__3822__auto____7821
    }
  }()) {
    return this__7820.arr[this__7820.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7822 = this;
  return this__7822.end - this__7822.off
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
  var this__7823 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7824 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7825 = this;
  return cljs.core._nth.call(null, this__7825.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7826 = this;
  if(cljs.core._count.call(null, this__7826.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7826.chunk), this__7826.more, this__7826.meta)
  }else {
    if(this__7826.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7826.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7827 = this;
  if(this__7827.more == null) {
    return null
  }else {
    return this__7827.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7828 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7829 = this;
  return new cljs.core.ChunkedCons(this__7829.chunk, this__7829.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7830 = this;
  return this__7830.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7831 = this;
  return this__7831.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7832 = this;
  if(this__7832.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7832.more
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
    var G__7836__7837 = s;
    if(G__7836__7837) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7838 = null;
        if(cljs.core.truth_(or__3824__auto____7838)) {
          return or__3824__auto____7838
        }else {
          return G__7836__7837.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7836__7837.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7836__7837)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7836__7837)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7841 = [];
  var s__7842 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7842)) {
      ary__7841.push(cljs.core.first.call(null, s__7842));
      var G__7843 = cljs.core.next.call(null, s__7842);
      s__7842 = G__7843;
      continue
    }else {
      return ary__7841
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7847 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7848 = 0;
  var xs__7849 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7849) {
      ret__7847[i__7848] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7849));
      var G__7850 = i__7848 + 1;
      var G__7851 = cljs.core.next.call(null, xs__7849);
      i__7848 = G__7850;
      xs__7849 = G__7851;
      continue
    }else {
    }
    break
  }
  return ret__7847
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
    var a__7859 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7860 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7861 = 0;
      var s__7862 = s__7860;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7863 = s__7862;
          if(and__3822__auto____7863) {
            return i__7861 < size
          }else {
            return and__3822__auto____7863
          }
        }())) {
          a__7859[i__7861] = cljs.core.first.call(null, s__7862);
          var G__7866 = i__7861 + 1;
          var G__7867 = cljs.core.next.call(null, s__7862);
          i__7861 = G__7866;
          s__7862 = G__7867;
          continue
        }else {
          return a__7859
        }
        break
      }
    }else {
      var n__2527__auto____7864 = size;
      var i__7865 = 0;
      while(true) {
        if(i__7865 < n__2527__auto____7864) {
          a__7859[i__7865] = init_val_or_seq;
          var G__7868 = i__7865 + 1;
          i__7865 = G__7868;
          continue
        }else {
        }
        break
      }
      return a__7859
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
    var a__7876 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7877 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7878 = 0;
      var s__7879 = s__7877;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7880 = s__7879;
          if(and__3822__auto____7880) {
            return i__7878 < size
          }else {
            return and__3822__auto____7880
          }
        }())) {
          a__7876[i__7878] = cljs.core.first.call(null, s__7879);
          var G__7883 = i__7878 + 1;
          var G__7884 = cljs.core.next.call(null, s__7879);
          i__7878 = G__7883;
          s__7879 = G__7884;
          continue
        }else {
          return a__7876
        }
        break
      }
    }else {
      var n__2527__auto____7881 = size;
      var i__7882 = 0;
      while(true) {
        if(i__7882 < n__2527__auto____7881) {
          a__7876[i__7882] = init_val_or_seq;
          var G__7885 = i__7882 + 1;
          i__7882 = G__7885;
          continue
        }else {
        }
        break
      }
      return a__7876
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
    var a__7893 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7894 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7895 = 0;
      var s__7896 = s__7894;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7897 = s__7896;
          if(and__3822__auto____7897) {
            return i__7895 < size
          }else {
            return and__3822__auto____7897
          }
        }())) {
          a__7893[i__7895] = cljs.core.first.call(null, s__7896);
          var G__7900 = i__7895 + 1;
          var G__7901 = cljs.core.next.call(null, s__7896);
          i__7895 = G__7900;
          s__7896 = G__7901;
          continue
        }else {
          return a__7893
        }
        break
      }
    }else {
      var n__2527__auto____7898 = size;
      var i__7899 = 0;
      while(true) {
        if(i__7899 < n__2527__auto____7898) {
          a__7893[i__7899] = init_val_or_seq;
          var G__7902 = i__7899 + 1;
          i__7899 = G__7902;
          continue
        }else {
        }
        break
      }
      return a__7893
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
    var s__7907 = s;
    var i__7908 = n;
    var sum__7909 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7910 = i__7908 > 0;
        if(and__3822__auto____7910) {
          return cljs.core.seq.call(null, s__7907)
        }else {
          return and__3822__auto____7910
        }
      }())) {
        var G__7911 = cljs.core.next.call(null, s__7907);
        var G__7912 = i__7908 - 1;
        var G__7913 = sum__7909 + 1;
        s__7907 = G__7911;
        i__7908 = G__7912;
        sum__7909 = G__7913;
        continue
      }else {
        return sum__7909
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
      var s__7918 = cljs.core.seq.call(null, x);
      if(s__7918) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7918)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7918), concat.call(null, cljs.core.chunk_rest.call(null, s__7918), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7918), concat.call(null, cljs.core.rest.call(null, s__7918), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7922__delegate = function(x, y, zs) {
      var cat__7921 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7920 = cljs.core.seq.call(null, xys);
          if(xys__7920) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7920)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7920), cat.call(null, cljs.core.chunk_rest.call(null, xys__7920), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7920), cat.call(null, cljs.core.rest.call(null, xys__7920), zs))
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
      return cat__7921.call(null, concat.call(null, x, y), zs)
    };
    var G__7922 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7922__delegate.call(this, x, y, zs)
    };
    G__7922.cljs$lang$maxFixedArity = 2;
    G__7922.cljs$lang$applyTo = function(arglist__7923) {
      var x = cljs.core.first(arglist__7923);
      var y = cljs.core.first(cljs.core.next(arglist__7923));
      var zs = cljs.core.rest(cljs.core.next(arglist__7923));
      return G__7922__delegate(x, y, zs)
    };
    G__7922.cljs$lang$arity$variadic = G__7922__delegate;
    return G__7922
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
    var G__7924__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7924 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7924__delegate.call(this, a, b, c, d, more)
    };
    G__7924.cljs$lang$maxFixedArity = 4;
    G__7924.cljs$lang$applyTo = function(arglist__7925) {
      var a = cljs.core.first(arglist__7925);
      var b = cljs.core.first(cljs.core.next(arglist__7925));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7925)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7925))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7925))));
      return G__7924__delegate(a, b, c, d, more)
    };
    G__7924.cljs$lang$arity$variadic = G__7924__delegate;
    return G__7924
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
  var args__7967 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7968 = cljs.core._first.call(null, args__7967);
    var args__7969 = cljs.core._rest.call(null, args__7967);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7968)
      }else {
        return f.call(null, a__7968)
      }
    }else {
      var b__7970 = cljs.core._first.call(null, args__7969);
      var args__7971 = cljs.core._rest.call(null, args__7969);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7968, b__7970)
        }else {
          return f.call(null, a__7968, b__7970)
        }
      }else {
        var c__7972 = cljs.core._first.call(null, args__7971);
        var args__7973 = cljs.core._rest.call(null, args__7971);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7968, b__7970, c__7972)
          }else {
            return f.call(null, a__7968, b__7970, c__7972)
          }
        }else {
          var d__7974 = cljs.core._first.call(null, args__7973);
          var args__7975 = cljs.core._rest.call(null, args__7973);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7968, b__7970, c__7972, d__7974)
            }else {
              return f.call(null, a__7968, b__7970, c__7972, d__7974)
            }
          }else {
            var e__7976 = cljs.core._first.call(null, args__7975);
            var args__7977 = cljs.core._rest.call(null, args__7975);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7968, b__7970, c__7972, d__7974, e__7976)
              }else {
                return f.call(null, a__7968, b__7970, c__7972, d__7974, e__7976)
              }
            }else {
              var f__7978 = cljs.core._first.call(null, args__7977);
              var args__7979 = cljs.core._rest.call(null, args__7977);
              if(argc === 6) {
                if(f__7978.cljs$lang$arity$6) {
                  return f__7978.cljs$lang$arity$6(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978)
                }else {
                  return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978)
                }
              }else {
                var g__7980 = cljs.core._first.call(null, args__7979);
                var args__7981 = cljs.core._rest.call(null, args__7979);
                if(argc === 7) {
                  if(f__7978.cljs$lang$arity$7) {
                    return f__7978.cljs$lang$arity$7(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980)
                  }else {
                    return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980)
                  }
                }else {
                  var h__7982 = cljs.core._first.call(null, args__7981);
                  var args__7983 = cljs.core._rest.call(null, args__7981);
                  if(argc === 8) {
                    if(f__7978.cljs$lang$arity$8) {
                      return f__7978.cljs$lang$arity$8(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982)
                    }else {
                      return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982)
                    }
                  }else {
                    var i__7984 = cljs.core._first.call(null, args__7983);
                    var args__7985 = cljs.core._rest.call(null, args__7983);
                    if(argc === 9) {
                      if(f__7978.cljs$lang$arity$9) {
                        return f__7978.cljs$lang$arity$9(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984)
                      }else {
                        return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984)
                      }
                    }else {
                      var j__7986 = cljs.core._first.call(null, args__7985);
                      var args__7987 = cljs.core._rest.call(null, args__7985);
                      if(argc === 10) {
                        if(f__7978.cljs$lang$arity$10) {
                          return f__7978.cljs$lang$arity$10(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986)
                        }else {
                          return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986)
                        }
                      }else {
                        var k__7988 = cljs.core._first.call(null, args__7987);
                        var args__7989 = cljs.core._rest.call(null, args__7987);
                        if(argc === 11) {
                          if(f__7978.cljs$lang$arity$11) {
                            return f__7978.cljs$lang$arity$11(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988)
                          }else {
                            return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988)
                          }
                        }else {
                          var l__7990 = cljs.core._first.call(null, args__7989);
                          var args__7991 = cljs.core._rest.call(null, args__7989);
                          if(argc === 12) {
                            if(f__7978.cljs$lang$arity$12) {
                              return f__7978.cljs$lang$arity$12(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990)
                            }else {
                              return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990)
                            }
                          }else {
                            var m__7992 = cljs.core._first.call(null, args__7991);
                            var args__7993 = cljs.core._rest.call(null, args__7991);
                            if(argc === 13) {
                              if(f__7978.cljs$lang$arity$13) {
                                return f__7978.cljs$lang$arity$13(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992)
                              }else {
                                return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992)
                              }
                            }else {
                              var n__7994 = cljs.core._first.call(null, args__7993);
                              var args__7995 = cljs.core._rest.call(null, args__7993);
                              if(argc === 14) {
                                if(f__7978.cljs$lang$arity$14) {
                                  return f__7978.cljs$lang$arity$14(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994)
                                }else {
                                  return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994)
                                }
                              }else {
                                var o__7996 = cljs.core._first.call(null, args__7995);
                                var args__7997 = cljs.core._rest.call(null, args__7995);
                                if(argc === 15) {
                                  if(f__7978.cljs$lang$arity$15) {
                                    return f__7978.cljs$lang$arity$15(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994, o__7996)
                                  }else {
                                    return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994, o__7996)
                                  }
                                }else {
                                  var p__7998 = cljs.core._first.call(null, args__7997);
                                  var args__7999 = cljs.core._rest.call(null, args__7997);
                                  if(argc === 16) {
                                    if(f__7978.cljs$lang$arity$16) {
                                      return f__7978.cljs$lang$arity$16(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994, o__7996, p__7998)
                                    }else {
                                      return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994, o__7996, p__7998)
                                    }
                                  }else {
                                    var q__8000 = cljs.core._first.call(null, args__7999);
                                    var args__8001 = cljs.core._rest.call(null, args__7999);
                                    if(argc === 17) {
                                      if(f__7978.cljs$lang$arity$17) {
                                        return f__7978.cljs$lang$arity$17(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994, o__7996, p__7998, q__8000)
                                      }else {
                                        return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994, o__7996, p__7998, q__8000)
                                      }
                                    }else {
                                      var r__8002 = cljs.core._first.call(null, args__8001);
                                      var args__8003 = cljs.core._rest.call(null, args__8001);
                                      if(argc === 18) {
                                        if(f__7978.cljs$lang$arity$18) {
                                          return f__7978.cljs$lang$arity$18(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994, o__7996, p__7998, q__8000, r__8002)
                                        }else {
                                          return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994, o__7996, p__7998, q__8000, r__8002)
                                        }
                                      }else {
                                        var s__8004 = cljs.core._first.call(null, args__8003);
                                        var args__8005 = cljs.core._rest.call(null, args__8003);
                                        if(argc === 19) {
                                          if(f__7978.cljs$lang$arity$19) {
                                            return f__7978.cljs$lang$arity$19(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994, o__7996, p__7998, q__8000, r__8002, s__8004)
                                          }else {
                                            return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994, o__7996, p__7998, q__8000, r__8002, s__8004)
                                          }
                                        }else {
                                          var t__8006 = cljs.core._first.call(null, args__8005);
                                          var args__8007 = cljs.core._rest.call(null, args__8005);
                                          if(argc === 20) {
                                            if(f__7978.cljs$lang$arity$20) {
                                              return f__7978.cljs$lang$arity$20(a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994, o__7996, p__7998, q__8000, r__8002, s__8004, t__8006)
                                            }else {
                                              return f__7978.call(null, a__7968, b__7970, c__7972, d__7974, e__7976, f__7978, g__7980, h__7982, i__7984, j__7986, k__7988, l__7990, m__7992, n__7994, o__7996, p__7998, q__8000, r__8002, s__8004, t__8006)
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
    var fixed_arity__8022 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8023 = cljs.core.bounded_count.call(null, args, fixed_arity__8022 + 1);
      if(bc__8023 <= fixed_arity__8022) {
        return cljs.core.apply_to.call(null, f, bc__8023, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__8024 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__8025 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8026 = cljs.core.bounded_count.call(null, arglist__8024, fixed_arity__8025 + 1);
      if(bc__8026 <= fixed_arity__8025) {
        return cljs.core.apply_to.call(null, f, bc__8026, arglist__8024)
      }else {
        return f.cljs$lang$applyTo(arglist__8024)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8024))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__8027 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__8028 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8029 = cljs.core.bounded_count.call(null, arglist__8027, fixed_arity__8028 + 1);
      if(bc__8029 <= fixed_arity__8028) {
        return cljs.core.apply_to.call(null, f, bc__8029, arglist__8027)
      }else {
        return f.cljs$lang$applyTo(arglist__8027)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8027))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__8030 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__8031 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8032 = cljs.core.bounded_count.call(null, arglist__8030, fixed_arity__8031 + 1);
      if(bc__8032 <= fixed_arity__8031) {
        return cljs.core.apply_to.call(null, f, bc__8032, arglist__8030)
      }else {
        return f.cljs$lang$applyTo(arglist__8030)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8030))
    }
  };
  var apply__6 = function() {
    var G__8036__delegate = function(f, a, b, c, d, args) {
      var arglist__8033 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__8034 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__8035 = cljs.core.bounded_count.call(null, arglist__8033, fixed_arity__8034 + 1);
        if(bc__8035 <= fixed_arity__8034) {
          return cljs.core.apply_to.call(null, f, bc__8035, arglist__8033)
        }else {
          return f.cljs$lang$applyTo(arglist__8033)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__8033))
      }
    };
    var G__8036 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__8036__delegate.call(this, f, a, b, c, d, args)
    };
    G__8036.cljs$lang$maxFixedArity = 5;
    G__8036.cljs$lang$applyTo = function(arglist__8037) {
      var f = cljs.core.first(arglist__8037);
      var a = cljs.core.first(cljs.core.next(arglist__8037));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8037)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8037))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8037)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8037)))));
      return G__8036__delegate(f, a, b, c, d, args)
    };
    G__8036.cljs$lang$arity$variadic = G__8036__delegate;
    return G__8036
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
  vary_meta.cljs$lang$applyTo = function(arglist__8038) {
    var obj = cljs.core.first(arglist__8038);
    var f = cljs.core.first(cljs.core.next(arglist__8038));
    var args = cljs.core.rest(cljs.core.next(arglist__8038));
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
    var G__8039__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__8039 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8039__delegate.call(this, x, y, more)
    };
    G__8039.cljs$lang$maxFixedArity = 2;
    G__8039.cljs$lang$applyTo = function(arglist__8040) {
      var x = cljs.core.first(arglist__8040);
      var y = cljs.core.first(cljs.core.next(arglist__8040));
      var more = cljs.core.rest(cljs.core.next(arglist__8040));
      return G__8039__delegate(x, y, more)
    };
    G__8039.cljs$lang$arity$variadic = G__8039__delegate;
    return G__8039
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
        var G__8041 = pred;
        var G__8042 = cljs.core.next.call(null, coll);
        pred = G__8041;
        coll = G__8042;
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
      var or__3824__auto____8044 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____8044)) {
        return or__3824__auto____8044
      }else {
        var G__8045 = pred;
        var G__8046 = cljs.core.next.call(null, coll);
        pred = G__8045;
        coll = G__8046;
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
    var G__8047 = null;
    var G__8047__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__8047__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__8047__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__8047__3 = function() {
      var G__8048__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__8048 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__8048__delegate.call(this, x, y, zs)
      };
      G__8048.cljs$lang$maxFixedArity = 2;
      G__8048.cljs$lang$applyTo = function(arglist__8049) {
        var x = cljs.core.first(arglist__8049);
        var y = cljs.core.first(cljs.core.next(arglist__8049));
        var zs = cljs.core.rest(cljs.core.next(arglist__8049));
        return G__8048__delegate(x, y, zs)
      };
      G__8048.cljs$lang$arity$variadic = G__8048__delegate;
      return G__8048
    }();
    G__8047 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__8047__0.call(this);
        case 1:
          return G__8047__1.call(this, x);
        case 2:
          return G__8047__2.call(this, x, y);
        default:
          return G__8047__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__8047.cljs$lang$maxFixedArity = 2;
    G__8047.cljs$lang$applyTo = G__8047__3.cljs$lang$applyTo;
    return G__8047
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__8050__delegate = function(args) {
      return x
    };
    var G__8050 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8050__delegate.call(this, args)
    };
    G__8050.cljs$lang$maxFixedArity = 0;
    G__8050.cljs$lang$applyTo = function(arglist__8051) {
      var args = cljs.core.seq(arglist__8051);
      return G__8050__delegate(args)
    };
    G__8050.cljs$lang$arity$variadic = G__8050__delegate;
    return G__8050
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
      var G__8058 = null;
      var G__8058__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__8058__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__8058__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__8058__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__8058__4 = function() {
        var G__8059__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__8059 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8059__delegate.call(this, x, y, z, args)
        };
        G__8059.cljs$lang$maxFixedArity = 3;
        G__8059.cljs$lang$applyTo = function(arglist__8060) {
          var x = cljs.core.first(arglist__8060);
          var y = cljs.core.first(cljs.core.next(arglist__8060));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8060)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8060)));
          return G__8059__delegate(x, y, z, args)
        };
        G__8059.cljs$lang$arity$variadic = G__8059__delegate;
        return G__8059
      }();
      G__8058 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8058__0.call(this);
          case 1:
            return G__8058__1.call(this, x);
          case 2:
            return G__8058__2.call(this, x, y);
          case 3:
            return G__8058__3.call(this, x, y, z);
          default:
            return G__8058__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8058.cljs$lang$maxFixedArity = 3;
      G__8058.cljs$lang$applyTo = G__8058__4.cljs$lang$applyTo;
      return G__8058
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__8061 = null;
      var G__8061__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__8061__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__8061__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__8061__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__8061__4 = function() {
        var G__8062__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__8062 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8062__delegate.call(this, x, y, z, args)
        };
        G__8062.cljs$lang$maxFixedArity = 3;
        G__8062.cljs$lang$applyTo = function(arglist__8063) {
          var x = cljs.core.first(arglist__8063);
          var y = cljs.core.first(cljs.core.next(arglist__8063));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8063)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8063)));
          return G__8062__delegate(x, y, z, args)
        };
        G__8062.cljs$lang$arity$variadic = G__8062__delegate;
        return G__8062
      }();
      G__8061 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8061__0.call(this);
          case 1:
            return G__8061__1.call(this, x);
          case 2:
            return G__8061__2.call(this, x, y);
          case 3:
            return G__8061__3.call(this, x, y, z);
          default:
            return G__8061__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8061.cljs$lang$maxFixedArity = 3;
      G__8061.cljs$lang$applyTo = G__8061__4.cljs$lang$applyTo;
      return G__8061
    }()
  };
  var comp__4 = function() {
    var G__8064__delegate = function(f1, f2, f3, fs) {
      var fs__8055 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__8065__delegate = function(args) {
          var ret__8056 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__8055), args);
          var fs__8057 = cljs.core.next.call(null, fs__8055);
          while(true) {
            if(fs__8057) {
              var G__8066 = cljs.core.first.call(null, fs__8057).call(null, ret__8056);
              var G__8067 = cljs.core.next.call(null, fs__8057);
              ret__8056 = G__8066;
              fs__8057 = G__8067;
              continue
            }else {
              return ret__8056
            }
            break
          }
        };
        var G__8065 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8065__delegate.call(this, args)
        };
        G__8065.cljs$lang$maxFixedArity = 0;
        G__8065.cljs$lang$applyTo = function(arglist__8068) {
          var args = cljs.core.seq(arglist__8068);
          return G__8065__delegate(args)
        };
        G__8065.cljs$lang$arity$variadic = G__8065__delegate;
        return G__8065
      }()
    };
    var G__8064 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8064__delegate.call(this, f1, f2, f3, fs)
    };
    G__8064.cljs$lang$maxFixedArity = 3;
    G__8064.cljs$lang$applyTo = function(arglist__8069) {
      var f1 = cljs.core.first(arglist__8069);
      var f2 = cljs.core.first(cljs.core.next(arglist__8069));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8069)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8069)));
      return G__8064__delegate(f1, f2, f3, fs)
    };
    G__8064.cljs$lang$arity$variadic = G__8064__delegate;
    return G__8064
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
      var G__8070__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__8070 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8070__delegate.call(this, args)
      };
      G__8070.cljs$lang$maxFixedArity = 0;
      G__8070.cljs$lang$applyTo = function(arglist__8071) {
        var args = cljs.core.seq(arglist__8071);
        return G__8070__delegate(args)
      };
      G__8070.cljs$lang$arity$variadic = G__8070__delegate;
      return G__8070
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__8072__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__8072 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8072__delegate.call(this, args)
      };
      G__8072.cljs$lang$maxFixedArity = 0;
      G__8072.cljs$lang$applyTo = function(arglist__8073) {
        var args = cljs.core.seq(arglist__8073);
        return G__8072__delegate(args)
      };
      G__8072.cljs$lang$arity$variadic = G__8072__delegate;
      return G__8072
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__8074__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__8074 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8074__delegate.call(this, args)
      };
      G__8074.cljs$lang$maxFixedArity = 0;
      G__8074.cljs$lang$applyTo = function(arglist__8075) {
        var args = cljs.core.seq(arglist__8075);
        return G__8074__delegate(args)
      };
      G__8074.cljs$lang$arity$variadic = G__8074__delegate;
      return G__8074
    }()
  };
  var partial__5 = function() {
    var G__8076__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__8077__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__8077 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8077__delegate.call(this, args)
        };
        G__8077.cljs$lang$maxFixedArity = 0;
        G__8077.cljs$lang$applyTo = function(arglist__8078) {
          var args = cljs.core.seq(arglist__8078);
          return G__8077__delegate(args)
        };
        G__8077.cljs$lang$arity$variadic = G__8077__delegate;
        return G__8077
      }()
    };
    var G__8076 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8076__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__8076.cljs$lang$maxFixedArity = 4;
    G__8076.cljs$lang$applyTo = function(arglist__8079) {
      var f = cljs.core.first(arglist__8079);
      var arg1 = cljs.core.first(cljs.core.next(arglist__8079));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8079)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8079))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8079))));
      return G__8076__delegate(f, arg1, arg2, arg3, more)
    };
    G__8076.cljs$lang$arity$variadic = G__8076__delegate;
    return G__8076
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
      var G__8080 = null;
      var G__8080__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__8080__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__8080__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__8080__4 = function() {
        var G__8081__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__8081 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8081__delegate.call(this, a, b, c, ds)
        };
        G__8081.cljs$lang$maxFixedArity = 3;
        G__8081.cljs$lang$applyTo = function(arglist__8082) {
          var a = cljs.core.first(arglist__8082);
          var b = cljs.core.first(cljs.core.next(arglist__8082));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8082)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8082)));
          return G__8081__delegate(a, b, c, ds)
        };
        G__8081.cljs$lang$arity$variadic = G__8081__delegate;
        return G__8081
      }();
      G__8080 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__8080__1.call(this, a);
          case 2:
            return G__8080__2.call(this, a, b);
          case 3:
            return G__8080__3.call(this, a, b, c);
          default:
            return G__8080__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8080.cljs$lang$maxFixedArity = 3;
      G__8080.cljs$lang$applyTo = G__8080__4.cljs$lang$applyTo;
      return G__8080
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__8083 = null;
      var G__8083__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8083__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__8083__4 = function() {
        var G__8084__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__8084 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8084__delegate.call(this, a, b, c, ds)
        };
        G__8084.cljs$lang$maxFixedArity = 3;
        G__8084.cljs$lang$applyTo = function(arglist__8085) {
          var a = cljs.core.first(arglist__8085);
          var b = cljs.core.first(cljs.core.next(arglist__8085));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8085)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8085)));
          return G__8084__delegate(a, b, c, ds)
        };
        G__8084.cljs$lang$arity$variadic = G__8084__delegate;
        return G__8084
      }();
      G__8083 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8083__2.call(this, a, b);
          case 3:
            return G__8083__3.call(this, a, b, c);
          default:
            return G__8083__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8083.cljs$lang$maxFixedArity = 3;
      G__8083.cljs$lang$applyTo = G__8083__4.cljs$lang$applyTo;
      return G__8083
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__8086 = null;
      var G__8086__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8086__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__8086__4 = function() {
        var G__8087__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__8087 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8087__delegate.call(this, a, b, c, ds)
        };
        G__8087.cljs$lang$maxFixedArity = 3;
        G__8087.cljs$lang$applyTo = function(arglist__8088) {
          var a = cljs.core.first(arglist__8088);
          var b = cljs.core.first(cljs.core.next(arglist__8088));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8088)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8088)));
          return G__8087__delegate(a, b, c, ds)
        };
        G__8087.cljs$lang$arity$variadic = G__8087__delegate;
        return G__8087
      }();
      G__8086 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8086__2.call(this, a, b);
          case 3:
            return G__8086__3.call(this, a, b, c);
          default:
            return G__8086__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8086.cljs$lang$maxFixedArity = 3;
      G__8086.cljs$lang$applyTo = G__8086__4.cljs$lang$applyTo;
      return G__8086
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
  var mapi__8104 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8112 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8112) {
        var s__8113 = temp__3974__auto____8112;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8113)) {
          var c__8114 = cljs.core.chunk_first.call(null, s__8113);
          var size__8115 = cljs.core.count.call(null, c__8114);
          var b__8116 = cljs.core.chunk_buffer.call(null, size__8115);
          var n__2527__auto____8117 = size__8115;
          var i__8118 = 0;
          while(true) {
            if(i__8118 < n__2527__auto____8117) {
              cljs.core.chunk_append.call(null, b__8116, f.call(null, idx + i__8118, cljs.core._nth.call(null, c__8114, i__8118)));
              var G__8119 = i__8118 + 1;
              i__8118 = G__8119;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8116), mapi.call(null, idx + size__8115, cljs.core.chunk_rest.call(null, s__8113)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__8113)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__8113)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__8104.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8129 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8129) {
      var s__8130 = temp__3974__auto____8129;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8130)) {
        var c__8131 = cljs.core.chunk_first.call(null, s__8130);
        var size__8132 = cljs.core.count.call(null, c__8131);
        var b__8133 = cljs.core.chunk_buffer.call(null, size__8132);
        var n__2527__auto____8134 = size__8132;
        var i__8135 = 0;
        while(true) {
          if(i__8135 < n__2527__auto____8134) {
            var x__8136 = f.call(null, cljs.core._nth.call(null, c__8131, i__8135));
            if(x__8136 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__8133, x__8136)
            }
            var G__8138 = i__8135 + 1;
            i__8135 = G__8138;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8133), keep.call(null, f, cljs.core.chunk_rest.call(null, s__8130)))
      }else {
        var x__8137 = f.call(null, cljs.core.first.call(null, s__8130));
        if(x__8137 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__8130))
        }else {
          return cljs.core.cons.call(null, x__8137, keep.call(null, f, cljs.core.rest.call(null, s__8130)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__8164 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8174 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8174) {
        var s__8175 = temp__3974__auto____8174;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8175)) {
          var c__8176 = cljs.core.chunk_first.call(null, s__8175);
          var size__8177 = cljs.core.count.call(null, c__8176);
          var b__8178 = cljs.core.chunk_buffer.call(null, size__8177);
          var n__2527__auto____8179 = size__8177;
          var i__8180 = 0;
          while(true) {
            if(i__8180 < n__2527__auto____8179) {
              var x__8181 = f.call(null, idx + i__8180, cljs.core._nth.call(null, c__8176, i__8180));
              if(x__8181 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__8178, x__8181)
              }
              var G__8183 = i__8180 + 1;
              i__8180 = G__8183;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8178), keepi.call(null, idx + size__8177, cljs.core.chunk_rest.call(null, s__8175)))
        }else {
          var x__8182 = f.call(null, idx, cljs.core.first.call(null, s__8175));
          if(x__8182 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8175))
          }else {
            return cljs.core.cons.call(null, x__8182, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8175)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__8164.call(null, 0, coll)
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
          var and__3822__auto____8269 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8269)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____8269
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8270 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8270)) {
            var and__3822__auto____8271 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8271)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____8271
            }
          }else {
            return and__3822__auto____8270
          }
        }())
      };
      var ep1__4 = function() {
        var G__8340__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8272 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8272)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____8272
            }
          }())
        };
        var G__8340 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8340__delegate.call(this, x, y, z, args)
        };
        G__8340.cljs$lang$maxFixedArity = 3;
        G__8340.cljs$lang$applyTo = function(arglist__8341) {
          var x = cljs.core.first(arglist__8341);
          var y = cljs.core.first(cljs.core.next(arglist__8341));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8341)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8341)));
          return G__8340__delegate(x, y, z, args)
        };
        G__8340.cljs$lang$arity$variadic = G__8340__delegate;
        return G__8340
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
          var and__3822__auto____8284 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8284)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____8284
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8285 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8285)) {
            var and__3822__auto____8286 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8286)) {
              var and__3822__auto____8287 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8287)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____8287
              }
            }else {
              return and__3822__auto____8286
            }
          }else {
            return and__3822__auto____8285
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8288 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8288)) {
            var and__3822__auto____8289 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8289)) {
              var and__3822__auto____8290 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____8290)) {
                var and__3822__auto____8291 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____8291)) {
                  var and__3822__auto____8292 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8292)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____8292
                  }
                }else {
                  return and__3822__auto____8291
                }
              }else {
                return and__3822__auto____8290
              }
            }else {
              return and__3822__auto____8289
            }
          }else {
            return and__3822__auto____8288
          }
        }())
      };
      var ep2__4 = function() {
        var G__8342__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8293 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8293)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8139_SHARP_) {
                var and__3822__auto____8294 = p1.call(null, p1__8139_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8294)) {
                  return p2.call(null, p1__8139_SHARP_)
                }else {
                  return and__3822__auto____8294
                }
              }, args)
            }else {
              return and__3822__auto____8293
            }
          }())
        };
        var G__8342 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8342__delegate.call(this, x, y, z, args)
        };
        G__8342.cljs$lang$maxFixedArity = 3;
        G__8342.cljs$lang$applyTo = function(arglist__8343) {
          var x = cljs.core.first(arglist__8343);
          var y = cljs.core.first(cljs.core.next(arglist__8343));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8343)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8343)));
          return G__8342__delegate(x, y, z, args)
        };
        G__8342.cljs$lang$arity$variadic = G__8342__delegate;
        return G__8342
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
          var and__3822__auto____8313 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8313)) {
            var and__3822__auto____8314 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8314)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____8314
            }
          }else {
            return and__3822__auto____8313
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8315 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8315)) {
            var and__3822__auto____8316 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8316)) {
              var and__3822__auto____8317 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8317)) {
                var and__3822__auto____8318 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8318)) {
                  var and__3822__auto____8319 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8319)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____8319
                  }
                }else {
                  return and__3822__auto____8318
                }
              }else {
                return and__3822__auto____8317
              }
            }else {
              return and__3822__auto____8316
            }
          }else {
            return and__3822__auto____8315
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8320 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8320)) {
            var and__3822__auto____8321 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8321)) {
              var and__3822__auto____8322 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8322)) {
                var and__3822__auto____8323 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8323)) {
                  var and__3822__auto____8324 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8324)) {
                    var and__3822__auto____8325 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____8325)) {
                      var and__3822__auto____8326 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____8326)) {
                        var and__3822__auto____8327 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____8327)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____8327
                        }
                      }else {
                        return and__3822__auto____8326
                      }
                    }else {
                      return and__3822__auto____8325
                    }
                  }else {
                    return and__3822__auto____8324
                  }
                }else {
                  return and__3822__auto____8323
                }
              }else {
                return and__3822__auto____8322
              }
            }else {
              return and__3822__auto____8321
            }
          }else {
            return and__3822__auto____8320
          }
        }())
      };
      var ep3__4 = function() {
        var G__8344__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8328 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8328)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8140_SHARP_) {
                var and__3822__auto____8329 = p1.call(null, p1__8140_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8329)) {
                  var and__3822__auto____8330 = p2.call(null, p1__8140_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____8330)) {
                    return p3.call(null, p1__8140_SHARP_)
                  }else {
                    return and__3822__auto____8330
                  }
                }else {
                  return and__3822__auto____8329
                }
              }, args)
            }else {
              return and__3822__auto____8328
            }
          }())
        };
        var G__8344 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8344__delegate.call(this, x, y, z, args)
        };
        G__8344.cljs$lang$maxFixedArity = 3;
        G__8344.cljs$lang$applyTo = function(arglist__8345) {
          var x = cljs.core.first(arglist__8345);
          var y = cljs.core.first(cljs.core.next(arglist__8345));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8345)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8345)));
          return G__8344__delegate(x, y, z, args)
        };
        G__8344.cljs$lang$arity$variadic = G__8344__delegate;
        return G__8344
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
    var G__8346__delegate = function(p1, p2, p3, ps) {
      var ps__8331 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__8141_SHARP_) {
            return p1__8141_SHARP_.call(null, x)
          }, ps__8331)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__8142_SHARP_) {
            var and__3822__auto____8336 = p1__8142_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8336)) {
              return p1__8142_SHARP_.call(null, y)
            }else {
              return and__3822__auto____8336
            }
          }, ps__8331)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__8143_SHARP_) {
            var and__3822__auto____8337 = p1__8143_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8337)) {
              var and__3822__auto____8338 = p1__8143_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____8338)) {
                return p1__8143_SHARP_.call(null, z)
              }else {
                return and__3822__auto____8338
              }
            }else {
              return and__3822__auto____8337
            }
          }, ps__8331)
        };
        var epn__4 = function() {
          var G__8347__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____8339 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____8339)) {
                return cljs.core.every_QMARK_.call(null, function(p1__8144_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__8144_SHARP_, args)
                }, ps__8331)
              }else {
                return and__3822__auto____8339
              }
            }())
          };
          var G__8347 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8347__delegate.call(this, x, y, z, args)
          };
          G__8347.cljs$lang$maxFixedArity = 3;
          G__8347.cljs$lang$applyTo = function(arglist__8348) {
            var x = cljs.core.first(arglist__8348);
            var y = cljs.core.first(cljs.core.next(arglist__8348));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8348)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8348)));
            return G__8347__delegate(x, y, z, args)
          };
          G__8347.cljs$lang$arity$variadic = G__8347__delegate;
          return G__8347
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
    var G__8346 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8346__delegate.call(this, p1, p2, p3, ps)
    };
    G__8346.cljs$lang$maxFixedArity = 3;
    G__8346.cljs$lang$applyTo = function(arglist__8349) {
      var p1 = cljs.core.first(arglist__8349);
      var p2 = cljs.core.first(cljs.core.next(arglist__8349));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8349)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8349)));
      return G__8346__delegate(p1, p2, p3, ps)
    };
    G__8346.cljs$lang$arity$variadic = G__8346__delegate;
    return G__8346
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
        var or__3824__auto____8430 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8430)) {
          return or__3824__auto____8430
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____8431 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8431)) {
          return or__3824__auto____8431
        }else {
          var or__3824__auto____8432 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8432)) {
            return or__3824__auto____8432
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8501__delegate = function(x, y, z, args) {
          var or__3824__auto____8433 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8433)) {
            return or__3824__auto____8433
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8501 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8501__delegate.call(this, x, y, z, args)
        };
        G__8501.cljs$lang$maxFixedArity = 3;
        G__8501.cljs$lang$applyTo = function(arglist__8502) {
          var x = cljs.core.first(arglist__8502);
          var y = cljs.core.first(cljs.core.next(arglist__8502));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8502)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8502)));
          return G__8501__delegate(x, y, z, args)
        };
        G__8501.cljs$lang$arity$variadic = G__8501__delegate;
        return G__8501
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
        var or__3824__auto____8445 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8445)) {
          return or__3824__auto____8445
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____8446 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8446)) {
          return or__3824__auto____8446
        }else {
          var or__3824__auto____8447 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8447)) {
            return or__3824__auto____8447
          }else {
            var or__3824__auto____8448 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8448)) {
              return or__3824__auto____8448
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____8449 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8449)) {
          return or__3824__auto____8449
        }else {
          var or__3824__auto____8450 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8450)) {
            return or__3824__auto____8450
          }else {
            var or__3824__auto____8451 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____8451)) {
              return or__3824__auto____8451
            }else {
              var or__3824__auto____8452 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____8452)) {
                return or__3824__auto____8452
              }else {
                var or__3824__auto____8453 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8453)) {
                  return or__3824__auto____8453
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8503__delegate = function(x, y, z, args) {
          var or__3824__auto____8454 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8454)) {
            return or__3824__auto____8454
          }else {
            return cljs.core.some.call(null, function(p1__8184_SHARP_) {
              var or__3824__auto____8455 = p1.call(null, p1__8184_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8455)) {
                return or__3824__auto____8455
              }else {
                return p2.call(null, p1__8184_SHARP_)
              }
            }, args)
          }
        };
        var G__8503 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8503__delegate.call(this, x, y, z, args)
        };
        G__8503.cljs$lang$maxFixedArity = 3;
        G__8503.cljs$lang$applyTo = function(arglist__8504) {
          var x = cljs.core.first(arglist__8504);
          var y = cljs.core.first(cljs.core.next(arglist__8504));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8504)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8504)));
          return G__8503__delegate(x, y, z, args)
        };
        G__8503.cljs$lang$arity$variadic = G__8503__delegate;
        return G__8503
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
        var or__3824__auto____8474 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8474)) {
          return or__3824__auto____8474
        }else {
          var or__3824__auto____8475 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8475)) {
            return or__3824__auto____8475
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8476 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8476)) {
          return or__3824__auto____8476
        }else {
          var or__3824__auto____8477 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8477)) {
            return or__3824__auto____8477
          }else {
            var or__3824__auto____8478 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8478)) {
              return or__3824__auto____8478
            }else {
              var or__3824__auto____8479 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8479)) {
                return or__3824__auto____8479
              }else {
                var or__3824__auto____8480 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8480)) {
                  return or__3824__auto____8480
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8481 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8481)) {
          return or__3824__auto____8481
        }else {
          var or__3824__auto____8482 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8482)) {
            return or__3824__auto____8482
          }else {
            var or__3824__auto____8483 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8483)) {
              return or__3824__auto____8483
            }else {
              var or__3824__auto____8484 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8484)) {
                return or__3824__auto____8484
              }else {
                var or__3824__auto____8485 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8485)) {
                  return or__3824__auto____8485
                }else {
                  var or__3824__auto____8486 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8486)) {
                    return or__3824__auto____8486
                  }else {
                    var or__3824__auto____8487 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8487)) {
                      return or__3824__auto____8487
                    }else {
                      var or__3824__auto____8488 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8488)) {
                        return or__3824__auto____8488
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
        var G__8505__delegate = function(x, y, z, args) {
          var or__3824__auto____8489 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8489)) {
            return or__3824__auto____8489
          }else {
            return cljs.core.some.call(null, function(p1__8185_SHARP_) {
              var or__3824__auto____8490 = p1.call(null, p1__8185_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8490)) {
                return or__3824__auto____8490
              }else {
                var or__3824__auto____8491 = p2.call(null, p1__8185_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8491)) {
                  return or__3824__auto____8491
                }else {
                  return p3.call(null, p1__8185_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8505 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8505__delegate.call(this, x, y, z, args)
        };
        G__8505.cljs$lang$maxFixedArity = 3;
        G__8505.cljs$lang$applyTo = function(arglist__8506) {
          var x = cljs.core.first(arglist__8506);
          var y = cljs.core.first(cljs.core.next(arglist__8506));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8506)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8506)));
          return G__8505__delegate(x, y, z, args)
        };
        G__8505.cljs$lang$arity$variadic = G__8505__delegate;
        return G__8505
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
    var G__8507__delegate = function(p1, p2, p3, ps) {
      var ps__8492 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__8186_SHARP_) {
            return p1__8186_SHARP_.call(null, x)
          }, ps__8492)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__8187_SHARP_) {
            var or__3824__auto____8497 = p1__8187_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8497)) {
              return or__3824__auto____8497
            }else {
              return p1__8187_SHARP_.call(null, y)
            }
          }, ps__8492)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__8188_SHARP_) {
            var or__3824__auto____8498 = p1__8188_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8498)) {
              return or__3824__auto____8498
            }else {
              var or__3824__auto____8499 = p1__8188_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8499)) {
                return or__3824__auto____8499
              }else {
                return p1__8188_SHARP_.call(null, z)
              }
            }
          }, ps__8492)
        };
        var spn__4 = function() {
          var G__8508__delegate = function(x, y, z, args) {
            var or__3824__auto____8500 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8500)) {
              return or__3824__auto____8500
            }else {
              return cljs.core.some.call(null, function(p1__8189_SHARP_) {
                return cljs.core.some.call(null, p1__8189_SHARP_, args)
              }, ps__8492)
            }
          };
          var G__8508 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8508__delegate.call(this, x, y, z, args)
          };
          G__8508.cljs$lang$maxFixedArity = 3;
          G__8508.cljs$lang$applyTo = function(arglist__8509) {
            var x = cljs.core.first(arglist__8509);
            var y = cljs.core.first(cljs.core.next(arglist__8509));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8509)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8509)));
            return G__8508__delegate(x, y, z, args)
          };
          G__8508.cljs$lang$arity$variadic = G__8508__delegate;
          return G__8508
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
    var G__8507 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8507__delegate.call(this, p1, p2, p3, ps)
    };
    G__8507.cljs$lang$maxFixedArity = 3;
    G__8507.cljs$lang$applyTo = function(arglist__8510) {
      var p1 = cljs.core.first(arglist__8510);
      var p2 = cljs.core.first(cljs.core.next(arglist__8510));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8510)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8510)));
      return G__8507__delegate(p1, p2, p3, ps)
    };
    G__8507.cljs$lang$arity$variadic = G__8507__delegate;
    return G__8507
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
      var temp__3974__auto____8529 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8529) {
        var s__8530 = temp__3974__auto____8529;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8530)) {
          var c__8531 = cljs.core.chunk_first.call(null, s__8530);
          var size__8532 = cljs.core.count.call(null, c__8531);
          var b__8533 = cljs.core.chunk_buffer.call(null, size__8532);
          var n__2527__auto____8534 = size__8532;
          var i__8535 = 0;
          while(true) {
            if(i__8535 < n__2527__auto____8534) {
              cljs.core.chunk_append.call(null, b__8533, f.call(null, cljs.core._nth.call(null, c__8531, i__8535)));
              var G__8547 = i__8535 + 1;
              i__8535 = G__8547;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8533), map.call(null, f, cljs.core.chunk_rest.call(null, s__8530)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8530)), map.call(null, f, cljs.core.rest.call(null, s__8530)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8536 = cljs.core.seq.call(null, c1);
      var s2__8537 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8538 = s1__8536;
        if(and__3822__auto____8538) {
          return s2__8537
        }else {
          return and__3822__auto____8538
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8536), cljs.core.first.call(null, s2__8537)), map.call(null, f, cljs.core.rest.call(null, s1__8536), cljs.core.rest.call(null, s2__8537)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8539 = cljs.core.seq.call(null, c1);
      var s2__8540 = cljs.core.seq.call(null, c2);
      var s3__8541 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8542 = s1__8539;
        if(and__3822__auto____8542) {
          var and__3822__auto____8543 = s2__8540;
          if(and__3822__auto____8543) {
            return s3__8541
          }else {
            return and__3822__auto____8543
          }
        }else {
          return and__3822__auto____8542
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8539), cljs.core.first.call(null, s2__8540), cljs.core.first.call(null, s3__8541)), map.call(null, f, cljs.core.rest.call(null, s1__8539), cljs.core.rest.call(null, s2__8540), cljs.core.rest.call(null, s3__8541)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8548__delegate = function(f, c1, c2, c3, colls) {
      var step__8546 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8545 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8545)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8545), step.call(null, map.call(null, cljs.core.rest, ss__8545)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__8350_SHARP_) {
        return cljs.core.apply.call(null, f, p1__8350_SHARP_)
      }, step__8546.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8548 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8548__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8548.cljs$lang$maxFixedArity = 4;
    G__8548.cljs$lang$applyTo = function(arglist__8549) {
      var f = cljs.core.first(arglist__8549);
      var c1 = cljs.core.first(cljs.core.next(arglist__8549));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8549)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8549))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8549))));
      return G__8548__delegate(f, c1, c2, c3, colls)
    };
    G__8548.cljs$lang$arity$variadic = G__8548__delegate;
    return G__8548
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
      var temp__3974__auto____8552 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8552) {
        var s__8553 = temp__3974__auto____8552;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8553), take.call(null, n - 1, cljs.core.rest.call(null, s__8553)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8559 = function(n, coll) {
    while(true) {
      var s__8557 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8558 = n > 0;
        if(and__3822__auto____8558) {
          return s__8557
        }else {
          return and__3822__auto____8558
        }
      }())) {
        var G__8560 = n - 1;
        var G__8561 = cljs.core.rest.call(null, s__8557);
        n = G__8560;
        coll = G__8561;
        continue
      }else {
        return s__8557
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8559.call(null, n, coll)
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
  var s__8564 = cljs.core.seq.call(null, coll);
  var lead__8565 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8565) {
      var G__8566 = cljs.core.next.call(null, s__8564);
      var G__8567 = cljs.core.next.call(null, lead__8565);
      s__8564 = G__8566;
      lead__8565 = G__8567;
      continue
    }else {
      return s__8564
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8573 = function(pred, coll) {
    while(true) {
      var s__8571 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8572 = s__8571;
        if(and__3822__auto____8572) {
          return pred.call(null, cljs.core.first.call(null, s__8571))
        }else {
          return and__3822__auto____8572
        }
      }())) {
        var G__8574 = pred;
        var G__8575 = cljs.core.rest.call(null, s__8571);
        pred = G__8574;
        coll = G__8575;
        continue
      }else {
        return s__8571
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8573.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8578 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8578) {
      var s__8579 = temp__3974__auto____8578;
      return cljs.core.concat.call(null, s__8579, cycle.call(null, s__8579))
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
      var s1__8584 = cljs.core.seq.call(null, c1);
      var s2__8585 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8586 = s1__8584;
        if(and__3822__auto____8586) {
          return s2__8585
        }else {
          return and__3822__auto____8586
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8584), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8585), interleave.call(null, cljs.core.rest.call(null, s1__8584), cljs.core.rest.call(null, s2__8585))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8588__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8587 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8587)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8587), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8587)))
        }else {
          return null
        }
      }, null)
    };
    var G__8588 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8588__delegate.call(this, c1, c2, colls)
    };
    G__8588.cljs$lang$maxFixedArity = 2;
    G__8588.cljs$lang$applyTo = function(arglist__8589) {
      var c1 = cljs.core.first(arglist__8589);
      var c2 = cljs.core.first(cljs.core.next(arglist__8589));
      var colls = cljs.core.rest(cljs.core.next(arglist__8589));
      return G__8588__delegate(c1, c2, colls)
    };
    G__8588.cljs$lang$arity$variadic = G__8588__delegate;
    return G__8588
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
  var cat__8599 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8597 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8597) {
        var coll__8598 = temp__3971__auto____8597;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8598), cat.call(null, cljs.core.rest.call(null, coll__8598), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8599.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8600__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8600 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8600__delegate.call(this, f, coll, colls)
    };
    G__8600.cljs$lang$maxFixedArity = 2;
    G__8600.cljs$lang$applyTo = function(arglist__8601) {
      var f = cljs.core.first(arglist__8601);
      var coll = cljs.core.first(cljs.core.next(arglist__8601));
      var colls = cljs.core.rest(cljs.core.next(arglist__8601));
      return G__8600__delegate(f, coll, colls)
    };
    G__8600.cljs$lang$arity$variadic = G__8600__delegate;
    return G__8600
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
    var temp__3974__auto____8611 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8611) {
      var s__8612 = temp__3974__auto____8611;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8612)) {
        var c__8613 = cljs.core.chunk_first.call(null, s__8612);
        var size__8614 = cljs.core.count.call(null, c__8613);
        var b__8615 = cljs.core.chunk_buffer.call(null, size__8614);
        var n__2527__auto____8616 = size__8614;
        var i__8617 = 0;
        while(true) {
          if(i__8617 < n__2527__auto____8616) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8613, i__8617)))) {
              cljs.core.chunk_append.call(null, b__8615, cljs.core._nth.call(null, c__8613, i__8617))
            }else {
            }
            var G__8620 = i__8617 + 1;
            i__8617 = G__8620;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8615), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8612)))
      }else {
        var f__8618 = cljs.core.first.call(null, s__8612);
        var r__8619 = cljs.core.rest.call(null, s__8612);
        if(cljs.core.truth_(pred.call(null, f__8618))) {
          return cljs.core.cons.call(null, f__8618, filter.call(null, pred, r__8619))
        }else {
          return filter.call(null, pred, r__8619)
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
  var walk__8623 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8623.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8621_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8621_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8627__8628 = to;
    if(G__8627__8628) {
      if(function() {
        var or__3824__auto____8629 = G__8627__8628.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8629) {
          return or__3824__auto____8629
        }else {
          return G__8627__8628.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8627__8628.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8627__8628)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8627__8628)
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
    var G__8630__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8630 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8630__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8630.cljs$lang$maxFixedArity = 4;
    G__8630.cljs$lang$applyTo = function(arglist__8631) {
      var f = cljs.core.first(arglist__8631);
      var c1 = cljs.core.first(cljs.core.next(arglist__8631));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8631)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8631))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8631))));
      return G__8630__delegate(f, c1, c2, c3, colls)
    };
    G__8630.cljs$lang$arity$variadic = G__8630__delegate;
    return G__8630
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
      var temp__3974__auto____8638 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8638) {
        var s__8639 = temp__3974__auto____8638;
        var p__8640 = cljs.core.take.call(null, n, s__8639);
        if(n === cljs.core.count.call(null, p__8640)) {
          return cljs.core.cons.call(null, p__8640, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8639)))
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
      var temp__3974__auto____8641 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8641) {
        var s__8642 = temp__3974__auto____8641;
        var p__8643 = cljs.core.take.call(null, n, s__8642);
        if(n === cljs.core.count.call(null, p__8643)) {
          return cljs.core.cons.call(null, p__8643, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8642)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8643, pad)))
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
    var sentinel__8648 = cljs.core.lookup_sentinel;
    var m__8649 = m;
    var ks__8650 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8650) {
        var m__8651 = cljs.core._lookup.call(null, m__8649, cljs.core.first.call(null, ks__8650), sentinel__8648);
        if(sentinel__8648 === m__8651) {
          return not_found
        }else {
          var G__8652 = sentinel__8648;
          var G__8653 = m__8651;
          var G__8654 = cljs.core.next.call(null, ks__8650);
          sentinel__8648 = G__8652;
          m__8649 = G__8653;
          ks__8650 = G__8654;
          continue
        }
      }else {
        return m__8649
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
cljs.core.assoc_in = function assoc_in(m, p__8655, v) {
  var vec__8660__8661 = p__8655;
  var k__8662 = cljs.core.nth.call(null, vec__8660__8661, 0, null);
  var ks__8663 = cljs.core.nthnext.call(null, vec__8660__8661, 1);
  if(cljs.core.truth_(ks__8663)) {
    return cljs.core.assoc.call(null, m, k__8662, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8662, null), ks__8663, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8662, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8664, f, args) {
    var vec__8669__8670 = p__8664;
    var k__8671 = cljs.core.nth.call(null, vec__8669__8670, 0, null);
    var ks__8672 = cljs.core.nthnext.call(null, vec__8669__8670, 1);
    if(cljs.core.truth_(ks__8672)) {
      return cljs.core.assoc.call(null, m, k__8671, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8671, null), ks__8672, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8671, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8671, null), args))
    }
  };
  var update_in = function(m, p__8664, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8664, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8673) {
    var m = cljs.core.first(arglist__8673);
    var p__8664 = cljs.core.first(cljs.core.next(arglist__8673));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8673)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8673)));
    return update_in__delegate(m, p__8664, f, args)
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
  var this__8676 = this;
  var h__2192__auto____8677 = this__8676.__hash;
  if(!(h__2192__auto____8677 == null)) {
    return h__2192__auto____8677
  }else {
    var h__2192__auto____8678 = cljs.core.hash_coll.call(null, coll);
    this__8676.__hash = h__2192__auto____8678;
    return h__2192__auto____8678
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8679 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8680 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8681 = this;
  var new_array__8682 = this__8681.array.slice();
  new_array__8682[k] = v;
  return new cljs.core.Vector(this__8681.meta, new_array__8682, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8713 = null;
  var G__8713__2 = function(this_sym8683, k) {
    var this__8685 = this;
    var this_sym8683__8686 = this;
    var coll__8687 = this_sym8683__8686;
    return coll__8687.cljs$core$ILookup$_lookup$arity$2(coll__8687, k)
  };
  var G__8713__3 = function(this_sym8684, k, not_found) {
    var this__8685 = this;
    var this_sym8684__8688 = this;
    var coll__8689 = this_sym8684__8688;
    return coll__8689.cljs$core$ILookup$_lookup$arity$3(coll__8689, k, not_found)
  };
  G__8713 = function(this_sym8684, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8713__2.call(this, this_sym8684, k);
      case 3:
        return G__8713__3.call(this, this_sym8684, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8713
}();
cljs.core.Vector.prototype.apply = function(this_sym8674, args8675) {
  var this__8690 = this;
  return this_sym8674.call.apply(this_sym8674, [this_sym8674].concat(args8675.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8691 = this;
  var new_array__8692 = this__8691.array.slice();
  new_array__8692.push(o);
  return new cljs.core.Vector(this__8691.meta, new_array__8692, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8693 = this;
  var this__8694 = this;
  return cljs.core.pr_str.call(null, this__8694)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8695 = this;
  return cljs.core.ci_reduce.call(null, this__8695.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8696 = this;
  return cljs.core.ci_reduce.call(null, this__8696.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8697 = this;
  if(this__8697.array.length > 0) {
    var vector_seq__8698 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8697.array.length) {
          return cljs.core.cons.call(null, this__8697.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8698.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8699 = this;
  return this__8699.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8700 = this;
  var count__8701 = this__8700.array.length;
  if(count__8701 > 0) {
    return this__8700.array[count__8701 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8702 = this;
  if(this__8702.array.length > 0) {
    var new_array__8703 = this__8702.array.slice();
    new_array__8703.pop();
    return new cljs.core.Vector(this__8702.meta, new_array__8703, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8704 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8705 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8706 = this;
  return new cljs.core.Vector(meta, this__8706.array, this__8706.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8707 = this;
  return this__8707.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8708 = this;
  if(function() {
    var and__3822__auto____8709 = 0 <= n;
    if(and__3822__auto____8709) {
      return n < this__8708.array.length
    }else {
      return and__3822__auto____8709
    }
  }()) {
    return this__8708.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8710 = this;
  if(function() {
    var and__3822__auto____8711 = 0 <= n;
    if(and__3822__auto____8711) {
      return n < this__8710.array.length
    }else {
      return and__3822__auto____8711
    }
  }()) {
    return this__8710.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8712 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8712.meta)
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
  var cnt__8715 = pv.cnt;
  if(cnt__8715 < 32) {
    return 0
  }else {
    return cnt__8715 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8721 = level;
  var ret__8722 = node;
  while(true) {
    if(ll__8721 === 0) {
      return ret__8722
    }else {
      var embed__8723 = ret__8722;
      var r__8724 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8725 = cljs.core.pv_aset.call(null, r__8724, 0, embed__8723);
      var G__8726 = ll__8721 - 5;
      var G__8727 = r__8724;
      ll__8721 = G__8726;
      ret__8722 = G__8727;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8733 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8734 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8733, subidx__8734, tailnode);
    return ret__8733
  }else {
    var child__8735 = cljs.core.pv_aget.call(null, parent, subidx__8734);
    if(!(child__8735 == null)) {
      var node_to_insert__8736 = push_tail.call(null, pv, level - 5, child__8735, tailnode);
      cljs.core.pv_aset.call(null, ret__8733, subidx__8734, node_to_insert__8736);
      return ret__8733
    }else {
      var node_to_insert__8737 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8733, subidx__8734, node_to_insert__8737);
      return ret__8733
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8741 = 0 <= i;
    if(and__3822__auto____8741) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8741
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8742 = pv.root;
      var level__8743 = pv.shift;
      while(true) {
        if(level__8743 > 0) {
          var G__8744 = cljs.core.pv_aget.call(null, node__8742, i >>> level__8743 & 31);
          var G__8745 = level__8743 - 5;
          node__8742 = G__8744;
          level__8743 = G__8745;
          continue
        }else {
          return node__8742.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8748 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8748, i & 31, val);
    return ret__8748
  }else {
    var subidx__8749 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8748, subidx__8749, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8749), i, val));
    return ret__8748
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8755 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8756 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8755));
    if(function() {
      var and__3822__auto____8757 = new_child__8756 == null;
      if(and__3822__auto____8757) {
        return subidx__8755 === 0
      }else {
        return and__3822__auto____8757
      }
    }()) {
      return null
    }else {
      var ret__8758 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8758, subidx__8755, new_child__8756);
      return ret__8758
    }
  }else {
    if(subidx__8755 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8759 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8759, subidx__8755, null);
        return ret__8759
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
  var this__8762 = this;
  return new cljs.core.TransientVector(this__8762.cnt, this__8762.shift, cljs.core.tv_editable_root.call(null, this__8762.root), cljs.core.tv_editable_tail.call(null, this__8762.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8763 = this;
  var h__2192__auto____8764 = this__8763.__hash;
  if(!(h__2192__auto____8764 == null)) {
    return h__2192__auto____8764
  }else {
    var h__2192__auto____8765 = cljs.core.hash_coll.call(null, coll);
    this__8763.__hash = h__2192__auto____8765;
    return h__2192__auto____8765
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8766 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8767 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8768 = this;
  if(function() {
    var and__3822__auto____8769 = 0 <= k;
    if(and__3822__auto____8769) {
      return k < this__8768.cnt
    }else {
      return and__3822__auto____8769
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8770 = this__8768.tail.slice();
      new_tail__8770[k & 31] = v;
      return new cljs.core.PersistentVector(this__8768.meta, this__8768.cnt, this__8768.shift, this__8768.root, new_tail__8770, null)
    }else {
      return new cljs.core.PersistentVector(this__8768.meta, this__8768.cnt, this__8768.shift, cljs.core.do_assoc.call(null, coll, this__8768.shift, this__8768.root, k, v), this__8768.tail, null)
    }
  }else {
    if(k === this__8768.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8768.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8818 = null;
  var G__8818__2 = function(this_sym8771, k) {
    var this__8773 = this;
    var this_sym8771__8774 = this;
    var coll__8775 = this_sym8771__8774;
    return coll__8775.cljs$core$ILookup$_lookup$arity$2(coll__8775, k)
  };
  var G__8818__3 = function(this_sym8772, k, not_found) {
    var this__8773 = this;
    var this_sym8772__8776 = this;
    var coll__8777 = this_sym8772__8776;
    return coll__8777.cljs$core$ILookup$_lookup$arity$3(coll__8777, k, not_found)
  };
  G__8818 = function(this_sym8772, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8818__2.call(this, this_sym8772, k);
      case 3:
        return G__8818__3.call(this, this_sym8772, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8818
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8760, args8761) {
  var this__8778 = this;
  return this_sym8760.call.apply(this_sym8760, [this_sym8760].concat(args8761.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8779 = this;
  var step_init__8780 = [0, init];
  var i__8781 = 0;
  while(true) {
    if(i__8781 < this__8779.cnt) {
      var arr__8782 = cljs.core.array_for.call(null, v, i__8781);
      var len__8783 = arr__8782.length;
      var init__8787 = function() {
        var j__8784 = 0;
        var init__8785 = step_init__8780[1];
        while(true) {
          if(j__8784 < len__8783) {
            var init__8786 = f.call(null, init__8785, j__8784 + i__8781, arr__8782[j__8784]);
            if(cljs.core.reduced_QMARK_.call(null, init__8786)) {
              return init__8786
            }else {
              var G__8819 = j__8784 + 1;
              var G__8820 = init__8786;
              j__8784 = G__8819;
              init__8785 = G__8820;
              continue
            }
          }else {
            step_init__8780[0] = len__8783;
            step_init__8780[1] = init__8785;
            return init__8785
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8787)) {
        return cljs.core.deref.call(null, init__8787)
      }else {
        var G__8821 = i__8781 + step_init__8780[0];
        i__8781 = G__8821;
        continue
      }
    }else {
      return step_init__8780[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8788 = this;
  if(this__8788.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8789 = this__8788.tail.slice();
    new_tail__8789.push(o);
    return new cljs.core.PersistentVector(this__8788.meta, this__8788.cnt + 1, this__8788.shift, this__8788.root, new_tail__8789, null)
  }else {
    var root_overflow_QMARK___8790 = this__8788.cnt >>> 5 > 1 << this__8788.shift;
    var new_shift__8791 = root_overflow_QMARK___8790 ? this__8788.shift + 5 : this__8788.shift;
    var new_root__8793 = root_overflow_QMARK___8790 ? function() {
      var n_r__8792 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8792, 0, this__8788.root);
      cljs.core.pv_aset.call(null, n_r__8792, 1, cljs.core.new_path.call(null, null, this__8788.shift, new cljs.core.VectorNode(null, this__8788.tail)));
      return n_r__8792
    }() : cljs.core.push_tail.call(null, coll, this__8788.shift, this__8788.root, new cljs.core.VectorNode(null, this__8788.tail));
    return new cljs.core.PersistentVector(this__8788.meta, this__8788.cnt + 1, new_shift__8791, new_root__8793, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8794 = this;
  if(this__8794.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8794.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8795 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8796 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8797 = this;
  var this__8798 = this;
  return cljs.core.pr_str.call(null, this__8798)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8799 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8800 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8801 = this;
  if(this__8801.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8802 = this;
  return this__8802.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8803 = this;
  if(this__8803.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8803.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8804 = this;
  if(this__8804.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8804.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8804.meta)
    }else {
      if(1 < this__8804.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8804.meta, this__8804.cnt - 1, this__8804.shift, this__8804.root, this__8804.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8805 = cljs.core.array_for.call(null, coll, this__8804.cnt - 2);
          var nr__8806 = cljs.core.pop_tail.call(null, coll, this__8804.shift, this__8804.root);
          var new_root__8807 = nr__8806 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8806;
          var cnt_1__8808 = this__8804.cnt - 1;
          if(function() {
            var and__3822__auto____8809 = 5 < this__8804.shift;
            if(and__3822__auto____8809) {
              return cljs.core.pv_aget.call(null, new_root__8807, 1) == null
            }else {
              return and__3822__auto____8809
            }
          }()) {
            return new cljs.core.PersistentVector(this__8804.meta, cnt_1__8808, this__8804.shift - 5, cljs.core.pv_aget.call(null, new_root__8807, 0), new_tail__8805, null)
          }else {
            return new cljs.core.PersistentVector(this__8804.meta, cnt_1__8808, this__8804.shift, new_root__8807, new_tail__8805, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8810 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8811 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8812 = this;
  return new cljs.core.PersistentVector(meta, this__8812.cnt, this__8812.shift, this__8812.root, this__8812.tail, this__8812.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8813 = this;
  return this__8813.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8814 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8815 = this;
  if(function() {
    var and__3822__auto____8816 = 0 <= n;
    if(and__3822__auto____8816) {
      return n < this__8815.cnt
    }else {
      return and__3822__auto____8816
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8817 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8817.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8822 = xs.length;
  var xs__8823 = no_clone === true ? xs : xs.slice();
  if(l__8822 < 32) {
    return new cljs.core.PersistentVector(null, l__8822, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8823, null)
  }else {
    var node__8824 = xs__8823.slice(0, 32);
    var v__8825 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8824, null);
    var i__8826 = 32;
    var out__8827 = cljs.core._as_transient.call(null, v__8825);
    while(true) {
      if(i__8826 < l__8822) {
        var G__8828 = i__8826 + 1;
        var G__8829 = cljs.core.conj_BANG_.call(null, out__8827, xs__8823[i__8826]);
        i__8826 = G__8828;
        out__8827 = G__8829;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8827)
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
  vector.cljs$lang$applyTo = function(arglist__8830) {
    var args = cljs.core.seq(arglist__8830);
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
  var this__8831 = this;
  if(this__8831.off + 1 < this__8831.node.length) {
    var s__8832 = cljs.core.chunked_seq.call(null, this__8831.vec, this__8831.node, this__8831.i, this__8831.off + 1);
    if(s__8832 == null) {
      return null
    }else {
      return s__8832
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8833 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8834 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8835 = this;
  return this__8835.node[this__8835.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8836 = this;
  if(this__8836.off + 1 < this__8836.node.length) {
    var s__8837 = cljs.core.chunked_seq.call(null, this__8836.vec, this__8836.node, this__8836.i, this__8836.off + 1);
    if(s__8837 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8837
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8838 = this;
  var l__8839 = this__8838.node.length;
  var s__8840 = this__8838.i + l__8839 < cljs.core._count.call(null, this__8838.vec) ? cljs.core.chunked_seq.call(null, this__8838.vec, this__8838.i + l__8839, 0) : null;
  if(s__8840 == null) {
    return null
  }else {
    return s__8840
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8841 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8842 = this;
  return cljs.core.chunked_seq.call(null, this__8842.vec, this__8842.node, this__8842.i, this__8842.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8843 = this;
  return this__8843.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8844 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8844.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8845 = this;
  return cljs.core.array_chunk.call(null, this__8845.node, this__8845.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8846 = this;
  var l__8847 = this__8846.node.length;
  var s__8848 = this__8846.i + l__8847 < cljs.core._count.call(null, this__8846.vec) ? cljs.core.chunked_seq.call(null, this__8846.vec, this__8846.i + l__8847, 0) : null;
  if(s__8848 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8848
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
  var this__8851 = this;
  var h__2192__auto____8852 = this__8851.__hash;
  if(!(h__2192__auto____8852 == null)) {
    return h__2192__auto____8852
  }else {
    var h__2192__auto____8853 = cljs.core.hash_coll.call(null, coll);
    this__8851.__hash = h__2192__auto____8853;
    return h__2192__auto____8853
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8854 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8855 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8856 = this;
  var v_pos__8857 = this__8856.start + key;
  return new cljs.core.Subvec(this__8856.meta, cljs.core._assoc.call(null, this__8856.v, v_pos__8857, val), this__8856.start, this__8856.end > v_pos__8857 + 1 ? this__8856.end : v_pos__8857 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8883 = null;
  var G__8883__2 = function(this_sym8858, k) {
    var this__8860 = this;
    var this_sym8858__8861 = this;
    var coll__8862 = this_sym8858__8861;
    return coll__8862.cljs$core$ILookup$_lookup$arity$2(coll__8862, k)
  };
  var G__8883__3 = function(this_sym8859, k, not_found) {
    var this__8860 = this;
    var this_sym8859__8863 = this;
    var coll__8864 = this_sym8859__8863;
    return coll__8864.cljs$core$ILookup$_lookup$arity$3(coll__8864, k, not_found)
  };
  G__8883 = function(this_sym8859, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8883__2.call(this, this_sym8859, k);
      case 3:
        return G__8883__3.call(this, this_sym8859, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8883
}();
cljs.core.Subvec.prototype.apply = function(this_sym8849, args8850) {
  var this__8865 = this;
  return this_sym8849.call.apply(this_sym8849, [this_sym8849].concat(args8850.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8866 = this;
  return new cljs.core.Subvec(this__8866.meta, cljs.core._assoc_n.call(null, this__8866.v, this__8866.end, o), this__8866.start, this__8866.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8867 = this;
  var this__8868 = this;
  return cljs.core.pr_str.call(null, this__8868)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8869 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8870 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8871 = this;
  var subvec_seq__8872 = function subvec_seq(i) {
    if(i === this__8871.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8871.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8872.call(null, this__8871.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8873 = this;
  return this__8873.end - this__8873.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8874 = this;
  return cljs.core._nth.call(null, this__8874.v, this__8874.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8875 = this;
  if(this__8875.start === this__8875.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8875.meta, this__8875.v, this__8875.start, this__8875.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8876 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8877 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8878 = this;
  return new cljs.core.Subvec(meta, this__8878.v, this__8878.start, this__8878.end, this__8878.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8879 = this;
  return this__8879.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8880 = this;
  return cljs.core._nth.call(null, this__8880.v, this__8880.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8881 = this;
  return cljs.core._nth.call(null, this__8881.v, this__8881.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8882 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8882.meta)
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
  var ret__8885 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8885, 0, tl.length);
  return ret__8885
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8889 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8890 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8889, subidx__8890, level === 5 ? tail_node : function() {
    var child__8891 = cljs.core.pv_aget.call(null, ret__8889, subidx__8890);
    if(!(child__8891 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8891, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8889
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8896 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8897 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8898 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8896, subidx__8897));
    if(function() {
      var and__3822__auto____8899 = new_child__8898 == null;
      if(and__3822__auto____8899) {
        return subidx__8897 === 0
      }else {
        return and__3822__auto____8899
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8896, subidx__8897, new_child__8898);
      return node__8896
    }
  }else {
    if(subidx__8897 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8896, subidx__8897, null);
        return node__8896
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8904 = 0 <= i;
    if(and__3822__auto____8904) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8904
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8905 = tv.root;
      var node__8906 = root__8905;
      var level__8907 = tv.shift;
      while(true) {
        if(level__8907 > 0) {
          var G__8908 = cljs.core.tv_ensure_editable.call(null, root__8905.edit, cljs.core.pv_aget.call(null, node__8906, i >>> level__8907 & 31));
          var G__8909 = level__8907 - 5;
          node__8906 = G__8908;
          level__8907 = G__8909;
          continue
        }else {
          return node__8906.arr
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
  var G__8949 = null;
  var G__8949__2 = function(this_sym8912, k) {
    var this__8914 = this;
    var this_sym8912__8915 = this;
    var coll__8916 = this_sym8912__8915;
    return coll__8916.cljs$core$ILookup$_lookup$arity$2(coll__8916, k)
  };
  var G__8949__3 = function(this_sym8913, k, not_found) {
    var this__8914 = this;
    var this_sym8913__8917 = this;
    var coll__8918 = this_sym8913__8917;
    return coll__8918.cljs$core$ILookup$_lookup$arity$3(coll__8918, k, not_found)
  };
  G__8949 = function(this_sym8913, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8949__2.call(this, this_sym8913, k);
      case 3:
        return G__8949__3.call(this, this_sym8913, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8949
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8910, args8911) {
  var this__8919 = this;
  return this_sym8910.call.apply(this_sym8910, [this_sym8910].concat(args8911.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8920 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8921 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8922 = this;
  if(this__8922.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8923 = this;
  if(function() {
    var and__3822__auto____8924 = 0 <= n;
    if(and__3822__auto____8924) {
      return n < this__8923.cnt
    }else {
      return and__3822__auto____8924
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8925 = this;
  if(this__8925.root.edit) {
    return this__8925.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8926 = this;
  if(this__8926.root.edit) {
    if(function() {
      var and__3822__auto____8927 = 0 <= n;
      if(and__3822__auto____8927) {
        return n < this__8926.cnt
      }else {
        return and__3822__auto____8927
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8926.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8932 = function go(level, node) {
          var node__8930 = cljs.core.tv_ensure_editable.call(null, this__8926.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8930, n & 31, val);
            return node__8930
          }else {
            var subidx__8931 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8930, subidx__8931, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8930, subidx__8931)));
            return node__8930
          }
        }.call(null, this__8926.shift, this__8926.root);
        this__8926.root = new_root__8932;
        return tcoll
      }
    }else {
      if(n === this__8926.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8926.cnt)].join(""));
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
  var this__8933 = this;
  if(this__8933.root.edit) {
    if(this__8933.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8933.cnt) {
        this__8933.cnt = 0;
        return tcoll
      }else {
        if((this__8933.cnt - 1 & 31) > 0) {
          this__8933.cnt = this__8933.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8934 = cljs.core.editable_array_for.call(null, tcoll, this__8933.cnt - 2);
            var new_root__8936 = function() {
              var nr__8935 = cljs.core.tv_pop_tail.call(null, tcoll, this__8933.shift, this__8933.root);
              if(!(nr__8935 == null)) {
                return nr__8935
              }else {
                return new cljs.core.VectorNode(this__8933.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8937 = 5 < this__8933.shift;
              if(and__3822__auto____8937) {
                return cljs.core.pv_aget.call(null, new_root__8936, 1) == null
              }else {
                return and__3822__auto____8937
              }
            }()) {
              var new_root__8938 = cljs.core.tv_ensure_editable.call(null, this__8933.root.edit, cljs.core.pv_aget.call(null, new_root__8936, 0));
              this__8933.root = new_root__8938;
              this__8933.shift = this__8933.shift - 5;
              this__8933.cnt = this__8933.cnt - 1;
              this__8933.tail = new_tail__8934;
              return tcoll
            }else {
              this__8933.root = new_root__8936;
              this__8933.cnt = this__8933.cnt - 1;
              this__8933.tail = new_tail__8934;
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
  var this__8939 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8940 = this;
  if(this__8940.root.edit) {
    if(this__8940.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8940.tail[this__8940.cnt & 31] = o;
      this__8940.cnt = this__8940.cnt + 1;
      return tcoll
    }else {
      var tail_node__8941 = new cljs.core.VectorNode(this__8940.root.edit, this__8940.tail);
      var new_tail__8942 = cljs.core.make_array.call(null, 32);
      new_tail__8942[0] = o;
      this__8940.tail = new_tail__8942;
      if(this__8940.cnt >>> 5 > 1 << this__8940.shift) {
        var new_root_array__8943 = cljs.core.make_array.call(null, 32);
        var new_shift__8944 = this__8940.shift + 5;
        new_root_array__8943[0] = this__8940.root;
        new_root_array__8943[1] = cljs.core.new_path.call(null, this__8940.root.edit, this__8940.shift, tail_node__8941);
        this__8940.root = new cljs.core.VectorNode(this__8940.root.edit, new_root_array__8943);
        this__8940.shift = new_shift__8944;
        this__8940.cnt = this__8940.cnt + 1;
        return tcoll
      }else {
        var new_root__8945 = cljs.core.tv_push_tail.call(null, tcoll, this__8940.shift, this__8940.root, tail_node__8941);
        this__8940.root = new_root__8945;
        this__8940.cnt = this__8940.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8946 = this;
  if(this__8946.root.edit) {
    this__8946.root.edit = null;
    var len__8947 = this__8946.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8948 = cljs.core.make_array.call(null, len__8947);
    cljs.core.array_copy.call(null, this__8946.tail, 0, trimmed_tail__8948, 0, len__8947);
    return new cljs.core.PersistentVector(null, this__8946.cnt, this__8946.shift, this__8946.root, trimmed_tail__8948, null)
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
  var this__8950 = this;
  var h__2192__auto____8951 = this__8950.__hash;
  if(!(h__2192__auto____8951 == null)) {
    return h__2192__auto____8951
  }else {
    var h__2192__auto____8952 = cljs.core.hash_coll.call(null, coll);
    this__8950.__hash = h__2192__auto____8952;
    return h__2192__auto____8952
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8953 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8954 = this;
  var this__8955 = this;
  return cljs.core.pr_str.call(null, this__8955)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8956 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8957 = this;
  return cljs.core._first.call(null, this__8957.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8958 = this;
  var temp__3971__auto____8959 = cljs.core.next.call(null, this__8958.front);
  if(temp__3971__auto____8959) {
    var f1__8960 = temp__3971__auto____8959;
    return new cljs.core.PersistentQueueSeq(this__8958.meta, f1__8960, this__8958.rear, null)
  }else {
    if(this__8958.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8958.meta, this__8958.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8961 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8962 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8962.front, this__8962.rear, this__8962.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8963 = this;
  return this__8963.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8964 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8964.meta)
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
  var this__8965 = this;
  var h__2192__auto____8966 = this__8965.__hash;
  if(!(h__2192__auto____8966 == null)) {
    return h__2192__auto____8966
  }else {
    var h__2192__auto____8967 = cljs.core.hash_coll.call(null, coll);
    this__8965.__hash = h__2192__auto____8967;
    return h__2192__auto____8967
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8968 = this;
  if(cljs.core.truth_(this__8968.front)) {
    return new cljs.core.PersistentQueue(this__8968.meta, this__8968.count + 1, this__8968.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8969 = this__8968.rear;
      if(cljs.core.truth_(or__3824__auto____8969)) {
        return or__3824__auto____8969
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8968.meta, this__8968.count + 1, cljs.core.conj.call(null, this__8968.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8970 = this;
  var this__8971 = this;
  return cljs.core.pr_str.call(null, this__8971)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8972 = this;
  var rear__8973 = cljs.core.seq.call(null, this__8972.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8974 = this__8972.front;
    if(cljs.core.truth_(or__3824__auto____8974)) {
      return or__3824__auto____8974
    }else {
      return rear__8973
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8972.front, cljs.core.seq.call(null, rear__8973), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8975 = this;
  return this__8975.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8976 = this;
  return cljs.core._first.call(null, this__8976.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8977 = this;
  if(cljs.core.truth_(this__8977.front)) {
    var temp__3971__auto____8978 = cljs.core.next.call(null, this__8977.front);
    if(temp__3971__auto____8978) {
      var f1__8979 = temp__3971__auto____8978;
      return new cljs.core.PersistentQueue(this__8977.meta, this__8977.count - 1, f1__8979, this__8977.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8977.meta, this__8977.count - 1, cljs.core.seq.call(null, this__8977.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8980 = this;
  return cljs.core.first.call(null, this__8980.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8981 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8982 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8983 = this;
  return new cljs.core.PersistentQueue(meta, this__8983.count, this__8983.front, this__8983.rear, this__8983.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8984 = this;
  return this__8984.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8985 = this;
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
  var this__8986 = this;
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
  var len__8989 = array.length;
  var i__8990 = 0;
  while(true) {
    if(i__8990 < len__8989) {
      if(k === array[i__8990]) {
        return i__8990
      }else {
        var G__8991 = i__8990 + incr;
        i__8990 = G__8991;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8994 = cljs.core.hash.call(null, a);
  var b__8995 = cljs.core.hash.call(null, b);
  if(a__8994 < b__8995) {
    return-1
  }else {
    if(a__8994 > b__8995) {
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
  var ks__9003 = m.keys;
  var len__9004 = ks__9003.length;
  var so__9005 = m.strobj;
  var out__9006 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__9007 = 0;
  var out__9008 = cljs.core.transient$.call(null, out__9006);
  while(true) {
    if(i__9007 < len__9004) {
      var k__9009 = ks__9003[i__9007];
      var G__9010 = i__9007 + 1;
      var G__9011 = cljs.core.assoc_BANG_.call(null, out__9008, k__9009, so__9005[k__9009]);
      i__9007 = G__9010;
      out__9008 = G__9011;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__9008, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__9017 = {};
  var l__9018 = ks.length;
  var i__9019 = 0;
  while(true) {
    if(i__9019 < l__9018) {
      var k__9020 = ks[i__9019];
      new_obj__9017[k__9020] = obj[k__9020];
      var G__9021 = i__9019 + 1;
      i__9019 = G__9021;
      continue
    }else {
    }
    break
  }
  return new_obj__9017
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
  var this__9024 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9025 = this;
  var h__2192__auto____9026 = this__9025.__hash;
  if(!(h__2192__auto____9026 == null)) {
    return h__2192__auto____9026
  }else {
    var h__2192__auto____9027 = cljs.core.hash_imap.call(null, coll);
    this__9025.__hash = h__2192__auto____9027;
    return h__2192__auto____9027
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9028 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9029 = this;
  if(function() {
    var and__3822__auto____9030 = goog.isString(k);
    if(and__3822__auto____9030) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9029.keys) == null)
    }else {
      return and__3822__auto____9030
    }
  }()) {
    return this__9029.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9031 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____9032 = this__9031.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____9032) {
        return or__3824__auto____9032
      }else {
        return this__9031.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__9031.keys) == null)) {
        var new_strobj__9033 = cljs.core.obj_clone.call(null, this__9031.strobj, this__9031.keys);
        new_strobj__9033[k] = v;
        return new cljs.core.ObjMap(this__9031.meta, this__9031.keys, new_strobj__9033, this__9031.update_count + 1, null)
      }else {
        var new_strobj__9034 = cljs.core.obj_clone.call(null, this__9031.strobj, this__9031.keys);
        var new_keys__9035 = this__9031.keys.slice();
        new_strobj__9034[k] = v;
        new_keys__9035.push(k);
        return new cljs.core.ObjMap(this__9031.meta, new_keys__9035, new_strobj__9034, this__9031.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9036 = this;
  if(function() {
    var and__3822__auto____9037 = goog.isString(k);
    if(and__3822__auto____9037) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9036.keys) == null)
    }else {
      return and__3822__auto____9037
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__9059 = null;
  var G__9059__2 = function(this_sym9038, k) {
    var this__9040 = this;
    var this_sym9038__9041 = this;
    var coll__9042 = this_sym9038__9041;
    return coll__9042.cljs$core$ILookup$_lookup$arity$2(coll__9042, k)
  };
  var G__9059__3 = function(this_sym9039, k, not_found) {
    var this__9040 = this;
    var this_sym9039__9043 = this;
    var coll__9044 = this_sym9039__9043;
    return coll__9044.cljs$core$ILookup$_lookup$arity$3(coll__9044, k, not_found)
  };
  G__9059 = function(this_sym9039, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9059__2.call(this, this_sym9039, k);
      case 3:
        return G__9059__3.call(this, this_sym9039, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9059
}();
cljs.core.ObjMap.prototype.apply = function(this_sym9022, args9023) {
  var this__9045 = this;
  return this_sym9022.call.apply(this_sym9022, [this_sym9022].concat(args9023.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9046 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__9047 = this;
  var this__9048 = this;
  return cljs.core.pr_str.call(null, this__9048)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9049 = this;
  if(this__9049.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__9012_SHARP_) {
      return cljs.core.vector.call(null, p1__9012_SHARP_, this__9049.strobj[p1__9012_SHARP_])
    }, this__9049.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9050 = this;
  return this__9050.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9051 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9052 = this;
  return new cljs.core.ObjMap(meta, this__9052.keys, this__9052.strobj, this__9052.update_count, this__9052.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9053 = this;
  return this__9053.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9054 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__9054.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9055 = this;
  if(function() {
    var and__3822__auto____9056 = goog.isString(k);
    if(and__3822__auto____9056) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9055.keys) == null)
    }else {
      return and__3822__auto____9056
    }
  }()) {
    var new_keys__9057 = this__9055.keys.slice();
    var new_strobj__9058 = cljs.core.obj_clone.call(null, this__9055.strobj, this__9055.keys);
    new_keys__9057.splice(cljs.core.scan_array.call(null, 1, k, new_keys__9057), 1);
    cljs.core.js_delete.call(null, new_strobj__9058, k);
    return new cljs.core.ObjMap(this__9055.meta, new_keys__9057, new_strobj__9058, this__9055.update_count + 1, null)
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
  var this__9063 = this;
  var h__2192__auto____9064 = this__9063.__hash;
  if(!(h__2192__auto____9064 == null)) {
    return h__2192__auto____9064
  }else {
    var h__2192__auto____9065 = cljs.core.hash_imap.call(null, coll);
    this__9063.__hash = h__2192__auto____9065;
    return h__2192__auto____9065
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9066 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9067 = this;
  var bucket__9068 = this__9067.hashobj[cljs.core.hash.call(null, k)];
  var i__9069 = cljs.core.truth_(bucket__9068) ? cljs.core.scan_array.call(null, 2, k, bucket__9068) : null;
  if(cljs.core.truth_(i__9069)) {
    return bucket__9068[i__9069 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9070 = this;
  var h__9071 = cljs.core.hash.call(null, k);
  var bucket__9072 = this__9070.hashobj[h__9071];
  if(cljs.core.truth_(bucket__9072)) {
    var new_bucket__9073 = bucket__9072.slice();
    var new_hashobj__9074 = goog.object.clone(this__9070.hashobj);
    new_hashobj__9074[h__9071] = new_bucket__9073;
    var temp__3971__auto____9075 = cljs.core.scan_array.call(null, 2, k, new_bucket__9073);
    if(cljs.core.truth_(temp__3971__auto____9075)) {
      var i__9076 = temp__3971__auto____9075;
      new_bucket__9073[i__9076 + 1] = v;
      return new cljs.core.HashMap(this__9070.meta, this__9070.count, new_hashobj__9074, null)
    }else {
      new_bucket__9073.push(k, v);
      return new cljs.core.HashMap(this__9070.meta, this__9070.count + 1, new_hashobj__9074, null)
    }
  }else {
    var new_hashobj__9077 = goog.object.clone(this__9070.hashobj);
    new_hashobj__9077[h__9071] = [k, v];
    return new cljs.core.HashMap(this__9070.meta, this__9070.count + 1, new_hashobj__9077, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9078 = this;
  var bucket__9079 = this__9078.hashobj[cljs.core.hash.call(null, k)];
  var i__9080 = cljs.core.truth_(bucket__9079) ? cljs.core.scan_array.call(null, 2, k, bucket__9079) : null;
  if(cljs.core.truth_(i__9080)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__9105 = null;
  var G__9105__2 = function(this_sym9081, k) {
    var this__9083 = this;
    var this_sym9081__9084 = this;
    var coll__9085 = this_sym9081__9084;
    return coll__9085.cljs$core$ILookup$_lookup$arity$2(coll__9085, k)
  };
  var G__9105__3 = function(this_sym9082, k, not_found) {
    var this__9083 = this;
    var this_sym9082__9086 = this;
    var coll__9087 = this_sym9082__9086;
    return coll__9087.cljs$core$ILookup$_lookup$arity$3(coll__9087, k, not_found)
  };
  G__9105 = function(this_sym9082, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9105__2.call(this, this_sym9082, k);
      case 3:
        return G__9105__3.call(this, this_sym9082, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9105
}();
cljs.core.HashMap.prototype.apply = function(this_sym9061, args9062) {
  var this__9088 = this;
  return this_sym9061.call.apply(this_sym9061, [this_sym9061].concat(args9062.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9089 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__9090 = this;
  var this__9091 = this;
  return cljs.core.pr_str.call(null, this__9091)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9092 = this;
  if(this__9092.count > 0) {
    var hashes__9093 = cljs.core.js_keys.call(null, this__9092.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__9060_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__9092.hashobj[p1__9060_SHARP_]))
    }, hashes__9093)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9094 = this;
  return this__9094.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9095 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9096 = this;
  return new cljs.core.HashMap(meta, this__9096.count, this__9096.hashobj, this__9096.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9097 = this;
  return this__9097.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9098 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__9098.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9099 = this;
  var h__9100 = cljs.core.hash.call(null, k);
  var bucket__9101 = this__9099.hashobj[h__9100];
  var i__9102 = cljs.core.truth_(bucket__9101) ? cljs.core.scan_array.call(null, 2, k, bucket__9101) : null;
  if(cljs.core.not.call(null, i__9102)) {
    return coll
  }else {
    var new_hashobj__9103 = goog.object.clone(this__9099.hashobj);
    if(3 > bucket__9101.length) {
      cljs.core.js_delete.call(null, new_hashobj__9103, h__9100)
    }else {
      var new_bucket__9104 = bucket__9101.slice();
      new_bucket__9104.splice(i__9102, 2);
      new_hashobj__9103[h__9100] = new_bucket__9104
    }
    return new cljs.core.HashMap(this__9099.meta, this__9099.count - 1, new_hashobj__9103, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__9106 = ks.length;
  var i__9107 = 0;
  var out__9108 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__9107 < len__9106) {
      var G__9109 = i__9107 + 1;
      var G__9110 = cljs.core.assoc.call(null, out__9108, ks[i__9107], vs[i__9107]);
      i__9107 = G__9109;
      out__9108 = G__9110;
      continue
    }else {
      return out__9108
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__9114 = m.arr;
  var len__9115 = arr__9114.length;
  var i__9116 = 0;
  while(true) {
    if(len__9115 <= i__9116) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__9114[i__9116], k)) {
        return i__9116
      }else {
        if("\ufdd0'else") {
          var G__9117 = i__9116 + 2;
          i__9116 = G__9117;
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
  var this__9120 = this;
  return new cljs.core.TransientArrayMap({}, this__9120.arr.length, this__9120.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9121 = this;
  var h__2192__auto____9122 = this__9121.__hash;
  if(!(h__2192__auto____9122 == null)) {
    return h__2192__auto____9122
  }else {
    var h__2192__auto____9123 = cljs.core.hash_imap.call(null, coll);
    this__9121.__hash = h__2192__auto____9123;
    return h__2192__auto____9123
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9124 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9125 = this;
  var idx__9126 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9126 === -1) {
    return not_found
  }else {
    return this__9125.arr[idx__9126 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9127 = this;
  var idx__9128 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9128 === -1) {
    if(this__9127.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__9127.meta, this__9127.cnt + 1, function() {
        var G__9129__9130 = this__9127.arr.slice();
        G__9129__9130.push(k);
        G__9129__9130.push(v);
        return G__9129__9130
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__9127.arr[idx__9128 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__9127.meta, this__9127.cnt, function() {
          var G__9131__9132 = this__9127.arr.slice();
          G__9131__9132[idx__9128 + 1] = v;
          return G__9131__9132
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9133 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__9165 = null;
  var G__9165__2 = function(this_sym9134, k) {
    var this__9136 = this;
    var this_sym9134__9137 = this;
    var coll__9138 = this_sym9134__9137;
    return coll__9138.cljs$core$ILookup$_lookup$arity$2(coll__9138, k)
  };
  var G__9165__3 = function(this_sym9135, k, not_found) {
    var this__9136 = this;
    var this_sym9135__9139 = this;
    var coll__9140 = this_sym9135__9139;
    return coll__9140.cljs$core$ILookup$_lookup$arity$3(coll__9140, k, not_found)
  };
  G__9165 = function(this_sym9135, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9165__2.call(this, this_sym9135, k);
      case 3:
        return G__9165__3.call(this, this_sym9135, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9165
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym9118, args9119) {
  var this__9141 = this;
  return this_sym9118.call.apply(this_sym9118, [this_sym9118].concat(args9119.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9142 = this;
  var len__9143 = this__9142.arr.length;
  var i__9144 = 0;
  var init__9145 = init;
  while(true) {
    if(i__9144 < len__9143) {
      var init__9146 = f.call(null, init__9145, this__9142.arr[i__9144], this__9142.arr[i__9144 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__9146)) {
        return cljs.core.deref.call(null, init__9146)
      }else {
        var G__9166 = i__9144 + 2;
        var G__9167 = init__9146;
        i__9144 = G__9166;
        init__9145 = G__9167;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9147 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__9148 = this;
  var this__9149 = this;
  return cljs.core.pr_str.call(null, this__9149)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9150 = this;
  if(this__9150.cnt > 0) {
    var len__9151 = this__9150.arr.length;
    var array_map_seq__9152 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__9151) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__9150.arr[i], this__9150.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__9152.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9153 = this;
  return this__9153.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9154 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9155 = this;
  return new cljs.core.PersistentArrayMap(meta, this__9155.cnt, this__9155.arr, this__9155.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9156 = this;
  return this__9156.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9157 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__9157.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9158 = this;
  var idx__9159 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9159 >= 0) {
    var len__9160 = this__9158.arr.length;
    var new_len__9161 = len__9160 - 2;
    if(new_len__9161 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__9162 = cljs.core.make_array.call(null, new_len__9161);
      var s__9163 = 0;
      var d__9164 = 0;
      while(true) {
        if(s__9163 >= len__9160) {
          return new cljs.core.PersistentArrayMap(this__9158.meta, this__9158.cnt - 1, new_arr__9162, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__9158.arr[s__9163])) {
            var G__9168 = s__9163 + 2;
            var G__9169 = d__9164;
            s__9163 = G__9168;
            d__9164 = G__9169;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__9162[d__9164] = this__9158.arr[s__9163];
              new_arr__9162[d__9164 + 1] = this__9158.arr[s__9163 + 1];
              var G__9170 = s__9163 + 2;
              var G__9171 = d__9164 + 2;
              s__9163 = G__9170;
              d__9164 = G__9171;
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
  var len__9172 = cljs.core.count.call(null, ks);
  var i__9173 = 0;
  var out__9174 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__9173 < len__9172) {
      var G__9175 = i__9173 + 1;
      var G__9176 = cljs.core.assoc_BANG_.call(null, out__9174, ks[i__9173], vs[i__9173]);
      i__9173 = G__9175;
      out__9174 = G__9176;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9174)
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
  var this__9177 = this;
  if(cljs.core.truth_(this__9177.editable_QMARK_)) {
    var idx__9178 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9178 >= 0) {
      this__9177.arr[idx__9178] = this__9177.arr[this__9177.len - 2];
      this__9177.arr[idx__9178 + 1] = this__9177.arr[this__9177.len - 1];
      var G__9179__9180 = this__9177.arr;
      G__9179__9180.pop();
      G__9179__9180.pop();
      G__9179__9180;
      this__9177.len = this__9177.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9181 = this;
  if(cljs.core.truth_(this__9181.editable_QMARK_)) {
    var idx__9182 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9182 === -1) {
      if(this__9181.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__9181.len = this__9181.len + 2;
        this__9181.arr.push(key);
        this__9181.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__9181.len, this__9181.arr), key, val)
      }
    }else {
      if(val === this__9181.arr[idx__9182 + 1]) {
        return tcoll
      }else {
        this__9181.arr[idx__9182 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9183 = this;
  if(cljs.core.truth_(this__9183.editable_QMARK_)) {
    if(function() {
      var G__9184__9185 = o;
      if(G__9184__9185) {
        if(function() {
          var or__3824__auto____9186 = G__9184__9185.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9186) {
            return or__3824__auto____9186
          }else {
            return G__9184__9185.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9184__9185.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9184__9185)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9184__9185)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9187 = cljs.core.seq.call(null, o);
      var tcoll__9188 = tcoll;
      while(true) {
        var temp__3971__auto____9189 = cljs.core.first.call(null, es__9187);
        if(cljs.core.truth_(temp__3971__auto____9189)) {
          var e__9190 = temp__3971__auto____9189;
          var G__9196 = cljs.core.next.call(null, es__9187);
          var G__9197 = tcoll__9188.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__9188, cljs.core.key.call(null, e__9190), cljs.core.val.call(null, e__9190));
          es__9187 = G__9196;
          tcoll__9188 = G__9197;
          continue
        }else {
          return tcoll__9188
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9191 = this;
  if(cljs.core.truth_(this__9191.editable_QMARK_)) {
    this__9191.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__9191.len, 2), this__9191.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9192 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9193 = this;
  if(cljs.core.truth_(this__9193.editable_QMARK_)) {
    var idx__9194 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__9194 === -1) {
      return not_found
    }else {
      return this__9193.arr[idx__9194 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9195 = this;
  if(cljs.core.truth_(this__9195.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__9195.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__9200 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__9201 = 0;
  while(true) {
    if(i__9201 < len) {
      var G__9202 = cljs.core.assoc_BANG_.call(null, out__9200, arr[i__9201], arr[i__9201 + 1]);
      var G__9203 = i__9201 + 2;
      out__9200 = G__9202;
      i__9201 = G__9203;
      continue
    }else {
      return out__9200
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
    var G__9208__9209 = arr.slice();
    G__9208__9209[i] = a;
    return G__9208__9209
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__9210__9211 = arr.slice();
    G__9210__9211[i] = a;
    G__9210__9211[j] = b;
    return G__9210__9211
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
  var new_arr__9213 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__9213, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__9213, 2 * i, new_arr__9213.length - 2 * i);
  return new_arr__9213
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
    var editable__9216 = inode.ensure_editable(edit);
    editable__9216.arr[i] = a;
    return editable__9216
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__9217 = inode.ensure_editable(edit);
    editable__9217.arr[i] = a;
    editable__9217.arr[j] = b;
    return editable__9217
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
  var len__9224 = arr.length;
  var i__9225 = 0;
  var init__9226 = init;
  while(true) {
    if(i__9225 < len__9224) {
      var init__9229 = function() {
        var k__9227 = arr[i__9225];
        if(!(k__9227 == null)) {
          return f.call(null, init__9226, k__9227, arr[i__9225 + 1])
        }else {
          var node__9228 = arr[i__9225 + 1];
          if(!(node__9228 == null)) {
            return node__9228.kv_reduce(f, init__9226)
          }else {
            return init__9226
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9229)) {
        return cljs.core.deref.call(null, init__9229)
      }else {
        var G__9230 = i__9225 + 2;
        var G__9231 = init__9229;
        i__9225 = G__9230;
        init__9226 = G__9231;
        continue
      }
    }else {
      return init__9226
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
  var this__9232 = this;
  var inode__9233 = this;
  if(this__9232.bitmap === bit) {
    return null
  }else {
    var editable__9234 = inode__9233.ensure_editable(e);
    var earr__9235 = editable__9234.arr;
    var len__9236 = earr__9235.length;
    editable__9234.bitmap = bit ^ editable__9234.bitmap;
    cljs.core.array_copy.call(null, earr__9235, 2 * (i + 1), earr__9235, 2 * i, len__9236 - 2 * (i + 1));
    earr__9235[len__9236 - 2] = null;
    earr__9235[len__9236 - 1] = null;
    return editable__9234
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9237 = this;
  var inode__9238 = this;
  var bit__9239 = 1 << (hash >>> shift & 31);
  var idx__9240 = cljs.core.bitmap_indexed_node_index.call(null, this__9237.bitmap, bit__9239);
  if((this__9237.bitmap & bit__9239) === 0) {
    var n__9241 = cljs.core.bit_count.call(null, this__9237.bitmap);
    if(2 * n__9241 < this__9237.arr.length) {
      var editable__9242 = inode__9238.ensure_editable(edit);
      var earr__9243 = editable__9242.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__9243, 2 * idx__9240, earr__9243, 2 * (idx__9240 + 1), 2 * (n__9241 - idx__9240));
      earr__9243[2 * idx__9240] = key;
      earr__9243[2 * idx__9240 + 1] = val;
      editable__9242.bitmap = editable__9242.bitmap | bit__9239;
      return editable__9242
    }else {
      if(n__9241 >= 16) {
        var nodes__9244 = cljs.core.make_array.call(null, 32);
        var jdx__9245 = hash >>> shift & 31;
        nodes__9244[jdx__9245] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__9246 = 0;
        var j__9247 = 0;
        while(true) {
          if(i__9246 < 32) {
            if((this__9237.bitmap >>> i__9246 & 1) === 0) {
              var G__9300 = i__9246 + 1;
              var G__9301 = j__9247;
              i__9246 = G__9300;
              j__9247 = G__9301;
              continue
            }else {
              nodes__9244[i__9246] = !(this__9237.arr[j__9247] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__9237.arr[j__9247]), this__9237.arr[j__9247], this__9237.arr[j__9247 + 1], added_leaf_QMARK_) : this__9237.arr[j__9247 + 1];
              var G__9302 = i__9246 + 1;
              var G__9303 = j__9247 + 2;
              i__9246 = G__9302;
              j__9247 = G__9303;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__9241 + 1, nodes__9244)
      }else {
        if("\ufdd0'else") {
          var new_arr__9248 = cljs.core.make_array.call(null, 2 * (n__9241 + 4));
          cljs.core.array_copy.call(null, this__9237.arr, 0, new_arr__9248, 0, 2 * idx__9240);
          new_arr__9248[2 * idx__9240] = key;
          new_arr__9248[2 * idx__9240 + 1] = val;
          cljs.core.array_copy.call(null, this__9237.arr, 2 * idx__9240, new_arr__9248, 2 * (idx__9240 + 1), 2 * (n__9241 - idx__9240));
          added_leaf_QMARK_.val = true;
          var editable__9249 = inode__9238.ensure_editable(edit);
          editable__9249.arr = new_arr__9248;
          editable__9249.bitmap = editable__9249.bitmap | bit__9239;
          return editable__9249
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__9250 = this__9237.arr[2 * idx__9240];
    var val_or_node__9251 = this__9237.arr[2 * idx__9240 + 1];
    if(key_or_nil__9250 == null) {
      var n__9252 = val_or_node__9251.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9252 === val_or_node__9251) {
        return inode__9238
      }else {
        return cljs.core.edit_and_set.call(null, inode__9238, edit, 2 * idx__9240 + 1, n__9252)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9250)) {
        if(val === val_or_node__9251) {
          return inode__9238
        }else {
          return cljs.core.edit_and_set.call(null, inode__9238, edit, 2 * idx__9240 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__9238, edit, 2 * idx__9240, null, 2 * idx__9240 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__9250, val_or_node__9251, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__9253 = this;
  var inode__9254 = this;
  return cljs.core.create_inode_seq.call(null, this__9253.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9255 = this;
  var inode__9256 = this;
  var bit__9257 = 1 << (hash >>> shift & 31);
  if((this__9255.bitmap & bit__9257) === 0) {
    return inode__9256
  }else {
    var idx__9258 = cljs.core.bitmap_indexed_node_index.call(null, this__9255.bitmap, bit__9257);
    var key_or_nil__9259 = this__9255.arr[2 * idx__9258];
    var val_or_node__9260 = this__9255.arr[2 * idx__9258 + 1];
    if(key_or_nil__9259 == null) {
      var n__9261 = val_or_node__9260.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__9261 === val_or_node__9260) {
        return inode__9256
      }else {
        if(!(n__9261 == null)) {
          return cljs.core.edit_and_set.call(null, inode__9256, edit, 2 * idx__9258 + 1, n__9261)
        }else {
          if(this__9255.bitmap === bit__9257) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__9256.edit_and_remove_pair(edit, bit__9257, idx__9258)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9259)) {
        removed_leaf_QMARK_[0] = true;
        return inode__9256.edit_and_remove_pair(edit, bit__9257, idx__9258)
      }else {
        if("\ufdd0'else") {
          return inode__9256
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__9262 = this;
  var inode__9263 = this;
  if(e === this__9262.edit) {
    return inode__9263
  }else {
    var n__9264 = cljs.core.bit_count.call(null, this__9262.bitmap);
    var new_arr__9265 = cljs.core.make_array.call(null, n__9264 < 0 ? 4 : 2 * (n__9264 + 1));
    cljs.core.array_copy.call(null, this__9262.arr, 0, new_arr__9265, 0, 2 * n__9264);
    return new cljs.core.BitmapIndexedNode(e, this__9262.bitmap, new_arr__9265)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__9266 = this;
  var inode__9267 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9266.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9268 = this;
  var inode__9269 = this;
  var bit__9270 = 1 << (hash >>> shift & 31);
  if((this__9268.bitmap & bit__9270) === 0) {
    return not_found
  }else {
    var idx__9271 = cljs.core.bitmap_indexed_node_index.call(null, this__9268.bitmap, bit__9270);
    var key_or_nil__9272 = this__9268.arr[2 * idx__9271];
    var val_or_node__9273 = this__9268.arr[2 * idx__9271 + 1];
    if(key_or_nil__9272 == null) {
      return val_or_node__9273.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9272)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__9272, val_or_node__9273], true)
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
  var this__9274 = this;
  var inode__9275 = this;
  var bit__9276 = 1 << (hash >>> shift & 31);
  if((this__9274.bitmap & bit__9276) === 0) {
    return inode__9275
  }else {
    var idx__9277 = cljs.core.bitmap_indexed_node_index.call(null, this__9274.bitmap, bit__9276);
    var key_or_nil__9278 = this__9274.arr[2 * idx__9277];
    var val_or_node__9279 = this__9274.arr[2 * idx__9277 + 1];
    if(key_or_nil__9278 == null) {
      var n__9280 = val_or_node__9279.inode_without(shift + 5, hash, key);
      if(n__9280 === val_or_node__9279) {
        return inode__9275
      }else {
        if(!(n__9280 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__9274.bitmap, cljs.core.clone_and_set.call(null, this__9274.arr, 2 * idx__9277 + 1, n__9280))
        }else {
          if(this__9274.bitmap === bit__9276) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__9274.bitmap ^ bit__9276, cljs.core.remove_pair.call(null, this__9274.arr, idx__9277))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9278)) {
        return new cljs.core.BitmapIndexedNode(null, this__9274.bitmap ^ bit__9276, cljs.core.remove_pair.call(null, this__9274.arr, idx__9277))
      }else {
        if("\ufdd0'else") {
          return inode__9275
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9281 = this;
  var inode__9282 = this;
  var bit__9283 = 1 << (hash >>> shift & 31);
  var idx__9284 = cljs.core.bitmap_indexed_node_index.call(null, this__9281.bitmap, bit__9283);
  if((this__9281.bitmap & bit__9283) === 0) {
    var n__9285 = cljs.core.bit_count.call(null, this__9281.bitmap);
    if(n__9285 >= 16) {
      var nodes__9286 = cljs.core.make_array.call(null, 32);
      var jdx__9287 = hash >>> shift & 31;
      nodes__9286[jdx__9287] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__9288 = 0;
      var j__9289 = 0;
      while(true) {
        if(i__9288 < 32) {
          if((this__9281.bitmap >>> i__9288 & 1) === 0) {
            var G__9304 = i__9288 + 1;
            var G__9305 = j__9289;
            i__9288 = G__9304;
            j__9289 = G__9305;
            continue
          }else {
            nodes__9286[i__9288] = !(this__9281.arr[j__9289] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__9281.arr[j__9289]), this__9281.arr[j__9289], this__9281.arr[j__9289 + 1], added_leaf_QMARK_) : this__9281.arr[j__9289 + 1];
            var G__9306 = i__9288 + 1;
            var G__9307 = j__9289 + 2;
            i__9288 = G__9306;
            j__9289 = G__9307;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__9285 + 1, nodes__9286)
    }else {
      var new_arr__9290 = cljs.core.make_array.call(null, 2 * (n__9285 + 1));
      cljs.core.array_copy.call(null, this__9281.arr, 0, new_arr__9290, 0, 2 * idx__9284);
      new_arr__9290[2 * idx__9284] = key;
      new_arr__9290[2 * idx__9284 + 1] = val;
      cljs.core.array_copy.call(null, this__9281.arr, 2 * idx__9284, new_arr__9290, 2 * (idx__9284 + 1), 2 * (n__9285 - idx__9284));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__9281.bitmap | bit__9283, new_arr__9290)
    }
  }else {
    var key_or_nil__9291 = this__9281.arr[2 * idx__9284];
    var val_or_node__9292 = this__9281.arr[2 * idx__9284 + 1];
    if(key_or_nil__9291 == null) {
      var n__9293 = val_or_node__9292.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9293 === val_or_node__9292) {
        return inode__9282
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__9281.bitmap, cljs.core.clone_and_set.call(null, this__9281.arr, 2 * idx__9284 + 1, n__9293))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9291)) {
        if(val === val_or_node__9292) {
          return inode__9282
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__9281.bitmap, cljs.core.clone_and_set.call(null, this__9281.arr, 2 * idx__9284 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__9281.bitmap, cljs.core.clone_and_set.call(null, this__9281.arr, 2 * idx__9284, null, 2 * idx__9284 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__9291, val_or_node__9292, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9294 = this;
  var inode__9295 = this;
  var bit__9296 = 1 << (hash >>> shift & 31);
  if((this__9294.bitmap & bit__9296) === 0) {
    return not_found
  }else {
    var idx__9297 = cljs.core.bitmap_indexed_node_index.call(null, this__9294.bitmap, bit__9296);
    var key_or_nil__9298 = this__9294.arr[2 * idx__9297];
    var val_or_node__9299 = this__9294.arr[2 * idx__9297 + 1];
    if(key_or_nil__9298 == null) {
      return val_or_node__9299.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9298)) {
        return val_or_node__9299
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
  var arr__9315 = array_node.arr;
  var len__9316 = 2 * (array_node.cnt - 1);
  var new_arr__9317 = cljs.core.make_array.call(null, len__9316);
  var i__9318 = 0;
  var j__9319 = 1;
  var bitmap__9320 = 0;
  while(true) {
    if(i__9318 < len__9316) {
      if(function() {
        var and__3822__auto____9321 = !(i__9318 === idx);
        if(and__3822__auto____9321) {
          return!(arr__9315[i__9318] == null)
        }else {
          return and__3822__auto____9321
        }
      }()) {
        new_arr__9317[j__9319] = arr__9315[i__9318];
        var G__9322 = i__9318 + 1;
        var G__9323 = j__9319 + 2;
        var G__9324 = bitmap__9320 | 1 << i__9318;
        i__9318 = G__9322;
        j__9319 = G__9323;
        bitmap__9320 = G__9324;
        continue
      }else {
        var G__9325 = i__9318 + 1;
        var G__9326 = j__9319;
        var G__9327 = bitmap__9320;
        i__9318 = G__9325;
        j__9319 = G__9326;
        bitmap__9320 = G__9327;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__9320, new_arr__9317)
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
  var this__9328 = this;
  var inode__9329 = this;
  var idx__9330 = hash >>> shift & 31;
  var node__9331 = this__9328.arr[idx__9330];
  if(node__9331 == null) {
    var editable__9332 = cljs.core.edit_and_set.call(null, inode__9329, edit, idx__9330, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__9332.cnt = editable__9332.cnt + 1;
    return editable__9332
  }else {
    var n__9333 = node__9331.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9333 === node__9331) {
      return inode__9329
    }else {
      return cljs.core.edit_and_set.call(null, inode__9329, edit, idx__9330, n__9333)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__9334 = this;
  var inode__9335 = this;
  return cljs.core.create_array_node_seq.call(null, this__9334.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9336 = this;
  var inode__9337 = this;
  var idx__9338 = hash >>> shift & 31;
  var node__9339 = this__9336.arr[idx__9338];
  if(node__9339 == null) {
    return inode__9337
  }else {
    var n__9340 = node__9339.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__9340 === node__9339) {
      return inode__9337
    }else {
      if(n__9340 == null) {
        if(this__9336.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9337, edit, idx__9338)
        }else {
          var editable__9341 = cljs.core.edit_and_set.call(null, inode__9337, edit, idx__9338, n__9340);
          editable__9341.cnt = editable__9341.cnt - 1;
          return editable__9341
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__9337, edit, idx__9338, n__9340)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__9342 = this;
  var inode__9343 = this;
  if(e === this__9342.edit) {
    return inode__9343
  }else {
    return new cljs.core.ArrayNode(e, this__9342.cnt, this__9342.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__9344 = this;
  var inode__9345 = this;
  var len__9346 = this__9344.arr.length;
  var i__9347 = 0;
  var init__9348 = init;
  while(true) {
    if(i__9347 < len__9346) {
      var node__9349 = this__9344.arr[i__9347];
      if(!(node__9349 == null)) {
        var init__9350 = node__9349.kv_reduce(f, init__9348);
        if(cljs.core.reduced_QMARK_.call(null, init__9350)) {
          return cljs.core.deref.call(null, init__9350)
        }else {
          var G__9369 = i__9347 + 1;
          var G__9370 = init__9350;
          i__9347 = G__9369;
          init__9348 = G__9370;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__9348
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9351 = this;
  var inode__9352 = this;
  var idx__9353 = hash >>> shift & 31;
  var node__9354 = this__9351.arr[idx__9353];
  if(!(node__9354 == null)) {
    return node__9354.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__9355 = this;
  var inode__9356 = this;
  var idx__9357 = hash >>> shift & 31;
  var node__9358 = this__9355.arr[idx__9357];
  if(!(node__9358 == null)) {
    var n__9359 = node__9358.inode_without(shift + 5, hash, key);
    if(n__9359 === node__9358) {
      return inode__9356
    }else {
      if(n__9359 == null) {
        if(this__9355.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9356, null, idx__9357)
        }else {
          return new cljs.core.ArrayNode(null, this__9355.cnt - 1, cljs.core.clone_and_set.call(null, this__9355.arr, idx__9357, n__9359))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__9355.cnt, cljs.core.clone_and_set.call(null, this__9355.arr, idx__9357, n__9359))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__9356
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9360 = this;
  var inode__9361 = this;
  var idx__9362 = hash >>> shift & 31;
  var node__9363 = this__9360.arr[idx__9362];
  if(node__9363 == null) {
    return new cljs.core.ArrayNode(null, this__9360.cnt + 1, cljs.core.clone_and_set.call(null, this__9360.arr, idx__9362, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__9364 = node__9363.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9364 === node__9363) {
      return inode__9361
    }else {
      return new cljs.core.ArrayNode(null, this__9360.cnt, cljs.core.clone_and_set.call(null, this__9360.arr, idx__9362, n__9364))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9365 = this;
  var inode__9366 = this;
  var idx__9367 = hash >>> shift & 31;
  var node__9368 = this__9365.arr[idx__9367];
  if(!(node__9368 == null)) {
    return node__9368.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__9373 = 2 * cnt;
  var i__9374 = 0;
  while(true) {
    if(i__9374 < lim__9373) {
      if(cljs.core.key_test.call(null, key, arr[i__9374])) {
        return i__9374
      }else {
        var G__9375 = i__9374 + 2;
        i__9374 = G__9375;
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
  var this__9376 = this;
  var inode__9377 = this;
  if(hash === this__9376.collision_hash) {
    var idx__9378 = cljs.core.hash_collision_node_find_index.call(null, this__9376.arr, this__9376.cnt, key);
    if(idx__9378 === -1) {
      if(this__9376.arr.length > 2 * this__9376.cnt) {
        var editable__9379 = cljs.core.edit_and_set.call(null, inode__9377, edit, 2 * this__9376.cnt, key, 2 * this__9376.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__9379.cnt = editable__9379.cnt + 1;
        return editable__9379
      }else {
        var len__9380 = this__9376.arr.length;
        var new_arr__9381 = cljs.core.make_array.call(null, len__9380 + 2);
        cljs.core.array_copy.call(null, this__9376.arr, 0, new_arr__9381, 0, len__9380);
        new_arr__9381[len__9380] = key;
        new_arr__9381[len__9380 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__9377.ensure_editable_array(edit, this__9376.cnt + 1, new_arr__9381)
      }
    }else {
      if(this__9376.arr[idx__9378 + 1] === val) {
        return inode__9377
      }else {
        return cljs.core.edit_and_set.call(null, inode__9377, edit, idx__9378 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__9376.collision_hash >>> shift & 31), [null, inode__9377, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__9382 = this;
  var inode__9383 = this;
  return cljs.core.create_inode_seq.call(null, this__9382.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9384 = this;
  var inode__9385 = this;
  var idx__9386 = cljs.core.hash_collision_node_find_index.call(null, this__9384.arr, this__9384.cnt, key);
  if(idx__9386 === -1) {
    return inode__9385
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__9384.cnt === 1) {
      return null
    }else {
      var editable__9387 = inode__9385.ensure_editable(edit);
      var earr__9388 = editable__9387.arr;
      earr__9388[idx__9386] = earr__9388[2 * this__9384.cnt - 2];
      earr__9388[idx__9386 + 1] = earr__9388[2 * this__9384.cnt - 1];
      earr__9388[2 * this__9384.cnt - 1] = null;
      earr__9388[2 * this__9384.cnt - 2] = null;
      editable__9387.cnt = editable__9387.cnt - 1;
      return editable__9387
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__9389 = this;
  var inode__9390 = this;
  if(e === this__9389.edit) {
    return inode__9390
  }else {
    var new_arr__9391 = cljs.core.make_array.call(null, 2 * (this__9389.cnt + 1));
    cljs.core.array_copy.call(null, this__9389.arr, 0, new_arr__9391, 0, 2 * this__9389.cnt);
    return new cljs.core.HashCollisionNode(e, this__9389.collision_hash, this__9389.cnt, new_arr__9391)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__9392 = this;
  var inode__9393 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9392.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9394 = this;
  var inode__9395 = this;
  var idx__9396 = cljs.core.hash_collision_node_find_index.call(null, this__9394.arr, this__9394.cnt, key);
  if(idx__9396 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9394.arr[idx__9396])) {
      return cljs.core.PersistentVector.fromArray([this__9394.arr[idx__9396], this__9394.arr[idx__9396 + 1]], true)
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
  var this__9397 = this;
  var inode__9398 = this;
  var idx__9399 = cljs.core.hash_collision_node_find_index.call(null, this__9397.arr, this__9397.cnt, key);
  if(idx__9399 === -1) {
    return inode__9398
  }else {
    if(this__9397.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__9397.collision_hash, this__9397.cnt - 1, cljs.core.remove_pair.call(null, this__9397.arr, cljs.core.quot.call(null, idx__9399, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9400 = this;
  var inode__9401 = this;
  if(hash === this__9400.collision_hash) {
    var idx__9402 = cljs.core.hash_collision_node_find_index.call(null, this__9400.arr, this__9400.cnt, key);
    if(idx__9402 === -1) {
      var len__9403 = this__9400.arr.length;
      var new_arr__9404 = cljs.core.make_array.call(null, len__9403 + 2);
      cljs.core.array_copy.call(null, this__9400.arr, 0, new_arr__9404, 0, len__9403);
      new_arr__9404[len__9403] = key;
      new_arr__9404[len__9403 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__9400.collision_hash, this__9400.cnt + 1, new_arr__9404)
    }else {
      if(cljs.core._EQ_.call(null, this__9400.arr[idx__9402], val)) {
        return inode__9401
      }else {
        return new cljs.core.HashCollisionNode(null, this__9400.collision_hash, this__9400.cnt, cljs.core.clone_and_set.call(null, this__9400.arr, idx__9402 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__9400.collision_hash >>> shift & 31), [null, inode__9401])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9405 = this;
  var inode__9406 = this;
  var idx__9407 = cljs.core.hash_collision_node_find_index.call(null, this__9405.arr, this__9405.cnt, key);
  if(idx__9407 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9405.arr[idx__9407])) {
      return this__9405.arr[idx__9407 + 1]
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
  var this__9408 = this;
  var inode__9409 = this;
  if(e === this__9408.edit) {
    this__9408.arr = array;
    this__9408.cnt = count;
    return inode__9409
  }else {
    return new cljs.core.HashCollisionNode(this__9408.edit, this__9408.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9414 = cljs.core.hash.call(null, key1);
    if(key1hash__9414 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9414, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9415 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__9414, key1, val1, added_leaf_QMARK___9415).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___9415)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9416 = cljs.core.hash.call(null, key1);
    if(key1hash__9416 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9416, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9417 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__9416, key1, val1, added_leaf_QMARK___9417).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___9417)
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
  var this__9418 = this;
  var h__2192__auto____9419 = this__9418.__hash;
  if(!(h__2192__auto____9419 == null)) {
    return h__2192__auto____9419
  }else {
    var h__2192__auto____9420 = cljs.core.hash_coll.call(null, coll);
    this__9418.__hash = h__2192__auto____9420;
    return h__2192__auto____9420
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9421 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__9422 = this;
  var this__9423 = this;
  return cljs.core.pr_str.call(null, this__9423)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9424 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9425 = this;
  if(this__9425.s == null) {
    return cljs.core.PersistentVector.fromArray([this__9425.nodes[this__9425.i], this__9425.nodes[this__9425.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__9425.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9426 = this;
  if(this__9426.s == null) {
    return cljs.core.create_inode_seq.call(null, this__9426.nodes, this__9426.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__9426.nodes, this__9426.i, cljs.core.next.call(null, this__9426.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9427 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9428 = this;
  return new cljs.core.NodeSeq(meta, this__9428.nodes, this__9428.i, this__9428.s, this__9428.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9429 = this;
  return this__9429.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9430 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9430.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__9437 = nodes.length;
      var j__9438 = i;
      while(true) {
        if(j__9438 < len__9437) {
          if(!(nodes[j__9438] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__9438, null, null)
          }else {
            var temp__3971__auto____9439 = nodes[j__9438 + 1];
            if(cljs.core.truth_(temp__3971__auto____9439)) {
              var node__9440 = temp__3971__auto____9439;
              var temp__3971__auto____9441 = node__9440.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____9441)) {
                var node_seq__9442 = temp__3971__auto____9441;
                return new cljs.core.NodeSeq(null, nodes, j__9438 + 2, node_seq__9442, null)
              }else {
                var G__9443 = j__9438 + 2;
                j__9438 = G__9443;
                continue
              }
            }else {
              var G__9444 = j__9438 + 2;
              j__9438 = G__9444;
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
  var this__9445 = this;
  var h__2192__auto____9446 = this__9445.__hash;
  if(!(h__2192__auto____9446 == null)) {
    return h__2192__auto____9446
  }else {
    var h__2192__auto____9447 = cljs.core.hash_coll.call(null, coll);
    this__9445.__hash = h__2192__auto____9447;
    return h__2192__auto____9447
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9448 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__9449 = this;
  var this__9450 = this;
  return cljs.core.pr_str.call(null, this__9450)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9451 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9452 = this;
  return cljs.core.first.call(null, this__9452.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9453 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__9453.nodes, this__9453.i, cljs.core.next.call(null, this__9453.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9454 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9455 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9455.nodes, this__9455.i, this__9455.s, this__9455.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9456 = this;
  return this__9456.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9457 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9457.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9464 = nodes.length;
      var j__9465 = i;
      while(true) {
        if(j__9465 < len__9464) {
          var temp__3971__auto____9466 = nodes[j__9465];
          if(cljs.core.truth_(temp__3971__auto____9466)) {
            var nj__9467 = temp__3971__auto____9466;
            var temp__3971__auto____9468 = nj__9467.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9468)) {
              var ns__9469 = temp__3971__auto____9468;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9465 + 1, ns__9469, null)
            }else {
              var G__9470 = j__9465 + 1;
              j__9465 = G__9470;
              continue
            }
          }else {
            var G__9471 = j__9465 + 1;
            j__9465 = G__9471;
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
  var this__9474 = this;
  return new cljs.core.TransientHashMap({}, this__9474.root, this__9474.cnt, this__9474.has_nil_QMARK_, this__9474.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9475 = this;
  var h__2192__auto____9476 = this__9475.__hash;
  if(!(h__2192__auto____9476 == null)) {
    return h__2192__auto____9476
  }else {
    var h__2192__auto____9477 = cljs.core.hash_imap.call(null, coll);
    this__9475.__hash = h__2192__auto____9477;
    return h__2192__auto____9477
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9478 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9479 = this;
  if(k == null) {
    if(this__9479.has_nil_QMARK_) {
      return this__9479.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9479.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9479.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9480 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9481 = this__9480.has_nil_QMARK_;
      if(and__3822__auto____9481) {
        return v === this__9480.nil_val
      }else {
        return and__3822__auto____9481
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9480.meta, this__9480.has_nil_QMARK_ ? this__9480.cnt : this__9480.cnt + 1, this__9480.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9482 = new cljs.core.Box(false);
    var new_root__9483 = (this__9480.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9480.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9482);
    if(new_root__9483 === this__9480.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9480.meta, added_leaf_QMARK___9482.val ? this__9480.cnt + 1 : this__9480.cnt, new_root__9483, this__9480.has_nil_QMARK_, this__9480.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9484 = this;
  if(k == null) {
    return this__9484.has_nil_QMARK_
  }else {
    if(this__9484.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9484.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9507 = null;
  var G__9507__2 = function(this_sym9485, k) {
    var this__9487 = this;
    var this_sym9485__9488 = this;
    var coll__9489 = this_sym9485__9488;
    return coll__9489.cljs$core$ILookup$_lookup$arity$2(coll__9489, k)
  };
  var G__9507__3 = function(this_sym9486, k, not_found) {
    var this__9487 = this;
    var this_sym9486__9490 = this;
    var coll__9491 = this_sym9486__9490;
    return coll__9491.cljs$core$ILookup$_lookup$arity$3(coll__9491, k, not_found)
  };
  G__9507 = function(this_sym9486, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9507__2.call(this, this_sym9486, k);
      case 3:
        return G__9507__3.call(this, this_sym9486, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9507
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9472, args9473) {
  var this__9492 = this;
  return this_sym9472.call.apply(this_sym9472, [this_sym9472].concat(args9473.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9493 = this;
  var init__9494 = this__9493.has_nil_QMARK_ ? f.call(null, init, null, this__9493.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9494)) {
    return cljs.core.deref.call(null, init__9494)
  }else {
    if(!(this__9493.root == null)) {
      return this__9493.root.kv_reduce(f, init__9494)
    }else {
      if("\ufdd0'else") {
        return init__9494
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9495 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9496 = this;
  var this__9497 = this;
  return cljs.core.pr_str.call(null, this__9497)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9498 = this;
  if(this__9498.cnt > 0) {
    var s__9499 = !(this__9498.root == null) ? this__9498.root.inode_seq() : null;
    if(this__9498.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9498.nil_val], true), s__9499)
    }else {
      return s__9499
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9500 = this;
  return this__9500.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9501 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9502 = this;
  return new cljs.core.PersistentHashMap(meta, this__9502.cnt, this__9502.root, this__9502.has_nil_QMARK_, this__9502.nil_val, this__9502.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9503 = this;
  return this__9503.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9504 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9504.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9505 = this;
  if(k == null) {
    if(this__9505.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9505.meta, this__9505.cnt - 1, this__9505.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9505.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9506 = this__9505.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9506 === this__9505.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9505.meta, this__9505.cnt - 1, new_root__9506, this__9505.has_nil_QMARK_, this__9505.nil_val, null)
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
  var len__9508 = ks.length;
  var i__9509 = 0;
  var out__9510 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9509 < len__9508) {
      var G__9511 = i__9509 + 1;
      var G__9512 = cljs.core.assoc_BANG_.call(null, out__9510, ks[i__9509], vs[i__9509]);
      i__9509 = G__9511;
      out__9510 = G__9512;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9510)
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
  var this__9513 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9514 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9515 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9516 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9517 = this;
  if(k == null) {
    if(this__9517.has_nil_QMARK_) {
      return this__9517.nil_val
    }else {
      return null
    }
  }else {
    if(this__9517.root == null) {
      return null
    }else {
      return this__9517.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9518 = this;
  if(k == null) {
    if(this__9518.has_nil_QMARK_) {
      return this__9518.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9518.root == null) {
      return not_found
    }else {
      return this__9518.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9519 = this;
  if(this__9519.edit) {
    return this__9519.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9520 = this;
  var tcoll__9521 = this;
  if(this__9520.edit) {
    if(function() {
      var G__9522__9523 = o;
      if(G__9522__9523) {
        if(function() {
          var or__3824__auto____9524 = G__9522__9523.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9524) {
            return or__3824__auto____9524
          }else {
            return G__9522__9523.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9522__9523.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9522__9523)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9522__9523)
      }
    }()) {
      return tcoll__9521.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9525 = cljs.core.seq.call(null, o);
      var tcoll__9526 = tcoll__9521;
      while(true) {
        var temp__3971__auto____9527 = cljs.core.first.call(null, es__9525);
        if(cljs.core.truth_(temp__3971__auto____9527)) {
          var e__9528 = temp__3971__auto____9527;
          var G__9539 = cljs.core.next.call(null, es__9525);
          var G__9540 = tcoll__9526.assoc_BANG_(cljs.core.key.call(null, e__9528), cljs.core.val.call(null, e__9528));
          es__9525 = G__9539;
          tcoll__9526 = G__9540;
          continue
        }else {
          return tcoll__9526
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9529 = this;
  var tcoll__9530 = this;
  if(this__9529.edit) {
    if(k == null) {
      if(this__9529.nil_val === v) {
      }else {
        this__9529.nil_val = v
      }
      if(this__9529.has_nil_QMARK_) {
      }else {
        this__9529.count = this__9529.count + 1;
        this__9529.has_nil_QMARK_ = true
      }
      return tcoll__9530
    }else {
      var added_leaf_QMARK___9531 = new cljs.core.Box(false);
      var node__9532 = (this__9529.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9529.root).inode_assoc_BANG_(this__9529.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9531);
      if(node__9532 === this__9529.root) {
      }else {
        this__9529.root = node__9532
      }
      if(added_leaf_QMARK___9531.val) {
        this__9529.count = this__9529.count + 1
      }else {
      }
      return tcoll__9530
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9533 = this;
  var tcoll__9534 = this;
  if(this__9533.edit) {
    if(k == null) {
      if(this__9533.has_nil_QMARK_) {
        this__9533.has_nil_QMARK_ = false;
        this__9533.nil_val = null;
        this__9533.count = this__9533.count - 1;
        return tcoll__9534
      }else {
        return tcoll__9534
      }
    }else {
      if(this__9533.root == null) {
        return tcoll__9534
      }else {
        var removed_leaf_QMARK___9535 = new cljs.core.Box(false);
        var node__9536 = this__9533.root.inode_without_BANG_(this__9533.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9535);
        if(node__9536 === this__9533.root) {
        }else {
          this__9533.root = node__9536
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9535[0])) {
          this__9533.count = this__9533.count - 1
        }else {
        }
        return tcoll__9534
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9537 = this;
  var tcoll__9538 = this;
  if(this__9537.edit) {
    this__9537.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9537.count, this__9537.root, this__9537.has_nil_QMARK_, this__9537.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9543 = node;
  var stack__9544 = stack;
  while(true) {
    if(!(t__9543 == null)) {
      var G__9545 = ascending_QMARK_ ? t__9543.left : t__9543.right;
      var G__9546 = cljs.core.conj.call(null, stack__9544, t__9543);
      t__9543 = G__9545;
      stack__9544 = G__9546;
      continue
    }else {
      return stack__9544
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
  var this__9547 = this;
  var h__2192__auto____9548 = this__9547.__hash;
  if(!(h__2192__auto____9548 == null)) {
    return h__2192__auto____9548
  }else {
    var h__2192__auto____9549 = cljs.core.hash_coll.call(null, coll);
    this__9547.__hash = h__2192__auto____9549;
    return h__2192__auto____9549
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9550 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9551 = this;
  var this__9552 = this;
  return cljs.core.pr_str.call(null, this__9552)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9553 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9554 = this;
  if(this__9554.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9554.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9555 = this;
  return cljs.core.peek.call(null, this__9555.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9556 = this;
  var t__9557 = cljs.core.first.call(null, this__9556.stack);
  var next_stack__9558 = cljs.core.tree_map_seq_push.call(null, this__9556.ascending_QMARK_ ? t__9557.right : t__9557.left, cljs.core.next.call(null, this__9556.stack), this__9556.ascending_QMARK_);
  if(!(next_stack__9558 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9558, this__9556.ascending_QMARK_, this__9556.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9559 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9560 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9560.stack, this__9560.ascending_QMARK_, this__9560.cnt, this__9560.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9561 = this;
  return this__9561.meta
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
        var and__3822__auto____9563 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9563) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9563
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
        var and__3822__auto____9565 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9565) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9565
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
  var init__9569 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9569)) {
    return cljs.core.deref.call(null, init__9569)
  }else {
    var init__9570 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9569) : init__9569;
    if(cljs.core.reduced_QMARK_.call(null, init__9570)) {
      return cljs.core.deref.call(null, init__9570)
    }else {
      var init__9571 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9570) : init__9570;
      if(cljs.core.reduced_QMARK_.call(null, init__9571)) {
        return cljs.core.deref.call(null, init__9571)
      }else {
        return init__9571
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
  var this__9574 = this;
  var h__2192__auto____9575 = this__9574.__hash;
  if(!(h__2192__auto____9575 == null)) {
    return h__2192__auto____9575
  }else {
    var h__2192__auto____9576 = cljs.core.hash_coll.call(null, coll);
    this__9574.__hash = h__2192__auto____9576;
    return h__2192__auto____9576
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9577 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9578 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9579 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9579.key, this__9579.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9627 = null;
  var G__9627__2 = function(this_sym9580, k) {
    var this__9582 = this;
    var this_sym9580__9583 = this;
    var node__9584 = this_sym9580__9583;
    return node__9584.cljs$core$ILookup$_lookup$arity$2(node__9584, k)
  };
  var G__9627__3 = function(this_sym9581, k, not_found) {
    var this__9582 = this;
    var this_sym9581__9585 = this;
    var node__9586 = this_sym9581__9585;
    return node__9586.cljs$core$ILookup$_lookup$arity$3(node__9586, k, not_found)
  };
  G__9627 = function(this_sym9581, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9627__2.call(this, this_sym9581, k);
      case 3:
        return G__9627__3.call(this, this_sym9581, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9627
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9572, args9573) {
  var this__9587 = this;
  return this_sym9572.call.apply(this_sym9572, [this_sym9572].concat(args9573.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9588 = this;
  return cljs.core.PersistentVector.fromArray([this__9588.key, this__9588.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9589 = this;
  return this__9589.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9590 = this;
  return this__9590.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9591 = this;
  var node__9592 = this;
  return ins.balance_right(node__9592)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9593 = this;
  var node__9594 = this;
  return new cljs.core.RedNode(this__9593.key, this__9593.val, this__9593.left, this__9593.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9595 = this;
  var node__9596 = this;
  return cljs.core.balance_right_del.call(null, this__9595.key, this__9595.val, this__9595.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9597 = this;
  var node__9598 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9599 = this;
  var node__9600 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9600, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9601 = this;
  var node__9602 = this;
  return cljs.core.balance_left_del.call(null, this__9601.key, this__9601.val, del, this__9601.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9603 = this;
  var node__9604 = this;
  return ins.balance_left(node__9604)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9605 = this;
  var node__9606 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9606, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9628 = null;
  var G__9628__0 = function() {
    var this__9607 = this;
    var this__9609 = this;
    return cljs.core.pr_str.call(null, this__9609)
  };
  G__9628 = function() {
    switch(arguments.length) {
      case 0:
        return G__9628__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9628
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9610 = this;
  var node__9611 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9611, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9612 = this;
  var node__9613 = this;
  return node__9613
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9614 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9615 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9616 = this;
  return cljs.core.list.call(null, this__9616.key, this__9616.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9617 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9618 = this;
  return this__9618.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9619 = this;
  return cljs.core.PersistentVector.fromArray([this__9619.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9620 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9620.key, this__9620.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9621 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9622 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9622.key, this__9622.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9623 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9624 = this;
  if(n === 0) {
    return this__9624.key
  }else {
    if(n === 1) {
      return this__9624.val
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
  var this__9625 = this;
  if(n === 0) {
    return this__9625.key
  }else {
    if(n === 1) {
      return this__9625.val
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
  var this__9626 = this;
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
  var this__9631 = this;
  var h__2192__auto____9632 = this__9631.__hash;
  if(!(h__2192__auto____9632 == null)) {
    return h__2192__auto____9632
  }else {
    var h__2192__auto____9633 = cljs.core.hash_coll.call(null, coll);
    this__9631.__hash = h__2192__auto____9633;
    return h__2192__auto____9633
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9634 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9635 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9636 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9636.key, this__9636.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9684 = null;
  var G__9684__2 = function(this_sym9637, k) {
    var this__9639 = this;
    var this_sym9637__9640 = this;
    var node__9641 = this_sym9637__9640;
    return node__9641.cljs$core$ILookup$_lookup$arity$2(node__9641, k)
  };
  var G__9684__3 = function(this_sym9638, k, not_found) {
    var this__9639 = this;
    var this_sym9638__9642 = this;
    var node__9643 = this_sym9638__9642;
    return node__9643.cljs$core$ILookup$_lookup$arity$3(node__9643, k, not_found)
  };
  G__9684 = function(this_sym9638, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9684__2.call(this, this_sym9638, k);
      case 3:
        return G__9684__3.call(this, this_sym9638, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9684
}();
cljs.core.RedNode.prototype.apply = function(this_sym9629, args9630) {
  var this__9644 = this;
  return this_sym9629.call.apply(this_sym9629, [this_sym9629].concat(args9630.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9645 = this;
  return cljs.core.PersistentVector.fromArray([this__9645.key, this__9645.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9646 = this;
  return this__9646.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9647 = this;
  return this__9647.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9648 = this;
  var node__9649 = this;
  return new cljs.core.RedNode(this__9648.key, this__9648.val, this__9648.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9650 = this;
  var node__9651 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9652 = this;
  var node__9653 = this;
  return new cljs.core.RedNode(this__9652.key, this__9652.val, this__9652.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9654 = this;
  var node__9655 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9656 = this;
  var node__9657 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9657, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9658 = this;
  var node__9659 = this;
  return new cljs.core.RedNode(this__9658.key, this__9658.val, del, this__9658.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9660 = this;
  var node__9661 = this;
  return new cljs.core.RedNode(this__9660.key, this__9660.val, ins, this__9660.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9662 = this;
  var node__9663 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9662.left)) {
    return new cljs.core.RedNode(this__9662.key, this__9662.val, this__9662.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9662.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9662.right)) {
      return new cljs.core.RedNode(this__9662.right.key, this__9662.right.val, new cljs.core.BlackNode(this__9662.key, this__9662.val, this__9662.left, this__9662.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9662.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9663, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9685 = null;
  var G__9685__0 = function() {
    var this__9664 = this;
    var this__9666 = this;
    return cljs.core.pr_str.call(null, this__9666)
  };
  G__9685 = function() {
    switch(arguments.length) {
      case 0:
        return G__9685__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9685
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9667 = this;
  var node__9668 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9667.right)) {
    return new cljs.core.RedNode(this__9667.key, this__9667.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9667.left, null), this__9667.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9667.left)) {
      return new cljs.core.RedNode(this__9667.left.key, this__9667.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9667.left.left, null), new cljs.core.BlackNode(this__9667.key, this__9667.val, this__9667.left.right, this__9667.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9668, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9669 = this;
  var node__9670 = this;
  return new cljs.core.BlackNode(this__9669.key, this__9669.val, this__9669.left, this__9669.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9671 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9672 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9673 = this;
  return cljs.core.list.call(null, this__9673.key, this__9673.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9674 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9675 = this;
  return this__9675.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9676 = this;
  return cljs.core.PersistentVector.fromArray([this__9676.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9677 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9677.key, this__9677.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9678 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9679 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9679.key, this__9679.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9680 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9681 = this;
  if(n === 0) {
    return this__9681.key
  }else {
    if(n === 1) {
      return this__9681.val
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
  var this__9682 = this;
  if(n === 0) {
    return this__9682.key
  }else {
    if(n === 1) {
      return this__9682.val
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
  var this__9683 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9689 = comp.call(null, k, tree.key);
    if(c__9689 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9689 < 0) {
        var ins__9690 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9690 == null)) {
          return tree.add_left(ins__9690)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9691 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9691 == null)) {
            return tree.add_right(ins__9691)
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
          var app__9694 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9694)) {
            return new cljs.core.RedNode(app__9694.key, app__9694.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9694.left, null), new cljs.core.RedNode(right.key, right.val, app__9694.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9694, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9695 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9695)) {
              return new cljs.core.RedNode(app__9695.key, app__9695.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9695.left, null), new cljs.core.BlackNode(right.key, right.val, app__9695.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9695, right.right, null))
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
    var c__9701 = comp.call(null, k, tree.key);
    if(c__9701 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9701 < 0) {
        var del__9702 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9703 = !(del__9702 == null);
          if(or__3824__auto____9703) {
            return or__3824__auto____9703
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9702, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9702, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9704 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9705 = !(del__9704 == null);
            if(or__3824__auto____9705) {
              return or__3824__auto____9705
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9704)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9704, null)
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
  var tk__9708 = tree.key;
  var c__9709 = comp.call(null, k, tk__9708);
  if(c__9709 === 0) {
    return tree.replace(tk__9708, v, tree.left, tree.right)
  }else {
    if(c__9709 < 0) {
      return tree.replace(tk__9708, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9708, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__9712 = this;
  var h__2192__auto____9713 = this__9712.__hash;
  if(!(h__2192__auto____9713 == null)) {
    return h__2192__auto____9713
  }else {
    var h__2192__auto____9714 = cljs.core.hash_imap.call(null, coll);
    this__9712.__hash = h__2192__auto____9714;
    return h__2192__auto____9714
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9715 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9716 = this;
  var n__9717 = coll.entry_at(k);
  if(!(n__9717 == null)) {
    return n__9717.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9718 = this;
  var found__9719 = [null];
  var t__9720 = cljs.core.tree_map_add.call(null, this__9718.comp, this__9718.tree, k, v, found__9719);
  if(t__9720 == null) {
    var found_node__9721 = cljs.core.nth.call(null, found__9719, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9721.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9718.comp, cljs.core.tree_map_replace.call(null, this__9718.comp, this__9718.tree, k, v), this__9718.cnt, this__9718.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9718.comp, t__9720.blacken(), this__9718.cnt + 1, this__9718.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9722 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9756 = null;
  var G__9756__2 = function(this_sym9723, k) {
    var this__9725 = this;
    var this_sym9723__9726 = this;
    var coll__9727 = this_sym9723__9726;
    return coll__9727.cljs$core$ILookup$_lookup$arity$2(coll__9727, k)
  };
  var G__9756__3 = function(this_sym9724, k, not_found) {
    var this__9725 = this;
    var this_sym9724__9728 = this;
    var coll__9729 = this_sym9724__9728;
    return coll__9729.cljs$core$ILookup$_lookup$arity$3(coll__9729, k, not_found)
  };
  G__9756 = function(this_sym9724, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9756__2.call(this, this_sym9724, k);
      case 3:
        return G__9756__3.call(this, this_sym9724, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9756
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9710, args9711) {
  var this__9730 = this;
  return this_sym9710.call.apply(this_sym9710, [this_sym9710].concat(args9711.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9731 = this;
  if(!(this__9731.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9731.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9732 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9733 = this;
  if(this__9733.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9733.tree, false, this__9733.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9734 = this;
  var this__9735 = this;
  return cljs.core.pr_str.call(null, this__9735)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9736 = this;
  var coll__9737 = this;
  var t__9738 = this__9736.tree;
  while(true) {
    if(!(t__9738 == null)) {
      var c__9739 = this__9736.comp.call(null, k, t__9738.key);
      if(c__9739 === 0) {
        return t__9738
      }else {
        if(c__9739 < 0) {
          var G__9757 = t__9738.left;
          t__9738 = G__9757;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9758 = t__9738.right;
            t__9738 = G__9758;
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
  var this__9740 = this;
  if(this__9740.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9740.tree, ascending_QMARK_, this__9740.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9741 = this;
  if(this__9741.cnt > 0) {
    var stack__9742 = null;
    var t__9743 = this__9741.tree;
    while(true) {
      if(!(t__9743 == null)) {
        var c__9744 = this__9741.comp.call(null, k, t__9743.key);
        if(c__9744 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9742, t__9743), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9744 < 0) {
              var G__9759 = cljs.core.conj.call(null, stack__9742, t__9743);
              var G__9760 = t__9743.left;
              stack__9742 = G__9759;
              t__9743 = G__9760;
              continue
            }else {
              var G__9761 = stack__9742;
              var G__9762 = t__9743.right;
              stack__9742 = G__9761;
              t__9743 = G__9762;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9744 > 0) {
                var G__9763 = cljs.core.conj.call(null, stack__9742, t__9743);
                var G__9764 = t__9743.right;
                stack__9742 = G__9763;
                t__9743 = G__9764;
                continue
              }else {
                var G__9765 = stack__9742;
                var G__9766 = t__9743.left;
                stack__9742 = G__9765;
                t__9743 = G__9766;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9742 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9742, ascending_QMARK_, -1, null)
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
  var this__9745 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9746 = this;
  return this__9746.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9747 = this;
  if(this__9747.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9747.tree, true, this__9747.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9748 = this;
  return this__9748.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9749 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9750 = this;
  return new cljs.core.PersistentTreeMap(this__9750.comp, this__9750.tree, this__9750.cnt, meta, this__9750.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9751 = this;
  return this__9751.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9752 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9752.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9753 = this;
  var found__9754 = [null];
  var t__9755 = cljs.core.tree_map_remove.call(null, this__9753.comp, this__9753.tree, k, found__9754);
  if(t__9755 == null) {
    if(cljs.core.nth.call(null, found__9754, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9753.comp, null, 0, this__9753.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9753.comp, t__9755.blacken(), this__9753.cnt - 1, this__9753.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9769 = cljs.core.seq.call(null, keyvals);
    var out__9770 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9769) {
        var G__9771 = cljs.core.nnext.call(null, in__9769);
        var G__9772 = cljs.core.assoc_BANG_.call(null, out__9770, cljs.core.first.call(null, in__9769), cljs.core.second.call(null, in__9769));
        in__9769 = G__9771;
        out__9770 = G__9772;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9770)
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
  hash_map.cljs$lang$applyTo = function(arglist__9773) {
    var keyvals = cljs.core.seq(arglist__9773);
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
  array_map.cljs$lang$applyTo = function(arglist__9774) {
    var keyvals = cljs.core.seq(arglist__9774);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9778 = [];
    var obj__9779 = {};
    var kvs__9780 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9780) {
        ks__9778.push(cljs.core.first.call(null, kvs__9780));
        obj__9779[cljs.core.first.call(null, kvs__9780)] = cljs.core.second.call(null, kvs__9780);
        var G__9781 = cljs.core.nnext.call(null, kvs__9780);
        kvs__9780 = G__9781;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9778, obj__9779)
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
  obj_map.cljs$lang$applyTo = function(arglist__9782) {
    var keyvals = cljs.core.seq(arglist__9782);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9785 = cljs.core.seq.call(null, keyvals);
    var out__9786 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9785) {
        var G__9787 = cljs.core.nnext.call(null, in__9785);
        var G__9788 = cljs.core.assoc.call(null, out__9786, cljs.core.first.call(null, in__9785), cljs.core.second.call(null, in__9785));
        in__9785 = G__9787;
        out__9786 = G__9788;
        continue
      }else {
        return out__9786
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
  sorted_map.cljs$lang$applyTo = function(arglist__9789) {
    var keyvals = cljs.core.seq(arglist__9789);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9792 = cljs.core.seq.call(null, keyvals);
    var out__9793 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9792) {
        var G__9794 = cljs.core.nnext.call(null, in__9792);
        var G__9795 = cljs.core.assoc.call(null, out__9793, cljs.core.first.call(null, in__9792), cljs.core.second.call(null, in__9792));
        in__9792 = G__9794;
        out__9793 = G__9795;
        continue
      }else {
        return out__9793
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__9796) {
    var comparator = cljs.core.first(arglist__9796);
    var keyvals = cljs.core.rest(arglist__9796);
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
      return cljs.core.reduce.call(null, function(p1__9797_SHARP_, p2__9798_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9800 = p1__9797_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9800)) {
            return or__3824__auto____9800
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9798_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__9801) {
    var maps = cljs.core.seq(arglist__9801);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9809 = function(m, e) {
        var k__9807 = cljs.core.first.call(null, e);
        var v__9808 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9807)) {
          return cljs.core.assoc.call(null, m, k__9807, f.call(null, cljs.core._lookup.call(null, m, k__9807, null), v__9808))
        }else {
          return cljs.core.assoc.call(null, m, k__9807, v__9808)
        }
      };
      var merge2__9811 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9809, function() {
          var or__3824__auto____9810 = m1;
          if(cljs.core.truth_(or__3824__auto____9810)) {
            return or__3824__auto____9810
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9811, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__9812) {
    var f = cljs.core.first(arglist__9812);
    var maps = cljs.core.rest(arglist__9812);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9817 = cljs.core.ObjMap.EMPTY;
  var keys__9818 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9818) {
      var key__9819 = cljs.core.first.call(null, keys__9818);
      var entry__9820 = cljs.core._lookup.call(null, map, key__9819, "\ufdd0'cljs.core/not-found");
      var G__9821 = cljs.core.not_EQ_.call(null, entry__9820, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9817, key__9819, entry__9820) : ret__9817;
      var G__9822 = cljs.core.next.call(null, keys__9818);
      ret__9817 = G__9821;
      keys__9818 = G__9822;
      continue
    }else {
      return ret__9817
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
  var this__9826 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9826.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9827 = this;
  var h__2192__auto____9828 = this__9827.__hash;
  if(!(h__2192__auto____9828 == null)) {
    return h__2192__auto____9828
  }else {
    var h__2192__auto____9829 = cljs.core.hash_iset.call(null, coll);
    this__9827.__hash = h__2192__auto____9829;
    return h__2192__auto____9829
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9830 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9831 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9831.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9852 = null;
  var G__9852__2 = function(this_sym9832, k) {
    var this__9834 = this;
    var this_sym9832__9835 = this;
    var coll__9836 = this_sym9832__9835;
    return coll__9836.cljs$core$ILookup$_lookup$arity$2(coll__9836, k)
  };
  var G__9852__3 = function(this_sym9833, k, not_found) {
    var this__9834 = this;
    var this_sym9833__9837 = this;
    var coll__9838 = this_sym9833__9837;
    return coll__9838.cljs$core$ILookup$_lookup$arity$3(coll__9838, k, not_found)
  };
  G__9852 = function(this_sym9833, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9852__2.call(this, this_sym9833, k);
      case 3:
        return G__9852__3.call(this, this_sym9833, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9852
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9824, args9825) {
  var this__9839 = this;
  return this_sym9824.call.apply(this_sym9824, [this_sym9824].concat(args9825.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9840 = this;
  return new cljs.core.PersistentHashSet(this__9840.meta, cljs.core.assoc.call(null, this__9840.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9841 = this;
  var this__9842 = this;
  return cljs.core.pr_str.call(null, this__9842)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9843 = this;
  return cljs.core.keys.call(null, this__9843.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9844 = this;
  return new cljs.core.PersistentHashSet(this__9844.meta, cljs.core.dissoc.call(null, this__9844.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9845 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9846 = this;
  var and__3822__auto____9847 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9847) {
    var and__3822__auto____9848 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9848) {
      return cljs.core.every_QMARK_.call(null, function(p1__9823_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9823_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9848
    }
  }else {
    return and__3822__auto____9847
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9849 = this;
  return new cljs.core.PersistentHashSet(meta, this__9849.hash_map, this__9849.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9850 = this;
  return this__9850.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9851 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9851.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9853 = cljs.core.count.call(null, items);
  var i__9854 = 0;
  var out__9855 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9854 < len__9853) {
      var G__9856 = i__9854 + 1;
      var G__9857 = cljs.core.conj_BANG_.call(null, out__9855, items[i__9854]);
      i__9854 = G__9856;
      out__9855 = G__9857;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9855)
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
  var G__9875 = null;
  var G__9875__2 = function(this_sym9861, k) {
    var this__9863 = this;
    var this_sym9861__9864 = this;
    var tcoll__9865 = this_sym9861__9864;
    if(cljs.core._lookup.call(null, this__9863.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9875__3 = function(this_sym9862, k, not_found) {
    var this__9863 = this;
    var this_sym9862__9866 = this;
    var tcoll__9867 = this_sym9862__9866;
    if(cljs.core._lookup.call(null, this__9863.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9875 = function(this_sym9862, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9875__2.call(this, this_sym9862, k);
      case 3:
        return G__9875__3.call(this, this_sym9862, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9875
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9859, args9860) {
  var this__9868 = this;
  return this_sym9859.call.apply(this_sym9859, [this_sym9859].concat(args9860.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9869 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9870 = this;
  if(cljs.core._lookup.call(null, this__9870.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9871 = this;
  return cljs.core.count.call(null, this__9871.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9872 = this;
  this__9872.transient_map = cljs.core.dissoc_BANG_.call(null, this__9872.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9873 = this;
  this__9873.transient_map = cljs.core.assoc_BANG_.call(null, this__9873.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9874 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9874.transient_map), null)
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
  var this__9878 = this;
  var h__2192__auto____9879 = this__9878.__hash;
  if(!(h__2192__auto____9879 == null)) {
    return h__2192__auto____9879
  }else {
    var h__2192__auto____9880 = cljs.core.hash_iset.call(null, coll);
    this__9878.__hash = h__2192__auto____9880;
    return h__2192__auto____9880
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9881 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9882 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9882.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9908 = null;
  var G__9908__2 = function(this_sym9883, k) {
    var this__9885 = this;
    var this_sym9883__9886 = this;
    var coll__9887 = this_sym9883__9886;
    return coll__9887.cljs$core$ILookup$_lookup$arity$2(coll__9887, k)
  };
  var G__9908__3 = function(this_sym9884, k, not_found) {
    var this__9885 = this;
    var this_sym9884__9888 = this;
    var coll__9889 = this_sym9884__9888;
    return coll__9889.cljs$core$ILookup$_lookup$arity$3(coll__9889, k, not_found)
  };
  G__9908 = function(this_sym9884, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9908__2.call(this, this_sym9884, k);
      case 3:
        return G__9908__3.call(this, this_sym9884, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9908
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9876, args9877) {
  var this__9890 = this;
  return this_sym9876.call.apply(this_sym9876, [this_sym9876].concat(args9877.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9891 = this;
  return new cljs.core.PersistentTreeSet(this__9891.meta, cljs.core.assoc.call(null, this__9891.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9892 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9892.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9893 = this;
  var this__9894 = this;
  return cljs.core.pr_str.call(null, this__9894)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9895 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9895.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9896 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9896.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9897 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9898 = this;
  return cljs.core._comparator.call(null, this__9898.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9899 = this;
  return cljs.core.keys.call(null, this__9899.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9900 = this;
  return new cljs.core.PersistentTreeSet(this__9900.meta, cljs.core.dissoc.call(null, this__9900.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9901 = this;
  return cljs.core.count.call(null, this__9901.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9902 = this;
  var and__3822__auto____9903 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9903) {
    var and__3822__auto____9904 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9904) {
      return cljs.core.every_QMARK_.call(null, function(p1__9858_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9858_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9904
    }
  }else {
    return and__3822__auto____9903
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9905 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9905.tree_map, this__9905.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9906 = this;
  return this__9906.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9907 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9907.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9913__delegate = function(keys) {
      var in__9911 = cljs.core.seq.call(null, keys);
      var out__9912 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9911)) {
          var G__9914 = cljs.core.next.call(null, in__9911);
          var G__9915 = cljs.core.conj_BANG_.call(null, out__9912, cljs.core.first.call(null, in__9911));
          in__9911 = G__9914;
          out__9912 = G__9915;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9912)
        }
        break
      }
    };
    var G__9913 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9913__delegate.call(this, keys)
    };
    G__9913.cljs$lang$maxFixedArity = 0;
    G__9913.cljs$lang$applyTo = function(arglist__9916) {
      var keys = cljs.core.seq(arglist__9916);
      return G__9913__delegate(keys)
    };
    G__9913.cljs$lang$arity$variadic = G__9913__delegate;
    return G__9913
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
  sorted_set.cljs$lang$applyTo = function(arglist__9917) {
    var keys = cljs.core.seq(arglist__9917);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__9919) {
    var comparator = cljs.core.first(arglist__9919);
    var keys = cljs.core.rest(arglist__9919);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9925 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9926 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9926)) {
        var e__9927 = temp__3971__auto____9926;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9927))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9925, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9918_SHARP_) {
      var temp__3971__auto____9928 = cljs.core.find.call(null, smap, p1__9918_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9928)) {
        var e__9929 = temp__3971__auto____9928;
        return cljs.core.second.call(null, e__9929)
      }else {
        return p1__9918_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9959 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9952, seen) {
        while(true) {
          var vec__9953__9954 = p__9952;
          var f__9955 = cljs.core.nth.call(null, vec__9953__9954, 0, null);
          var xs__9956 = vec__9953__9954;
          var temp__3974__auto____9957 = cljs.core.seq.call(null, xs__9956);
          if(temp__3974__auto____9957) {
            var s__9958 = temp__3974__auto____9957;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9955)) {
              var G__9960 = cljs.core.rest.call(null, s__9958);
              var G__9961 = seen;
              p__9952 = G__9960;
              seen = G__9961;
              continue
            }else {
              return cljs.core.cons.call(null, f__9955, step.call(null, cljs.core.rest.call(null, s__9958), cljs.core.conj.call(null, seen, f__9955)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9959.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9964 = cljs.core.PersistentVector.EMPTY;
  var s__9965 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9965)) {
      var G__9966 = cljs.core.conj.call(null, ret__9964, cljs.core.first.call(null, s__9965));
      var G__9967 = cljs.core.next.call(null, s__9965);
      ret__9964 = G__9966;
      s__9965 = G__9967;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9964)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9970 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9970) {
        return or__3824__auto____9970
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9971 = x.lastIndexOf("/");
      if(i__9971 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9971 + 1)
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
    var or__3824__auto____9974 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9974) {
      return or__3824__auto____9974
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9975 = x.lastIndexOf("/");
    if(i__9975 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9975)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9982 = cljs.core.ObjMap.EMPTY;
  var ks__9983 = cljs.core.seq.call(null, keys);
  var vs__9984 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9985 = ks__9983;
      if(and__3822__auto____9985) {
        return vs__9984
      }else {
        return and__3822__auto____9985
      }
    }()) {
      var G__9986 = cljs.core.assoc.call(null, map__9982, cljs.core.first.call(null, ks__9983), cljs.core.first.call(null, vs__9984));
      var G__9987 = cljs.core.next.call(null, ks__9983);
      var G__9988 = cljs.core.next.call(null, vs__9984);
      map__9982 = G__9986;
      ks__9983 = G__9987;
      vs__9984 = G__9988;
      continue
    }else {
      return map__9982
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
    var G__9991__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9976_SHARP_, p2__9977_SHARP_) {
        return max_key.call(null, k, p1__9976_SHARP_, p2__9977_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9991 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9991__delegate.call(this, k, x, y, more)
    };
    G__9991.cljs$lang$maxFixedArity = 3;
    G__9991.cljs$lang$applyTo = function(arglist__9992) {
      var k = cljs.core.first(arglist__9992);
      var x = cljs.core.first(cljs.core.next(arglist__9992));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9992)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9992)));
      return G__9991__delegate(k, x, y, more)
    };
    G__9991.cljs$lang$arity$variadic = G__9991__delegate;
    return G__9991
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
    var G__9993__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9989_SHARP_, p2__9990_SHARP_) {
        return min_key.call(null, k, p1__9989_SHARP_, p2__9990_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9993 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9993__delegate.call(this, k, x, y, more)
    };
    G__9993.cljs$lang$maxFixedArity = 3;
    G__9993.cljs$lang$applyTo = function(arglist__9994) {
      var k = cljs.core.first(arglist__9994);
      var x = cljs.core.first(cljs.core.next(arglist__9994));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9994)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9994)));
      return G__9993__delegate(k, x, y, more)
    };
    G__9993.cljs$lang$arity$variadic = G__9993__delegate;
    return G__9993
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
      var temp__3974__auto____9997 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9997) {
        var s__9998 = temp__3974__auto____9997;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9998), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9998)))
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
    var temp__3974__auto____10001 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10001) {
      var s__10002 = temp__3974__auto____10001;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__10002)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__10002), take_while.call(null, pred, cljs.core.rest.call(null, s__10002)))
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
    var comp__10004 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__10004.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__10016 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____10017 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____10017)) {
        var vec__10018__10019 = temp__3974__auto____10017;
        var e__10020 = cljs.core.nth.call(null, vec__10018__10019, 0, null);
        var s__10021 = vec__10018__10019;
        if(cljs.core.truth_(include__10016.call(null, e__10020))) {
          return s__10021
        }else {
          return cljs.core.next.call(null, s__10021)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10016, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10022 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____10022)) {
      var vec__10023__10024 = temp__3974__auto____10022;
      var e__10025 = cljs.core.nth.call(null, vec__10023__10024, 0, null);
      var s__10026 = vec__10023__10024;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__10025)) ? s__10026 : cljs.core.next.call(null, s__10026))
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
    var include__10038 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____10039 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____10039)) {
        var vec__10040__10041 = temp__3974__auto____10039;
        var e__10042 = cljs.core.nth.call(null, vec__10040__10041, 0, null);
        var s__10043 = vec__10040__10041;
        if(cljs.core.truth_(include__10038.call(null, e__10042))) {
          return s__10043
        }else {
          return cljs.core.next.call(null, s__10043)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10038, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10044 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____10044)) {
      var vec__10045__10046 = temp__3974__auto____10044;
      var e__10047 = cljs.core.nth.call(null, vec__10045__10046, 0, null);
      var s__10048 = vec__10045__10046;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__10047)) ? s__10048 : cljs.core.next.call(null, s__10048))
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
  var this__10049 = this;
  var h__2192__auto____10050 = this__10049.__hash;
  if(!(h__2192__auto____10050 == null)) {
    return h__2192__auto____10050
  }else {
    var h__2192__auto____10051 = cljs.core.hash_coll.call(null, rng);
    this__10049.__hash = h__2192__auto____10051;
    return h__2192__auto____10051
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__10052 = this;
  if(this__10052.step > 0) {
    if(this__10052.start + this__10052.step < this__10052.end) {
      return new cljs.core.Range(this__10052.meta, this__10052.start + this__10052.step, this__10052.end, this__10052.step, null)
    }else {
      return null
    }
  }else {
    if(this__10052.start + this__10052.step > this__10052.end) {
      return new cljs.core.Range(this__10052.meta, this__10052.start + this__10052.step, this__10052.end, this__10052.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__10053 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__10054 = this;
  var this__10055 = this;
  return cljs.core.pr_str.call(null, this__10055)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__10056 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__10057 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__10058 = this;
  if(this__10058.step > 0) {
    if(this__10058.start < this__10058.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__10058.start > this__10058.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__10059 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__10059.end - this__10059.start) / this__10059.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__10060 = this;
  return this__10060.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__10061 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__10061.meta, this__10061.start + this__10061.step, this__10061.end, this__10061.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__10062 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__10063 = this;
  return new cljs.core.Range(meta, this__10063.start, this__10063.end, this__10063.step, this__10063.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__10064 = this;
  return this__10064.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__10065 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10065.start + n * this__10065.step
  }else {
    if(function() {
      var and__3822__auto____10066 = this__10065.start > this__10065.end;
      if(and__3822__auto____10066) {
        return this__10065.step === 0
      }else {
        return and__3822__auto____10066
      }
    }()) {
      return this__10065.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__10067 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10067.start + n * this__10067.step
  }else {
    if(function() {
      var and__3822__auto____10068 = this__10067.start > this__10067.end;
      if(and__3822__auto____10068) {
        return this__10067.step === 0
      }else {
        return and__3822__auto____10068
      }
    }()) {
      return this__10067.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__10069 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10069.meta)
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
    var temp__3974__auto____10072 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10072) {
      var s__10073 = temp__3974__auto____10072;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__10073), take_nth.call(null, n, cljs.core.drop.call(null, n, s__10073)))
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
    var temp__3974__auto____10080 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10080) {
      var s__10081 = temp__3974__auto____10080;
      var fst__10082 = cljs.core.first.call(null, s__10081);
      var fv__10083 = f.call(null, fst__10082);
      var run__10084 = cljs.core.cons.call(null, fst__10082, cljs.core.take_while.call(null, function(p1__10074_SHARP_) {
        return cljs.core._EQ_.call(null, fv__10083, f.call(null, p1__10074_SHARP_))
      }, cljs.core.next.call(null, s__10081)));
      return cljs.core.cons.call(null, run__10084, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__10084), s__10081))))
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
      var temp__3971__auto____10099 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____10099) {
        var s__10100 = temp__3971__auto____10099;
        return reductions.call(null, f, cljs.core.first.call(null, s__10100), cljs.core.rest.call(null, s__10100))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10101 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10101) {
        var s__10102 = temp__3974__auto____10101;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__10102)), cljs.core.rest.call(null, s__10102))
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
      var G__10105 = null;
      var G__10105__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__10105__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__10105__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__10105__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__10105__4 = function() {
        var G__10106__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__10106 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10106__delegate.call(this, x, y, z, args)
        };
        G__10106.cljs$lang$maxFixedArity = 3;
        G__10106.cljs$lang$applyTo = function(arglist__10107) {
          var x = cljs.core.first(arglist__10107);
          var y = cljs.core.first(cljs.core.next(arglist__10107));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10107)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10107)));
          return G__10106__delegate(x, y, z, args)
        };
        G__10106.cljs$lang$arity$variadic = G__10106__delegate;
        return G__10106
      }();
      G__10105 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10105__0.call(this);
          case 1:
            return G__10105__1.call(this, x);
          case 2:
            return G__10105__2.call(this, x, y);
          case 3:
            return G__10105__3.call(this, x, y, z);
          default:
            return G__10105__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10105.cljs$lang$maxFixedArity = 3;
      G__10105.cljs$lang$applyTo = G__10105__4.cljs$lang$applyTo;
      return G__10105
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__10108 = null;
      var G__10108__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__10108__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__10108__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__10108__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__10108__4 = function() {
        var G__10109__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__10109 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10109__delegate.call(this, x, y, z, args)
        };
        G__10109.cljs$lang$maxFixedArity = 3;
        G__10109.cljs$lang$applyTo = function(arglist__10110) {
          var x = cljs.core.first(arglist__10110);
          var y = cljs.core.first(cljs.core.next(arglist__10110));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10110)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10110)));
          return G__10109__delegate(x, y, z, args)
        };
        G__10109.cljs$lang$arity$variadic = G__10109__delegate;
        return G__10109
      }();
      G__10108 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10108__0.call(this);
          case 1:
            return G__10108__1.call(this, x);
          case 2:
            return G__10108__2.call(this, x, y);
          case 3:
            return G__10108__3.call(this, x, y, z);
          default:
            return G__10108__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10108.cljs$lang$maxFixedArity = 3;
      G__10108.cljs$lang$applyTo = G__10108__4.cljs$lang$applyTo;
      return G__10108
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__10111 = null;
      var G__10111__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__10111__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__10111__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__10111__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__10111__4 = function() {
        var G__10112__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__10112 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10112__delegate.call(this, x, y, z, args)
        };
        G__10112.cljs$lang$maxFixedArity = 3;
        G__10112.cljs$lang$applyTo = function(arglist__10113) {
          var x = cljs.core.first(arglist__10113);
          var y = cljs.core.first(cljs.core.next(arglist__10113));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10113)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10113)));
          return G__10112__delegate(x, y, z, args)
        };
        G__10112.cljs$lang$arity$variadic = G__10112__delegate;
        return G__10112
      }();
      G__10111 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10111__0.call(this);
          case 1:
            return G__10111__1.call(this, x);
          case 2:
            return G__10111__2.call(this, x, y);
          case 3:
            return G__10111__3.call(this, x, y, z);
          default:
            return G__10111__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10111.cljs$lang$maxFixedArity = 3;
      G__10111.cljs$lang$applyTo = G__10111__4.cljs$lang$applyTo;
      return G__10111
    }()
  };
  var juxt__4 = function() {
    var G__10114__delegate = function(f, g, h, fs) {
      var fs__10104 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__10115 = null;
        var G__10115__0 = function() {
          return cljs.core.reduce.call(null, function(p1__10085_SHARP_, p2__10086_SHARP_) {
            return cljs.core.conj.call(null, p1__10085_SHARP_, p2__10086_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__10104)
        };
        var G__10115__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__10087_SHARP_, p2__10088_SHARP_) {
            return cljs.core.conj.call(null, p1__10087_SHARP_, p2__10088_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__10104)
        };
        var G__10115__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__10089_SHARP_, p2__10090_SHARP_) {
            return cljs.core.conj.call(null, p1__10089_SHARP_, p2__10090_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__10104)
        };
        var G__10115__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__10091_SHARP_, p2__10092_SHARP_) {
            return cljs.core.conj.call(null, p1__10091_SHARP_, p2__10092_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__10104)
        };
        var G__10115__4 = function() {
          var G__10116__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__10093_SHARP_, p2__10094_SHARP_) {
              return cljs.core.conj.call(null, p1__10093_SHARP_, cljs.core.apply.call(null, p2__10094_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__10104)
          };
          var G__10116 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10116__delegate.call(this, x, y, z, args)
          };
          G__10116.cljs$lang$maxFixedArity = 3;
          G__10116.cljs$lang$applyTo = function(arglist__10117) {
            var x = cljs.core.first(arglist__10117);
            var y = cljs.core.first(cljs.core.next(arglist__10117));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10117)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10117)));
            return G__10116__delegate(x, y, z, args)
          };
          G__10116.cljs$lang$arity$variadic = G__10116__delegate;
          return G__10116
        }();
        G__10115 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__10115__0.call(this);
            case 1:
              return G__10115__1.call(this, x);
            case 2:
              return G__10115__2.call(this, x, y);
            case 3:
              return G__10115__3.call(this, x, y, z);
            default:
              return G__10115__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__10115.cljs$lang$maxFixedArity = 3;
        G__10115.cljs$lang$applyTo = G__10115__4.cljs$lang$applyTo;
        return G__10115
      }()
    };
    var G__10114 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10114__delegate.call(this, f, g, h, fs)
    };
    G__10114.cljs$lang$maxFixedArity = 3;
    G__10114.cljs$lang$applyTo = function(arglist__10118) {
      var f = cljs.core.first(arglist__10118);
      var g = cljs.core.first(cljs.core.next(arglist__10118));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10118)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10118)));
      return G__10114__delegate(f, g, h, fs)
    };
    G__10114.cljs$lang$arity$variadic = G__10114__delegate;
    return G__10114
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
        var G__10121 = cljs.core.next.call(null, coll);
        coll = G__10121;
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
        var and__3822__auto____10120 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____10120) {
          return n > 0
        }else {
          return and__3822__auto____10120
        }
      }())) {
        var G__10122 = n - 1;
        var G__10123 = cljs.core.next.call(null, coll);
        n = G__10122;
        coll = G__10123;
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
  var matches__10125 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__10125), s)) {
    if(cljs.core.count.call(null, matches__10125) === 1) {
      return cljs.core.first.call(null, matches__10125)
    }else {
      return cljs.core.vec.call(null, matches__10125)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__10127 = re.exec(s);
  if(matches__10127 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__10127) === 1) {
      return cljs.core.first.call(null, matches__10127)
    }else {
      return cljs.core.vec.call(null, matches__10127)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__10132 = cljs.core.re_find.call(null, re, s);
  var match_idx__10133 = s.search(re);
  var match_str__10134 = cljs.core.coll_QMARK_.call(null, match_data__10132) ? cljs.core.first.call(null, match_data__10132) : match_data__10132;
  var post_match__10135 = cljs.core.subs.call(null, s, match_idx__10133 + cljs.core.count.call(null, match_str__10134));
  if(cljs.core.truth_(match_data__10132)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__10132, re_seq.call(null, re, post_match__10135))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__10142__10143 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___10144 = cljs.core.nth.call(null, vec__10142__10143, 0, null);
  var flags__10145 = cljs.core.nth.call(null, vec__10142__10143, 1, null);
  var pattern__10146 = cljs.core.nth.call(null, vec__10142__10143, 2, null);
  return new RegExp(pattern__10146, flags__10145)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__10136_SHARP_) {
    return print_one.call(null, p1__10136_SHARP_, opts)
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
          var and__3822__auto____10156 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____10156)) {
            var and__3822__auto____10160 = function() {
              var G__10157__10158 = obj;
              if(G__10157__10158) {
                if(function() {
                  var or__3824__auto____10159 = G__10157__10158.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____10159) {
                    return or__3824__auto____10159
                  }else {
                    return G__10157__10158.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__10157__10158.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10157__10158)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10157__10158)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____10160)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____10160
            }
          }else {
            return and__3822__auto____10156
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____10161 = !(obj == null);
          if(and__3822__auto____10161) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____10161
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__10162__10163 = obj;
          if(G__10162__10163) {
            if(function() {
              var or__3824__auto____10164 = G__10162__10163.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____10164) {
                return or__3824__auto____10164
              }else {
                return G__10162__10163.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__10162__10163.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10162__10163)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10162__10163)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__10184 = new goog.string.StringBuffer;
  var G__10185__10186 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10185__10186) {
    var string__10187 = cljs.core.first.call(null, G__10185__10186);
    var G__10185__10188 = G__10185__10186;
    while(true) {
      sb__10184.append(string__10187);
      var temp__3974__auto____10189 = cljs.core.next.call(null, G__10185__10188);
      if(temp__3974__auto____10189) {
        var G__10185__10190 = temp__3974__auto____10189;
        var G__10203 = cljs.core.first.call(null, G__10185__10190);
        var G__10204 = G__10185__10190;
        string__10187 = G__10203;
        G__10185__10188 = G__10204;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10191__10192 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10191__10192) {
    var obj__10193 = cljs.core.first.call(null, G__10191__10192);
    var G__10191__10194 = G__10191__10192;
    while(true) {
      sb__10184.append(" ");
      var G__10195__10196 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10193, opts));
      if(G__10195__10196) {
        var string__10197 = cljs.core.first.call(null, G__10195__10196);
        var G__10195__10198 = G__10195__10196;
        while(true) {
          sb__10184.append(string__10197);
          var temp__3974__auto____10199 = cljs.core.next.call(null, G__10195__10198);
          if(temp__3974__auto____10199) {
            var G__10195__10200 = temp__3974__auto____10199;
            var G__10205 = cljs.core.first.call(null, G__10195__10200);
            var G__10206 = G__10195__10200;
            string__10197 = G__10205;
            G__10195__10198 = G__10206;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10201 = cljs.core.next.call(null, G__10191__10194);
      if(temp__3974__auto____10201) {
        var G__10191__10202 = temp__3974__auto____10201;
        var G__10207 = cljs.core.first.call(null, G__10191__10202);
        var G__10208 = G__10191__10202;
        obj__10193 = G__10207;
        G__10191__10194 = G__10208;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__10184
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__10210 = cljs.core.pr_sb.call(null, objs, opts);
  sb__10210.append("\n");
  return[cljs.core.str(sb__10210)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__10229__10230 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10229__10230) {
    var string__10231 = cljs.core.first.call(null, G__10229__10230);
    var G__10229__10232 = G__10229__10230;
    while(true) {
      cljs.core.string_print.call(null, string__10231);
      var temp__3974__auto____10233 = cljs.core.next.call(null, G__10229__10232);
      if(temp__3974__auto____10233) {
        var G__10229__10234 = temp__3974__auto____10233;
        var G__10247 = cljs.core.first.call(null, G__10229__10234);
        var G__10248 = G__10229__10234;
        string__10231 = G__10247;
        G__10229__10232 = G__10248;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10235__10236 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10235__10236) {
    var obj__10237 = cljs.core.first.call(null, G__10235__10236);
    var G__10235__10238 = G__10235__10236;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__10239__10240 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10237, opts));
      if(G__10239__10240) {
        var string__10241 = cljs.core.first.call(null, G__10239__10240);
        var G__10239__10242 = G__10239__10240;
        while(true) {
          cljs.core.string_print.call(null, string__10241);
          var temp__3974__auto____10243 = cljs.core.next.call(null, G__10239__10242);
          if(temp__3974__auto____10243) {
            var G__10239__10244 = temp__3974__auto____10243;
            var G__10249 = cljs.core.first.call(null, G__10239__10244);
            var G__10250 = G__10239__10244;
            string__10241 = G__10249;
            G__10239__10242 = G__10250;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10245 = cljs.core.next.call(null, G__10235__10238);
      if(temp__3974__auto____10245) {
        var G__10235__10246 = temp__3974__auto____10245;
        var G__10251 = cljs.core.first.call(null, G__10235__10246);
        var G__10252 = G__10235__10246;
        obj__10237 = G__10251;
        G__10235__10238 = G__10252;
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
  pr_str.cljs$lang$applyTo = function(arglist__10253) {
    var objs = cljs.core.seq(arglist__10253);
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
  prn_str.cljs$lang$applyTo = function(arglist__10254) {
    var objs = cljs.core.seq(arglist__10254);
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
  pr.cljs$lang$applyTo = function(arglist__10255) {
    var objs = cljs.core.seq(arglist__10255);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__10256) {
    var objs = cljs.core.seq(arglist__10256);
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
  print_str.cljs$lang$applyTo = function(arglist__10257) {
    var objs = cljs.core.seq(arglist__10257);
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
  println.cljs$lang$applyTo = function(arglist__10258) {
    var objs = cljs.core.seq(arglist__10258);
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
  println_str.cljs$lang$applyTo = function(arglist__10259) {
    var objs = cljs.core.seq(arglist__10259);
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
  prn.cljs$lang$applyTo = function(arglist__10260) {
    var objs = cljs.core.seq(arglist__10260);
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
  printf.cljs$lang$applyTo = function(arglist__10261) {
    var fmt = cljs.core.first(arglist__10261);
    var args = cljs.core.rest(arglist__10261);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10262 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10262, "{", ", ", "}", opts, coll)
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
  var pr_pair__10263 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10263, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10264 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10264, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____10265 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____10265)) {
        var nspc__10266 = temp__3974__auto____10265;
        return[cljs.core.str(nspc__10266), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____10267 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____10267)) {
          var nspc__10268 = temp__3974__auto____10267;
          return[cljs.core.str(nspc__10268), cljs.core.str("/")].join("")
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
  var pr_pair__10269 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10269, "{", ", ", "}", opts, coll)
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
  var normalize__10271 = function(n, len) {
    var ns__10270 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__10270) < len) {
        var G__10273 = [cljs.core.str("0"), cljs.core.str(ns__10270)].join("");
        ns__10270 = G__10273;
        continue
      }else {
        return ns__10270
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__10271.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__10271.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__10271.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10271.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10271.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__10271.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__10272 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10272, "{", ", ", "}", opts, coll)
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
  var this__10274 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__10275 = this;
  var G__10276__10277 = cljs.core.seq.call(null, this__10275.watches);
  if(G__10276__10277) {
    var G__10279__10281 = cljs.core.first.call(null, G__10276__10277);
    var vec__10280__10282 = G__10279__10281;
    var key__10283 = cljs.core.nth.call(null, vec__10280__10282, 0, null);
    var f__10284 = cljs.core.nth.call(null, vec__10280__10282, 1, null);
    var G__10276__10285 = G__10276__10277;
    var G__10279__10286 = G__10279__10281;
    var G__10276__10287 = G__10276__10285;
    while(true) {
      var vec__10288__10289 = G__10279__10286;
      var key__10290 = cljs.core.nth.call(null, vec__10288__10289, 0, null);
      var f__10291 = cljs.core.nth.call(null, vec__10288__10289, 1, null);
      var G__10276__10292 = G__10276__10287;
      f__10291.call(null, key__10290, this$, oldval, newval);
      var temp__3974__auto____10293 = cljs.core.next.call(null, G__10276__10292);
      if(temp__3974__auto____10293) {
        var G__10276__10294 = temp__3974__auto____10293;
        var G__10301 = cljs.core.first.call(null, G__10276__10294);
        var G__10302 = G__10276__10294;
        G__10279__10286 = G__10301;
        G__10276__10287 = G__10302;
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
  var this__10295 = this;
  return this$.watches = cljs.core.assoc.call(null, this__10295.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__10296 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__10296.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__10297 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__10297.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__10298 = this;
  return this__10298.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10299 = this;
  return this__10299.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__10300 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__10314__delegate = function(x, p__10303) {
      var map__10309__10310 = p__10303;
      var map__10309__10311 = cljs.core.seq_QMARK_.call(null, map__10309__10310) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10309__10310) : map__10309__10310;
      var validator__10312 = cljs.core._lookup.call(null, map__10309__10311, "\ufdd0'validator", null);
      var meta__10313 = cljs.core._lookup.call(null, map__10309__10311, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__10313, validator__10312, null)
    };
    var G__10314 = function(x, var_args) {
      var p__10303 = null;
      if(goog.isDef(var_args)) {
        p__10303 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10314__delegate.call(this, x, p__10303)
    };
    G__10314.cljs$lang$maxFixedArity = 1;
    G__10314.cljs$lang$applyTo = function(arglist__10315) {
      var x = cljs.core.first(arglist__10315);
      var p__10303 = cljs.core.rest(arglist__10315);
      return G__10314__delegate(x, p__10303)
    };
    G__10314.cljs$lang$arity$variadic = G__10314__delegate;
    return G__10314
  }();
  atom = function(x, var_args) {
    var p__10303 = var_args;
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
  var temp__3974__auto____10319 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____10319)) {
    var validate__10320 = temp__3974__auto____10319;
    if(cljs.core.truth_(validate__10320.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__10321 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__10321, new_value);
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
    var G__10322__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__10322 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__10322__delegate.call(this, a, f, x, y, z, more)
    };
    G__10322.cljs$lang$maxFixedArity = 5;
    G__10322.cljs$lang$applyTo = function(arglist__10323) {
      var a = cljs.core.first(arglist__10323);
      var f = cljs.core.first(cljs.core.next(arglist__10323));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10323)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10323))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10323)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10323)))));
      return G__10322__delegate(a, f, x, y, z, more)
    };
    G__10322.cljs$lang$arity$variadic = G__10322__delegate;
    return G__10322
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__10324) {
    var iref = cljs.core.first(arglist__10324);
    var f = cljs.core.first(cljs.core.next(arglist__10324));
    var args = cljs.core.rest(cljs.core.next(arglist__10324));
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
  var this__10325 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__10325.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10326 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__10326.state, function(p__10327) {
    var map__10328__10329 = p__10327;
    var map__10328__10330 = cljs.core.seq_QMARK_.call(null, map__10328__10329) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10328__10329) : map__10328__10329;
    var curr_state__10331 = map__10328__10330;
    var done__10332 = cljs.core._lookup.call(null, map__10328__10330, "\ufdd0'done", null);
    if(cljs.core.truth_(done__10332)) {
      return curr_state__10331
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__10326.f.call(null)})
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
    var map__10353__10354 = options;
    var map__10353__10355 = cljs.core.seq_QMARK_.call(null, map__10353__10354) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10353__10354) : map__10353__10354;
    var keywordize_keys__10356 = cljs.core._lookup.call(null, map__10353__10355, "\ufdd0'keywordize-keys", null);
    var keyfn__10357 = cljs.core.truth_(keywordize_keys__10356) ? cljs.core.keyword : cljs.core.str;
    var f__10372 = function thisfn(x) {
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
                var iter__2462__auto____10371 = function iter__10365(s__10366) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__10366__10369 = s__10366;
                    while(true) {
                      if(cljs.core.seq.call(null, s__10366__10369)) {
                        var k__10370 = cljs.core.first.call(null, s__10366__10369);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__10357.call(null, k__10370), thisfn.call(null, x[k__10370])], true), iter__10365.call(null, cljs.core.rest.call(null, s__10366__10369)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____10371.call(null, cljs.core.js_keys.call(null, x))
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
    return f__10372.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__10373) {
    var x = cljs.core.first(arglist__10373);
    var options = cljs.core.rest(arglist__10373);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__10378 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__10382__delegate = function(args) {
      var temp__3971__auto____10379 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__10378), args, null);
      if(cljs.core.truth_(temp__3971__auto____10379)) {
        var v__10380 = temp__3971__auto____10379;
        return v__10380
      }else {
        var ret__10381 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__10378, cljs.core.assoc, args, ret__10381);
        return ret__10381
      }
    };
    var G__10382 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10382__delegate.call(this, args)
    };
    G__10382.cljs$lang$maxFixedArity = 0;
    G__10382.cljs$lang$applyTo = function(arglist__10383) {
      var args = cljs.core.seq(arglist__10383);
      return G__10382__delegate(args)
    };
    G__10382.cljs$lang$arity$variadic = G__10382__delegate;
    return G__10382
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__10385 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__10385)) {
        var G__10386 = ret__10385;
        f = G__10386;
        continue
      }else {
        return ret__10385
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__10387__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__10387 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10387__delegate.call(this, f, args)
    };
    G__10387.cljs$lang$maxFixedArity = 1;
    G__10387.cljs$lang$applyTo = function(arglist__10388) {
      var f = cljs.core.first(arglist__10388);
      var args = cljs.core.rest(arglist__10388);
      return G__10387__delegate(f, args)
    };
    G__10387.cljs$lang$arity$variadic = G__10387__delegate;
    return G__10387
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
    var k__10390 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__10390, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__10390, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____10399 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____10399) {
      return or__3824__auto____10399
    }else {
      var or__3824__auto____10400 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____10400) {
        return or__3824__auto____10400
      }else {
        var and__3822__auto____10401 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____10401) {
          var and__3822__auto____10402 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____10402) {
            var and__3822__auto____10403 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____10403) {
              var ret__10404 = true;
              var i__10405 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____10406 = cljs.core.not.call(null, ret__10404);
                  if(or__3824__auto____10406) {
                    return or__3824__auto____10406
                  }else {
                    return i__10405 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__10404
                }else {
                  var G__10407 = isa_QMARK_.call(null, h, child.call(null, i__10405), parent.call(null, i__10405));
                  var G__10408 = i__10405 + 1;
                  ret__10404 = G__10407;
                  i__10405 = G__10408;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____10403
            }
          }else {
            return and__3822__auto____10402
          }
        }else {
          return and__3822__auto____10401
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
    var tp__10417 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__10418 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__10419 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__10420 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____10421 = cljs.core.contains_QMARK_.call(null, tp__10417.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__10419.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__10419.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__10417, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__10420.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__10418, parent, ta__10419), "\ufdd0'descendants":tf__10420.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__10419, tag, td__10418)})
    }();
    if(cljs.core.truth_(or__3824__auto____10421)) {
      return or__3824__auto____10421
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
    var parentMap__10426 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__10427 = cljs.core.truth_(parentMap__10426.call(null, tag)) ? cljs.core.disj.call(null, parentMap__10426.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__10428 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__10427)) ? cljs.core.assoc.call(null, parentMap__10426, tag, childsParents__10427) : cljs.core.dissoc.call(null, parentMap__10426, tag);
    var deriv_seq__10429 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__10409_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__10409_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__10409_SHARP_), cljs.core.second.call(null, p1__10409_SHARP_)))
    }, cljs.core.seq.call(null, newParents__10428)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__10426.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__10410_SHARP_, p2__10411_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__10410_SHARP_, p2__10411_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__10429))
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
  var xprefs__10437 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____10439 = cljs.core.truth_(function() {
    var and__3822__auto____10438 = xprefs__10437;
    if(cljs.core.truth_(and__3822__auto____10438)) {
      return xprefs__10437.call(null, y)
    }else {
      return and__3822__auto____10438
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____10439)) {
    return or__3824__auto____10439
  }else {
    var or__3824__auto____10441 = function() {
      var ps__10440 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__10440) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__10440), prefer_table))) {
          }else {
          }
          var G__10444 = cljs.core.rest.call(null, ps__10440);
          ps__10440 = G__10444;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____10441)) {
      return or__3824__auto____10441
    }else {
      var or__3824__auto____10443 = function() {
        var ps__10442 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__10442) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__10442), y, prefer_table))) {
            }else {
            }
            var G__10445 = cljs.core.rest.call(null, ps__10442);
            ps__10442 = G__10445;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____10443)) {
        return or__3824__auto____10443
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____10447 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____10447)) {
    return or__3824__auto____10447
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10465 = cljs.core.reduce.call(null, function(be, p__10457) {
    var vec__10458__10459 = p__10457;
    var k__10460 = cljs.core.nth.call(null, vec__10458__10459, 0, null);
    var ___10461 = cljs.core.nth.call(null, vec__10458__10459, 1, null);
    var e__10462 = vec__10458__10459;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10460)) {
      var be2__10464 = cljs.core.truth_(function() {
        var or__3824__auto____10463 = be == null;
        if(or__3824__auto____10463) {
          return or__3824__auto____10463
        }else {
          return cljs.core.dominates.call(null, k__10460, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10462 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10464), k__10460, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10460), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10464)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10464
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10465)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10465));
      return cljs.core.second.call(null, best_entry__10465)
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
    var and__3822__auto____10470 = mf;
    if(and__3822__auto____10470) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10470
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____10471 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10472 = cljs.core._reset[goog.typeOf(x__2363__auto____10471)];
      if(or__3824__auto____10472) {
        return or__3824__auto____10472
      }else {
        var or__3824__auto____10473 = cljs.core._reset["_"];
        if(or__3824__auto____10473) {
          return or__3824__auto____10473
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10478 = mf;
    if(and__3822__auto____10478) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10478
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____10479 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10480 = cljs.core._add_method[goog.typeOf(x__2363__auto____10479)];
      if(or__3824__auto____10480) {
        return or__3824__auto____10480
      }else {
        var or__3824__auto____10481 = cljs.core._add_method["_"];
        if(or__3824__auto____10481) {
          return or__3824__auto____10481
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10486 = mf;
    if(and__3822__auto____10486) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10486
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____10487 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10488 = cljs.core._remove_method[goog.typeOf(x__2363__auto____10487)];
      if(or__3824__auto____10488) {
        return or__3824__auto____10488
      }else {
        var or__3824__auto____10489 = cljs.core._remove_method["_"];
        if(or__3824__auto____10489) {
          return or__3824__auto____10489
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10494 = mf;
    if(and__3822__auto____10494) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10494
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____10495 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10496 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____10495)];
      if(or__3824__auto____10496) {
        return or__3824__auto____10496
      }else {
        var or__3824__auto____10497 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10497) {
          return or__3824__auto____10497
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10502 = mf;
    if(and__3822__auto____10502) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10502
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____10503 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10504 = cljs.core._get_method[goog.typeOf(x__2363__auto____10503)];
      if(or__3824__auto____10504) {
        return or__3824__auto____10504
      }else {
        var or__3824__auto____10505 = cljs.core._get_method["_"];
        if(or__3824__auto____10505) {
          return or__3824__auto____10505
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10510 = mf;
    if(and__3822__auto____10510) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10510
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____10511 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10512 = cljs.core._methods[goog.typeOf(x__2363__auto____10511)];
      if(or__3824__auto____10512) {
        return or__3824__auto____10512
      }else {
        var or__3824__auto____10513 = cljs.core._methods["_"];
        if(or__3824__auto____10513) {
          return or__3824__auto____10513
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10518 = mf;
    if(and__3822__auto____10518) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10518
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____10519 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10520 = cljs.core._prefers[goog.typeOf(x__2363__auto____10519)];
      if(or__3824__auto____10520) {
        return or__3824__auto____10520
      }else {
        var or__3824__auto____10521 = cljs.core._prefers["_"];
        if(or__3824__auto____10521) {
          return or__3824__auto____10521
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10526 = mf;
    if(and__3822__auto____10526) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10526
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____10527 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10528 = cljs.core._dispatch[goog.typeOf(x__2363__auto____10527)];
      if(or__3824__auto____10528) {
        return or__3824__auto____10528
      }else {
        var or__3824__auto____10529 = cljs.core._dispatch["_"];
        if(or__3824__auto____10529) {
          return or__3824__auto____10529
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10532 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10533 = cljs.core._get_method.call(null, mf, dispatch_val__10532);
  if(cljs.core.truth_(target_fn__10533)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10532)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10533, args)
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
  var this__10534 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10535 = this;
  cljs.core.swap_BANG_.call(null, this__10535.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10535.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10535.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10535.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10536 = this;
  cljs.core.swap_BANG_.call(null, this__10536.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10536.method_cache, this__10536.method_table, this__10536.cached_hierarchy, this__10536.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10537 = this;
  cljs.core.swap_BANG_.call(null, this__10537.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10537.method_cache, this__10537.method_table, this__10537.cached_hierarchy, this__10537.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10538 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10538.cached_hierarchy), cljs.core.deref.call(null, this__10538.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10538.method_cache, this__10538.method_table, this__10538.cached_hierarchy, this__10538.hierarchy)
  }
  var temp__3971__auto____10539 = cljs.core.deref.call(null, this__10538.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10539)) {
    var target_fn__10540 = temp__3971__auto____10539;
    return target_fn__10540
  }else {
    var temp__3971__auto____10541 = cljs.core.find_and_cache_best_method.call(null, this__10538.name, dispatch_val, this__10538.hierarchy, this__10538.method_table, this__10538.prefer_table, this__10538.method_cache, this__10538.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10541)) {
      var target_fn__10542 = temp__3971__auto____10541;
      return target_fn__10542
    }else {
      return cljs.core.deref.call(null, this__10538.method_table).call(null, this__10538.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10543 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10543.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10543.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10543.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10543.method_cache, this__10543.method_table, this__10543.cached_hierarchy, this__10543.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10544 = this;
  return cljs.core.deref.call(null, this__10544.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10545 = this;
  return cljs.core.deref.call(null, this__10545.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10546 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10546.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10548__delegate = function(_, args) {
    var self__10547 = this;
    return cljs.core._dispatch.call(null, self__10547, args)
  };
  var G__10548 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10548__delegate.call(this, _, args)
  };
  G__10548.cljs$lang$maxFixedArity = 1;
  G__10548.cljs$lang$applyTo = function(arglist__10549) {
    var _ = cljs.core.first(arglist__10549);
    var args = cljs.core.rest(arglist__10549);
    return G__10548__delegate(_, args)
  };
  G__10548.cljs$lang$arity$variadic = G__10548__delegate;
  return G__10548
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10550 = this;
  return cljs.core._dispatch.call(null, self__10550, args)
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
  var this__10551 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10553, _) {
  var this__10552 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10552.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10554 = this;
  var and__3822__auto____10555 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10555) {
    return this__10554.uuid === other.uuid
  }else {
    return and__3822__auto____10555
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10556 = this;
  var this__10557 = this;
  return cljs.core.pr_str.call(null, this__10557)
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
  var or__3824__auto____308573 = cljs.core._EQ_.call(null, x, "\t");
  if(or__3824__auto____308573) {
    return or__3824__auto____308573
  }else {
    var or__3824__auto____308574 = cljs.core._EQ_.call(null, x, " ");
    if(or__3824__auto____308574) {
      return or__3824__auto____308574
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
  var and__3822__auto____308578 = function() {
    var and__3822__auto____308577 = 0 <= i;
    if(and__3822__auto____308577) {
      return i <= cljs.core.count.call(null, (new cljs.core.Keyword("\ufdd0'chars")).call(null, p))
    }else {
      return and__3822__auto____308577
    }
  }();
  if(cljs.core.truth_(and__3822__auto____308578)) {
    return cljs.core._EQ_.call(null, mode, subpar.core.get_mode.call(null, p, i))
  }else {
    return and__3822__auto____308578
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
  var and__3822__auto____308582 = i;
  if(cljs.core.truth_(and__3822__auto____308582)) {
    var and__3822__auto____308583 = j;
    if(cljs.core.truth_(and__3822__auto____308583)) {
      return cljs.core.count.call(null, cljs.core.filter.call(null, function(p1__308579_SHARP_) {
        return cljs.core._EQ_.call(null, "\n", p1__308579_SHARP_)
      }, cljs.core.drop.call(null, i, cljs.core.drop_last.call(null, cljs.core.count.call(null, s) - j - 1, cljs.core.take.call(null, cljs.core.count.call(null, s), s))))) + 1
    }else {
      return and__3822__auto____308583
    }
  }else {
    return and__3822__auto____308582
  }
};
subpar.core.escaped_QMARK_ = function escaped_QMARK_(s, i) {
  return cljs.core.odd_QMARK_.call(null, function() {
    var c__308587 = 0;
    var j__308588 = i - 1;
    while(true) {
      var a__308589 = cljs.core.nth.call(null, s, j__308588, null);
      if(j__308588 < 0) {
        return c__308587
      }else {
        if(a__308589 == null) {
          return c__308587
        }else {
          if(cljs.core.not_EQ_.call(null, "\\", a__308589)) {
            return c__308587
          }else {
            if(true) {
              var G__308590 = c__308587 + 1;
              var G__308591 = j__308588 - 1;
              c__308587 = G__308590;
              j__308588 = G__308591;
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
  var vec__308596__308597 = subpar.core.get_wrapper.call(null, subpar.core.parse.call(null, s), i);
  var o__308598 = cljs.core.nth.call(null, vec__308596__308597, 0, null);
  var c__308599 = cljs.core.nth.call(null, vec__308596__308597, 1, null);
  if(cljs.core._EQ_.call(null, -1, o__308598)) {
    return i
  }else {
    return o__308598
  }
};
goog.exportSymbol("subpar.core.backward_up_fn", subpar.core.backward_up_fn);
subpar.core.forward_delete_action = function forward_delete_action(s, i) {
  var p__308604 = subpar.core.parse.call(null, s);
  var h__308605 = i - 1;
  var j__308606 = i + 1;
  var c__308607 = cljs.core.nth.call(null, s, i, null);
  if(i >= cljs.core.count.call(null, s)) {
    return 0
  }else {
    if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, i))) {
      return 2
    }else {
      if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, j__308606))) {
        return 3
      }else {
        if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([h__308605, i], true), subpar.core.get_wrapper.call(null, p__308604, i))) {
          return 2
        }else {
          if(cljs.core.truth_(subpar.core.closes_list_QMARK_.call(null, p__308604, i))) {
            return 0
          }else {
            if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([i, j__308606], true), subpar.core.get_wrapper.call(null, p__308604, j__308606))) {
              return 3
            }else {
              if(cljs.core.truth_(subpar.core.opens_list_QMARK_.call(null, p__308604, i))) {
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
  var p__308611 = subpar.core.parse.call(null, s);
  var g__308612 = i - 2;
  var h__308613 = i - 1;
  if(i <= 0) {
    return 0
  }else {
    if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, h__308613))) {
      return 3
    }else {
      if(cljs.core.truth_(subpar.core.escaped_QMARK_.call(null, s, i))) {
        return 2
      }else {
        if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([g__308612, h__308613], true), subpar.core.get_wrapper.call(null, p__308611, h__308613))) {
          return 3
        }else {
          if(cljs.core.truth_(subpar.core.closes_list_QMARK_.call(null, p__308611, h__308613))) {
            return 4
          }else {
            if(cljs.core._EQ_.call(null, cljs.core.PersistentVector.fromArray([h__308613, i], true), subpar.core.get_wrapper.call(null, p__308611, i))) {
              return 2
            }else {
              if(cljs.core.truth_(subpar.core.opens_list_QMARK_.call(null, p__308611, h__308613))) {
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
  var p__308615 = subpar.core.parse.call(null, s);
  if(i < 0) {
    return 0
  }else {
    if(i >= cljs.core.count.call(null, s)) {
      return 0
    }else {
      if(cljs.core.truth_(subpar.core.in_comment_QMARK_.call(null, p__308615, i))) {
        return 3
      }else {
        if(cljs.core.truth_(subpar.core.n_str_QMARK_.call(null, p__308615, i))) {
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
  var vec__308625__308626 = subpar.core.get_wrapper.call(null, p, i);
  var o__308627 = cljs.core.nth.call(null, vec__308625__308626, 0, null);
  var c__308628 = cljs.core.nth.call(null, vec__308625__308626, 1, null);
  if(cljs.core._EQ_.call(null, -1, o__308627)) {
    return cljs.core.PersistentVector.EMPTY
  }else {
    var start__308630 = function() {
      var or__3824__auto____308629 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, cljs.core.identity, p));
      if(cljs.core.truth_(or__3824__auto____308629)) {
        return or__3824__auto____308629
      }else {
        return o__308627
      }
    }() + 1;
    var delete__308631 = cljs.core.not_EQ_.call(null, start__308630, c__308628);
    var dest__308632 = delete__308631 ? start__308630 + 1 : c__308628 + 1;
    return cljs.core.PersistentVector.fromArray([delete__308631, start__308630, c__308628, dest__308632], true)
  }
};
goog.exportSymbol("subpar.core.close_expression_vals", subpar.core.close_expression_vals);
subpar.core.get_start_of_next_list = function get_start_of_next_list(s, i) {
  var p__308636 = subpar.core.parse.call(null, s);
  var r__308638 = cljs.core.first.call(null, subpar.core.get_siblings.call(null, i, cljs.core.keys, function(p1__308616_SHARP_) {
    var and__3822__auto____308637 = p1__308616_SHARP_ >= i;
    if(and__3822__auto____308637) {
      return cljs.core.get_in.call(null, p__308636, cljs.core.PersistentVector.fromArray(["\ufdd0'families", p1__308616_SHARP_], true))
    }else {
      return and__3822__auto____308637
    }
  }, p__308636));
  if(r__308638 == null) {
    return false
  }else {
    return r__308638
  }
};
subpar.core.forward_down_fn = function forward_down_fn(s, i) {
  var r__308641 = subpar.core.get_start_of_next_list.call(null, s, i);
  if(cljs.core.truth_(r__308641)) {
    return r__308641 + 1
  }else {
    return i
  }
};
goog.exportSymbol("subpar.core.forward_down_fn", subpar.core.forward_down_fn);
subpar.core.backward_fn = function backward_fn(s, i) {
  var p__308647 = subpar.core.parse.call(null, s);
  var b__308648 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.keys, function(p1__308639_SHARP_) {
    return p1__308639_SHARP_ < i
  }, p__308647));
  var o__308649 = subpar.core.get_opening_delimiter_index_with_parse.call(null, p__308647, i);
  var or__3824__auto____308650 = b__308648;
  if(cljs.core.truth_(or__3824__auto____308650)) {
    return or__3824__auto____308650
  }else {
    if(o__308649 < 0) {
      return 0
    }else {
      return o__308649
    }
  }
};
goog.exportSymbol("subpar.core.backward_fn", subpar.core.backward_fn);
subpar.core.backward_down_fn = function backward_down_fn(s, i) {
  var p__308655 = subpar.core.parse.call(null, s);
  var b__308657 = cljs.core.last.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, function(p1__308642_SHARP_) {
    var and__3822__auto____308656 = p1__308642_SHARP_ < i;
    if(and__3822__auto____308656) {
      return subpar.core.closes_list_QMARK_.call(null, p__308655, p1__308642_SHARP_)
    }else {
      return and__3822__auto____308656
    }
  }, p__308655));
  var or__3824__auto____308658 = b__308657;
  if(cljs.core.truth_(or__3824__auto____308658)) {
    return or__3824__auto____308658
  }else {
    return i
  }
};
goog.exportSymbol("subpar.core.backward_down_fn", subpar.core.backward_down_fn);
subpar.core.forward_up_fn = function forward_up_fn(s, i) {
  var p__308667 = subpar.core.parse.call(null, s);
  var vec__308666__308668 = subpar.core.get_wrapper.call(null, p__308667, i);
  var o__308669 = cljs.core.nth.call(null, vec__308666__308668, 0, null);
  var c__308670 = cljs.core.nth.call(null, vec__308666__308668, 1, null);
  var in_list__308671 = cljs.core.not_EQ_.call(null, -1, o__308669);
  if(in_list__308671) {
    return c__308670 + 1
  }else {
    return i
  }
};
goog.exportSymbol("subpar.core.forward_up_fn", subpar.core.forward_up_fn);
subpar.core.forward_fn = function forward_fn(s, i) {
  var p__308677 = subpar.core.parse.call(null, s);
  var b__308678 = cljs.core.first.call(null, subpar.core.get_siblings.call(null, i, cljs.core.vals, function(p1__308659_SHARP_) {
    return p1__308659_SHARP_ >= i
  }, p__308677));
  var c__308679 = subpar.core.get_closing_delimiter_index_with_parse.call(null, p__308677, i);
  var l__308680 = cljs.core.count.call(null, s);
  if(cljs.core.truth_(b__308678)) {
    return b__308678 + 1
  }else {
    if(cljs.core.truth_(c__308679)) {
      return c__308679 + 1 < l__308680 ? c__308679 + 1 : l__308680
    }else {
      if(true) {
        return l__308680
      }else {
        return null
      }
    }
  }
};
goog.exportSymbol("subpar.core.forward_fn", subpar.core.forward_fn);
subpar.core.forward_slurp_vals = function forward_slurp_vals(s, i) {
  var p__308695 = subpar.core.parse.call(null, s);
  var vec__308694__308696 = subpar.core.get_wrapper.call(null, p__308695, i);
  var o__308697 = cljs.core.nth.call(null, vec__308694__308696, 0, null);
  var c__308698 = cljs.core.nth.call(null, vec__308694__308696, 1, null);
  var in_list__308699 = cljs.core.not_EQ_.call(null, -1, o__308697);
  var a__308701 = function() {
    var and__3822__auto____308700 = in_list__308699;
    if(and__3822__auto____308700) {
      return cljs.core.nth.call(null, s, c__308698, false)
    }else {
      return and__3822__auto____308700
    }
  }();
  var d__308703 = function() {
    var and__3822__auto____308702 = in_list__308699;
    if(and__3822__auto____308702) {
      return cljs.core.first.call(null, subpar.core.get_siblings.call(null, o__308697, cljs.core.vals, function(p1__308672_SHARP_) {
        return p1__308672_SHARP_ > c__308698
      }, p__308695))
    }else {
      return and__3822__auto____308702
    }
  }();
  if(cljs.core.truth_(function() {
    var and__3822__auto____308704 = a__308701;
    if(cljs.core.truth_(and__3822__auto____308704)) {
      var and__3822__auto____308705 = c__308698;
      if(cljs.core.truth_(and__3822__auto____308705)) {
        return d__308703
      }else {
        return and__3822__auto____308705
      }
    }else {
      return and__3822__auto____308704
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([a__308701, c__308698, d__308703 + 1, subpar.core.count_lines.call(null, s, o__308697, d__308703 + 1)], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
goog.exportSymbol("subpar.core.forward_slurp_vals", subpar.core.forward_slurp_vals);
subpar.core.backward_slurp_vals = function backward_slurp_vals(s, i) {
  var p__308718 = subpar.core.parse.call(null, s);
  var vec__308717__308719 = subpar.core.get_wrapper.call(null, p__308718, i);
  var o__308720 = cljs.core.nth.call(null, vec__308717__308719, 0, null);
  var c__308721 = cljs.core.nth.call(null, vec__308717__308719, 1, null);
  var in_list__308722 = cljs.core.not_EQ_.call(null, -1, o__308720);
  var d__308724 = function() {
    var and__3822__auto____308723 = in_list__308722;
    if(and__3822__auto____308723) {
      return cljs.core.last.call(null, subpar.core.get_siblings.call(null, o__308720, cljs.core.keys, function(p1__308681_SHARP_) {
        return p1__308681_SHARP_ < o__308720
      }, p__308718))
    }else {
      return and__3822__auto____308723
    }
  }();
  var a__308726 = function() {
    var and__3822__auto____308725 = in_list__308722;
    if(and__3822__auto____308725) {
      return cljs.core.nth.call(null, s, o__308720, false)
    }else {
      return and__3822__auto____308725
    }
  }();
  if(cljs.core.truth_(function() {
    var and__3822__auto____308727 = a__308726;
    if(cljs.core.truth_(and__3822__auto____308727)) {
      return d__308724
    }else {
      return and__3822__auto____308727
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([a__308726, o__308720, d__308724, subpar.core.count_lines.call(null, s, d__308724, c__308721)], true)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
goog.exportSymbol("subpar.core.backward_slurp_vals", subpar.core.backward_slurp_vals);
subpar.core.forward_barf_vals = function forward_barf_vals(s, i) {
  var p__308743 = subpar.core.parse.call(null, s);
  var vec__308742__308744 = subpar.core.get_wrapper.call(null, p__308743, i);
  var o__308745 = cljs.core.nth.call(null, vec__308742__308744, 0, null);
  var c__308746 = cljs.core.nth.call(null, vec__308742__308744, 1, null);
  var in_list__308747 = cljs.core.not_EQ_.call(null, -1, o__308745);
  var endings__308749 = function() {
    var and__3822__auto____308748 = in_list__308747;
    if(and__3822__auto____308748) {
      return subpar.core.get_siblings.call(null, i, cljs.core.vals, cljs.core.constantly.call(null, true), p__308743)
    }else {
      return and__3822__auto____308748
    }
  }();
  var a__308752 = function() {
    var and__3822__auto____308750 = c__308746;
    if(cljs.core.truth_(and__3822__auto____308750)) {
      var and__3822__auto____308751 = in_list__308747;
      if(and__3822__auto____308751) {
        return cljs.core.nth.call(null, s, c__308746, null)
      }else {
        return and__3822__auto____308751
      }
    }else {
      return and__3822__auto____308750
    }
  }();
  var r__308754 = function() {
    var or__3824__auto____308753 = subpar.core.count_lines.call(null, s, o__308745, c__308746);
    if(cljs.core.truth_(or__3824__auto____308753)) {
      return or__3824__auto____308753
    }else {
      return 1
    }
  }();
  var num__308755 = cljs.core.truth_(endings__308749) ? cljs.core.count.call(null, endings__308749) : 0;
  if(num__308755 > 1) {
    return cljs.core.PersistentVector.fromArray([a__308752, c__308746, cljs.core.nth.call(null, endings__308749, num__308755 - 2) + 1, false, r__308754, o__308745], true)
  }else {
    if(cljs.core._EQ_.call(null, num__308755, 1)) {
      return cljs.core.PersistentVector.fromArray([a__308752, c__308746, o__308745 + 1, true, r__308754, o__308745], true)
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
  var p__308771 = subpar.core.parse.call(null, s);
  var vec__308770__308772 = subpar.core.get_wrapper.call(null, p__308771, i);
  var o__308773 = cljs.core.nth.call(null, vec__308770__308772, 0, null);
  var c__308774 = cljs.core.nth.call(null, vec__308770__308772, 1, null);
  var in_list__308775 = cljs.core.not_EQ_.call(null, -1, o__308773);
  var starts__308777 = function() {
    var and__3822__auto____308776 = in_list__308775;
    if(and__3822__auto____308776) {
      return subpar.core.get_siblings.call(null, i, cljs.core.keys, cljs.core.constantly.call(null, true), p__308771)
    }else {
      return and__3822__auto____308776
    }
  }();
  var a__308780 = function() {
    var and__3822__auto____308778 = o__308773;
    if(cljs.core.truth_(and__3822__auto____308778)) {
      var and__3822__auto____308779 = in_list__308775;
      if(and__3822__auto____308779) {
        return cljs.core.nth.call(null, s, o__308773, null)
      }else {
        return and__3822__auto____308779
      }
    }else {
      return and__3822__auto____308778
    }
  }();
  var r__308782 = function() {
    var or__3824__auto____308781 = subpar.core.count_lines.call(null, s, o__308773, c__308774);
    if(cljs.core.truth_(or__3824__auto____308781)) {
      return or__3824__auto____308781
    }else {
      return 1
    }
  }();
  var num__308783 = cljs.core.truth_(starts__308777) ? cljs.core.count.call(null, starts__308777) : 0;
  if(num__308783 > 1) {
    return cljs.core.PersistentVector.fromArray([a__308780, o__308773, cljs.core.second.call(null, starts__308777), false, r__308782], true)
  }else {
    if(cljs.core._EQ_.call(null, num__308783, 1)) {
      return cljs.core.PersistentVector.fromArray([a__308780, o__308773, c__308774, true, r__308782], true)
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
  var p__308796 = subpar.core.parse.call(null, s);
  var vec__308795__308797 = subpar.core.get_wrapper.call(null, p__308796, i);
  var o__308798 = cljs.core.nth.call(null, vec__308795__308797, 0, null);
  var c__308799 = cljs.core.nth.call(null, vec__308795__308797, 1, null);
  var in_list__308800 = cljs.core.not_EQ_.call(null, -1, o__308798);
  if(in_list__308800) {
    var vec__308801__308802 = subpar.core.get_wrapper.call(null, p__308796, o__308798);
    var n__308803 = cljs.core.nth.call(null, vec__308801__308802, 0, null);
    var d__308804 = cljs.core.nth.call(null, vec__308801__308802, 1, null);
    var r__308805 = subpar.core.count_lines.call(null, s, n__308803, d__308804);
    return[o__308798, c__308799, 0 > n__308803 ? 0 : n__308803, r__308805]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.splice_vals", subpar.core.splice_vals);
subpar.core.splice_killing_backward = function splice_killing_backward(s, i) {
  var p__308818 = subpar.core.parse.call(null, s);
  var vec__308817__308819 = subpar.core.get_wrapper.call(null, p__308818, i);
  var o__308820 = cljs.core.nth.call(null, vec__308817__308819, 0, null);
  var c__308821 = cljs.core.nth.call(null, vec__308817__308819, 1, null);
  var in_list__308822 = cljs.core.not_EQ_.call(null, -1, o__308820);
  if(in_list__308822) {
    var vec__308823__308824 = subpar.core.get_wrapper.call(null, p__308818, o__308820);
    var n__308825 = cljs.core.nth.call(null, vec__308823__308824, 0, null);
    var d__308826 = cljs.core.nth.call(null, vec__308823__308824, 1, null);
    var r__308827 = subpar.core.count_lines.call(null, s, n__308825, d__308826);
    return[o__308820, o__308820 > i ? o__308820 : i, c__308821, 0 > n__308825 ? 0 : n__308825, r__308827]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.splice_killing_backward", subpar.core.splice_killing_backward);
subpar.core.splice_killing_forward = function splice_killing_forward(s, i) {
  var p__308840 = subpar.core.parse.call(null, s);
  var vec__308839__308841 = subpar.core.get_wrapper.call(null, p__308840, i);
  var o__308842 = cljs.core.nth.call(null, vec__308839__308841, 0, null);
  var c__308843 = cljs.core.nth.call(null, vec__308839__308841, 1, null);
  var in_list__308844 = cljs.core.not_EQ_.call(null, -1, o__308842);
  if(in_list__308844) {
    var vec__308845__308846 = subpar.core.get_wrapper.call(null, p__308840, o__308842);
    var n__308847 = cljs.core.nth.call(null, vec__308845__308846, 0, null);
    var d__308848 = cljs.core.nth.call(null, vec__308845__308846, 1, null);
    var r__308849 = subpar.core.count_lines.call(null, s, n__308847, d__308848);
    return[o__308842, i, c__308843 + 1, 0 > n__308847 ? 0 : n__308847, r__308849]
  }else {
    return[]
  }
};
goog.exportSymbol("subpar.core.splice_killing_forward", subpar.core.splice_killing_forward);
subpar.core.parse = function parse(ss) {
  var s__308888 = [cljs.core.str(ss), cljs.core.str(" ")].join("");
  var i__308889 = 0;
  var mode__308890 = subpar.core.code;
  var openings__308891 = cljs.core.list.call(null, -1);
  var start__308892 = -1;
  var t__308893 = cljs.core.PersistentVector.EMPTY;
  var families__308894 = cljs.core.PersistentArrayMap.fromArrays([-1], [cljs.core.ObjMap.fromObject(["\ufdd0'children"], {"\ufdd0'children":cljs.core.ObjMap.EMPTY})]);
  var escaping__308895 = false;
  var in_word__308896 = false;
  while(true) {
    var a__308897 = cljs.core.nth.call(null, s__308888, i__308889, null);
    var j__308898 = i__308889 + 1;
    var o__308899 = cljs.core.peek.call(null, openings__308891);
    if(cljs.core.truth_(function() {
      var and__3822__auto____308900 = a__308897 == null;
      if(and__3822__auto____308900) {
        return in_word__308896
      }else {
        return and__3822__auto____308900
      }
    }())) {
      return cljs.core.ObjMap.fromObject(["\ufdd0'chars", "\ufdd0'families"], {"\ufdd0'chars":t__308893, "\ufdd0'families":cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([-1, "\ufdd0'closer"], true), i__308889 - 1), cljs.core.PersistentVector.fromArray([-1, "\ufdd0'children", start__308892], true), i__308889 - 1)})
    }else {
      if(a__308897 == null) {
        return cljs.core.ObjMap.fromObject(["\ufdd0'chars", "\ufdd0'families"], {"\ufdd0'chars":t__308893, "\ufdd0'families":cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([-1, "\ufdd0'closer"], true), i__308889 - 1)})
      }else {
        if(function() {
          var and__3822__auto____308901 = cljs.core.not_EQ_.call(null, subpar.core.cmmnt, mode__308890);
          if(and__3822__auto____308901) {
            var and__3822__auto____308902 = cljs.core._EQ_.call(null, "\\", a__308897);
            if(and__3822__auto____308902) {
              var and__3822__auto____308903 = cljs.core.not.call(null, escaping__308895);
              if(and__3822__auto____308903) {
                return cljs.core.not.call(null, in_word__308896)
              }else {
                return and__3822__auto____308903
              }
            }else {
              return and__3822__auto____308902
            }
          }else {
            return and__3822__auto____308901
          }
        }()) {
          var G__308926 = j__308898;
          var G__308927 = mode__308890;
          var G__308928 = openings__308891;
          var G__308929 = i__308889;
          var G__308930 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
          var G__308931 = cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'children", i__308889], true), j__308898);
          var G__308932 = true;
          var G__308933 = true;
          i__308889 = G__308926;
          mode__308890 = G__308927;
          openings__308891 = G__308928;
          start__308892 = G__308929;
          t__308893 = G__308930;
          families__308894 = G__308931;
          escaping__308895 = G__308932;
          in_word__308896 = G__308933;
          continue
        }else {
          if(function() {
            var and__3822__auto____308904 = cljs.core.not_EQ_.call(null, subpar.core.cmmnt, mode__308890);
            if(and__3822__auto____308904) {
              var and__3822__auto____308905 = cljs.core._EQ_.call(null, "\\", a__308897);
              if(and__3822__auto____308905) {
                return cljs.core.not.call(null, escaping__308895)
              }else {
                return and__3822__auto____308905
              }
            }else {
              return and__3822__auto____308904
            }
          }()) {
            var G__308934 = j__308898;
            var G__308935 = mode__308890;
            var G__308936 = openings__308891;
            var G__308937 = i__308889;
            var G__308938 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
            var G__308939 = families__308894;
            var G__308940 = true;
            var G__308941 = true;
            i__308889 = G__308934;
            mode__308890 = G__308935;
            openings__308891 = G__308936;
            start__308892 = G__308937;
            t__308893 = G__308938;
            families__308894 = G__308939;
            escaping__308895 = G__308940;
            in_word__308896 = G__308941;
            continue
          }else {
            if(function() {
              var and__3822__auto____308906 = cljs.core._EQ_.call(null, subpar.core.code, mode__308890);
              if(and__3822__auto____308906) {
                var and__3822__auto____308907 = cljs.core._EQ_.call(null, ";", a__308897);
                if(and__3822__auto____308907) {
                  return cljs.core.not.call(null, escaping__308895)
                }else {
                  return and__3822__auto____308907
                }
              }else {
                return and__3822__auto____308906
              }
            }()) {
              var G__308942 = j__308898;
              var G__308943 = subpar.core.cmmnt;
              var G__308944 = openings__308891;
              var G__308945 = start__308892;
              var G__308946 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
              var G__308947 = families__308894;
              var G__308948 = false;
              var G__308949 = false;
              i__308889 = G__308942;
              mode__308890 = G__308943;
              openings__308891 = G__308944;
              start__308892 = G__308945;
              t__308893 = G__308946;
              families__308894 = G__308947;
              escaping__308895 = G__308948;
              in_word__308896 = G__308949;
              continue
            }else {
              if(function() {
                var and__3822__auto____308908 = cljs.core._EQ_.call(null, subpar.core.cmmnt, mode__308890);
                if(and__3822__auto____308908) {
                  return cljs.core._EQ_.call(null, "\n", a__308897)
                }else {
                  return and__3822__auto____308908
                }
              }()) {
                var G__308950 = j__308898;
                var G__308951 = subpar.core.code;
                var G__308952 = openings__308891;
                var G__308953 = start__308892;
                var G__308954 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                var G__308955 = families__308894;
                var G__308956 = false;
                var G__308957 = false;
                i__308889 = G__308950;
                mode__308890 = G__308951;
                openings__308891 = G__308952;
                start__308892 = G__308953;
                t__308893 = G__308954;
                families__308894 = G__308955;
                escaping__308895 = G__308956;
                in_word__308896 = G__308957;
                continue
              }else {
                if(cljs.core._EQ_.call(null, subpar.core.cmmnt, mode__308890)) {
                  var G__308958 = j__308898;
                  var G__308959 = subpar.core.cmmnt;
                  var G__308960 = openings__308891;
                  var G__308961 = start__308892;
                  var G__308962 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                  var G__308963 = families__308894;
                  var G__308964 = false;
                  var G__308965 = false;
                  i__308889 = G__308958;
                  mode__308890 = G__308959;
                  openings__308891 = G__308960;
                  start__308892 = G__308961;
                  t__308893 = G__308962;
                  families__308894 = G__308963;
                  escaping__308895 = G__308964;
                  in_word__308896 = G__308965;
                  continue
                }else {
                  if(function() {
                    var and__3822__auto____308909 = cljs.core._EQ_.call(null, subpar.core.code, mode__308890);
                    if(and__3822__auto____308909) {
                      var and__3822__auto____308910 = cljs.core._EQ_.call(null, '"', a__308897);
                      if(and__3822__auto____308910) {
                        return cljs.core.not.call(null, escaping__308895)
                      }else {
                        return and__3822__auto____308910
                      }
                    }else {
                      return and__3822__auto____308909
                    }
                  }()) {
                    var G__308966 = j__308898;
                    var G__308967 = subpar.core.string;
                    var G__308968 = cljs.core.conj.call(null, openings__308891, i__308889);
                    var G__308969 = -1;
                    var G__308970 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                    var G__308971 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([i__308889, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY), cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'children", i__308889], true), j__308898);
                    var G__308972 = false;
                    var G__308973 = false;
                    i__308889 = G__308966;
                    mode__308890 = G__308967;
                    openings__308891 = G__308968;
                    start__308892 = G__308969;
                    t__308893 = G__308970;
                    families__308894 = G__308971;
                    escaping__308895 = G__308972;
                    in_word__308896 = G__308973;
                    continue
                  }else {
                    if(cljs.core.truth_(function() {
                      var and__3822__auto____308911 = cljs.core._EQ_.call(null, subpar.core.string, mode__308890);
                      if(and__3822__auto____308911) {
                        var and__3822__auto____308912 = cljs.core._EQ_.call(null, '"', a__308897);
                        if(and__3822__auto____308912) {
                          var and__3822__auto____308913 = cljs.core.not.call(null, escaping__308895);
                          if(and__3822__auto____308913) {
                            return in_word__308896
                          }else {
                            return and__3822__auto____308913
                          }
                        }else {
                          return and__3822__auto____308912
                        }
                      }else {
                        return and__3822__auto____308911
                      }
                    }())) {
                      var G__308974 = j__308898;
                      var G__308975 = subpar.core.code;
                      var G__308976 = cljs.core.pop.call(null, openings__308891);
                      var G__308977 = -1;
                      var G__308978 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                      var G__308979 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'closer"], true), i__308889), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__308891), "\ufdd0'children", o__308899], true), i__308889), cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'children", start__308892], true), i__308889 - 1);
                      var G__308980 = false;
                      var G__308981 = false;
                      i__308889 = G__308974;
                      mode__308890 = G__308975;
                      openings__308891 = G__308976;
                      start__308892 = G__308977;
                      t__308893 = G__308978;
                      families__308894 = G__308979;
                      escaping__308895 = G__308980;
                      in_word__308896 = G__308981;
                      continue
                    }else {
                      if(function() {
                        var and__3822__auto____308914 = cljs.core._EQ_.call(null, subpar.core.string, mode__308890);
                        if(and__3822__auto____308914) {
                          var and__3822__auto____308915 = cljs.core._EQ_.call(null, '"', a__308897);
                          if(and__3822__auto____308915) {
                            return cljs.core.not.call(null, escaping__308895)
                          }else {
                            return and__3822__auto____308915
                          }
                        }else {
                          return and__3822__auto____308914
                        }
                      }()) {
                        var G__308982 = j__308898;
                        var G__308983 = subpar.core.code;
                        var G__308984 = cljs.core.pop.call(null, openings__308891);
                        var G__308985 = -1;
                        var G__308986 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                        var G__308987 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'closer"], true), i__308889), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__308891), "\ufdd0'children", o__308899], true), i__308889);
                        var G__308988 = false;
                        var G__308989 = false;
                        i__308889 = G__308982;
                        mode__308890 = G__308983;
                        openings__308891 = G__308984;
                        start__308892 = G__308985;
                        t__308893 = G__308986;
                        families__308894 = G__308987;
                        escaping__308895 = G__308988;
                        in_word__308896 = G__308989;
                        continue
                      }else {
                        if(function() {
                          var and__3822__auto____308916 = cljs.core._EQ_.call(null, subpar.core.string, mode__308890);
                          if(and__3822__auto____308916) {
                            var and__3822__auto____308917 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__308897));
                            if(and__3822__auto____308917) {
                              return cljs.core.not.call(null, in_word__308896)
                            }else {
                              return and__3822__auto____308917
                            }
                          }else {
                            return and__3822__auto____308916
                          }
                        }()) {
                          var G__308990 = j__308898;
                          var G__308991 = subpar.core.string;
                          var G__308992 = openings__308891;
                          var G__308993 = i__308889;
                          var G__308994 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                          var G__308995 = cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'children", i__308889], true), i__308889);
                          var G__308996 = false;
                          var G__308997 = true;
                          i__308889 = G__308990;
                          mode__308890 = G__308991;
                          openings__308891 = G__308992;
                          start__308892 = G__308993;
                          t__308893 = G__308994;
                          families__308894 = G__308995;
                          escaping__308895 = G__308996;
                          in_word__308896 = G__308997;
                          continue
                        }else {
                          if(cljs.core.truth_(function() {
                            var and__3822__auto____308918 = cljs.core._EQ_.call(null, subpar.core.string, mode__308890);
                            if(and__3822__auto____308918) {
                              var and__3822__auto____308919 = subpar.core.whitespace_QMARK_.call(null, a__308897);
                              if(cljs.core.truth_(and__3822__auto____308919)) {
                                return in_word__308896
                              }else {
                                return and__3822__auto____308919
                              }
                            }else {
                              return and__3822__auto____308918
                            }
                          }())) {
                            var G__308998 = j__308898;
                            var G__308999 = subpar.core.string;
                            var G__309000 = openings__308891;
                            var G__309001 = -1;
                            var G__309002 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                            var G__309003 = cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'children", start__308892], true), i__308889 - 1);
                            var G__309004 = false;
                            var G__309005 = false;
                            i__308889 = G__308998;
                            mode__308890 = G__308999;
                            openings__308891 = G__309000;
                            start__308892 = G__309001;
                            t__308893 = G__309002;
                            families__308894 = G__309003;
                            escaping__308895 = G__309004;
                            in_word__308896 = G__309005;
                            continue
                          }else {
                            if(cljs.core._EQ_.call(null, subpar.core.string, mode__308890)) {
                              var G__309006 = j__308898;
                              var G__309007 = subpar.core.string;
                              var G__309008 = openings__308891;
                              var G__309009 = start__308892;
                              var G__309010 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                              var G__309011 = families__308894;
                              var G__309012 = false;
                              var G__309013 = in_word__308896;
                              i__308889 = G__309006;
                              mode__308890 = G__309007;
                              openings__308891 = G__309008;
                              start__308892 = G__309009;
                              t__308893 = G__309010;
                              families__308894 = G__309011;
                              escaping__308895 = G__309012;
                              in_word__308896 = G__309013;
                              continue
                            }else {
                              if(cljs.core.truth_(function() {
                                var and__3822__auto____308920 = subpar.core.opener_QMARK_.call(null, a__308897);
                                if(cljs.core.truth_(and__3822__auto____308920)) {
                                  return in_word__308896
                                }else {
                                  return and__3822__auto____308920
                                }
                              }())) {
                                var G__309014 = j__308898;
                                var G__309015 = subpar.core.code;
                                var G__309016 = cljs.core.conj.call(null, openings__308891, i__308889);
                                var G__309017 = -1;
                                var G__309018 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                                var G__309019 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'children", start__308892], true), i__308889 - 1), cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'children", i__308889], true), i__308889), cljs.core.PersistentVector.fromArray([i__308889, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY);
                                var G__309020 = false;
                                var G__309021 = false;
                                i__308889 = G__309014;
                                mode__308890 = G__309015;
                                openings__308891 = G__309016;
                                start__308892 = G__309017;
                                t__308893 = G__309018;
                                families__308894 = G__309019;
                                escaping__308895 = G__309020;
                                in_word__308896 = G__309021;
                                continue
                              }else {
                                if(cljs.core.truth_(subpar.core.opener_QMARK_.call(null, a__308897))) {
                                  var G__309022 = j__308898;
                                  var G__309023 = subpar.core.code;
                                  var G__309024 = cljs.core.conj.call(null, openings__308891, i__308889);
                                  var G__309025 = -1;
                                  var G__309026 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                                  var G__309027 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'children", i__308889], true), i__308889), cljs.core.PersistentVector.fromArray([i__308889, "\ufdd0'children"], true), cljs.core.ObjMap.EMPTY);
                                  var G__309028 = false;
                                  var G__309029 = false;
                                  i__308889 = G__309022;
                                  mode__308890 = G__309023;
                                  openings__308891 = G__309024;
                                  start__308892 = G__309025;
                                  t__308893 = G__309026;
                                  families__308894 = G__309027;
                                  escaping__308895 = G__309028;
                                  in_word__308896 = G__309029;
                                  continue
                                }else {
                                  if(cljs.core.truth_(function() {
                                    var and__3822__auto____308921 = subpar.core.closer_QMARK_.call(null, a__308897);
                                    if(cljs.core.truth_(and__3822__auto____308921)) {
                                      return in_word__308896
                                    }else {
                                      return and__3822__auto____308921
                                    }
                                  }())) {
                                    var G__309030 = j__308898;
                                    var G__309031 = subpar.core.code;
                                    var G__309032 = cljs.core.pop.call(null, openings__308891);
                                    var G__309033 = -1;
                                    var G__309034 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                                    var G__309035 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'children", start__308892], true), i__308889 - 1), cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'closer"], true), i__308889), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__308891), "\ufdd0'children", o__308899], true), i__308889);
                                    var G__309036 = false;
                                    var G__309037 = false;
                                    i__308889 = G__309030;
                                    mode__308890 = G__309031;
                                    openings__308891 = G__309032;
                                    start__308892 = G__309033;
                                    t__308893 = G__309034;
                                    families__308894 = G__309035;
                                    escaping__308895 = G__309036;
                                    in_word__308896 = G__309037;
                                    continue
                                  }else {
                                    if(cljs.core.truth_(subpar.core.closer_QMARK_.call(null, a__308897))) {
                                      var G__309038 = j__308898;
                                      var G__309039 = subpar.core.code;
                                      var G__309040 = cljs.core.pop.call(null, openings__308891);
                                      var G__309041 = -1;
                                      var G__309042 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                                      var G__309043 = cljs.core.assoc_in.call(null, cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'closer"], true), i__308889), cljs.core.PersistentVector.fromArray([cljs.core.second.call(null, openings__308891), "\ufdd0'children", o__308899], true), i__308889);
                                      var G__309044 = false;
                                      var G__309045 = false;
                                      i__308889 = G__309038;
                                      mode__308890 = G__309039;
                                      openings__308891 = G__309040;
                                      start__308892 = G__309041;
                                      t__308893 = G__309042;
                                      families__308894 = G__309043;
                                      escaping__308895 = G__309044;
                                      in_word__308896 = G__309045;
                                      continue
                                    }else {
                                      if(function() {
                                        var and__3822__auto____308922 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__308897));
                                        if(and__3822__auto____308922) {
                                          return cljs.core.not.call(null, in_word__308896)
                                        }else {
                                          return and__3822__auto____308922
                                        }
                                      }()) {
                                        var G__309046 = j__308898;
                                        var G__309047 = subpar.core.code;
                                        var G__309048 = openings__308891;
                                        var G__309049 = i__308889;
                                        var G__309050 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                                        var G__309051 = cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'children", i__308889], true), i__308889);
                                        var G__309052 = false;
                                        var G__309053 = true;
                                        i__308889 = G__309046;
                                        mode__308890 = G__309047;
                                        openings__308891 = G__309048;
                                        start__308892 = G__309049;
                                        t__308893 = G__309050;
                                        families__308894 = G__309051;
                                        escaping__308895 = G__309052;
                                        in_word__308896 = G__309053;
                                        continue
                                      }else {
                                        if(cljs.core.truth_(function() {
                                          var and__3822__auto____308923 = subpar.core.whitespace_QMARK_.call(null, a__308897);
                                          if(cljs.core.truth_(and__3822__auto____308923)) {
                                            return in_word__308896
                                          }else {
                                            return and__3822__auto____308923
                                          }
                                        }())) {
                                          var G__309054 = j__308898;
                                          var G__309055 = subpar.core.code;
                                          var G__309056 = openings__308891;
                                          var G__309057 = -1;
                                          var G__309058 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                                          var G__309059 = cljs.core.assoc_in.call(null, families__308894, cljs.core.PersistentVector.fromArray([o__308899, "\ufdd0'children", start__308892], true), i__308889 - 1);
                                          var G__309060 = false;
                                          var G__309061 = false;
                                          i__308889 = G__309054;
                                          mode__308890 = G__309055;
                                          openings__308891 = G__309056;
                                          start__308892 = G__309057;
                                          t__308893 = G__309058;
                                          families__308894 = G__309059;
                                          escaping__308895 = G__309060;
                                          in_word__308896 = G__309061;
                                          continue
                                        }else {
                                          if(cljs.core.truth_(function() {
                                            var and__3822__auto____308924 = subpar.core.whitespace_QMARK_.call(null, a__308897);
                                            if(cljs.core.truth_(and__3822__auto____308924)) {
                                              return cljs.core.not.call(null, in_word__308896)
                                            }else {
                                              return and__3822__auto____308924
                                            }
                                          }())) {
                                            var G__309062 = j__308898;
                                            var G__309063 = subpar.core.code;
                                            var G__309064 = openings__308891;
                                            var G__309065 = -1;
                                            var G__309066 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                                            var G__309067 = families__308894;
                                            var G__309068 = false;
                                            var G__309069 = false;
                                            i__308889 = G__309062;
                                            mode__308890 = G__309063;
                                            openings__308891 = G__309064;
                                            start__308892 = G__309065;
                                            t__308893 = G__309066;
                                            families__308894 = G__309067;
                                            escaping__308895 = G__309068;
                                            in_word__308896 = G__309069;
                                            continue
                                          }else {
                                            if(cljs.core.truth_(function() {
                                              var and__3822__auto____308925 = cljs.core.not.call(null, subpar.core.whitespace_QMARK_.call(null, a__308897));
                                              if(and__3822__auto____308925) {
                                                return in_word__308896
                                              }else {
                                                return and__3822__auto____308925
                                              }
                                            }())) {
                                              var G__309070 = j__308898;
                                              var G__309071 = subpar.core.code;
                                              var G__309072 = openings__308891;
                                              var G__309073 = start__308892;
                                              var G__309074 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray([mode__308890, o__308899], true));
                                              var G__309075 = families__308894;
                                              var G__309076 = false;
                                              var G__309077 = true;
                                              i__308889 = G__309070;
                                              mode__308890 = G__309071;
                                              openings__308891 = G__309072;
                                              start__308892 = G__309073;
                                              t__308893 = G__309074;
                                              families__308894 = G__309075;
                                              escaping__308895 = G__309076;
                                              in_word__308896 = G__309077;
                                              continue
                                            }else {
                                              if("\ufdd0'default") {
                                                var G__309078 = j__308898;
                                                var G__309079 = subpar.core.code;
                                                var G__309080 = openings__308891;
                                                var G__309081 = start__308892;
                                                var G__309082 = cljs.core.conj.call(null, t__308893, cljs.core.PersistentVector.fromArray(["?", o__308899], true));
                                                var G__309083 = families__308894;
                                                var G__309084 = escaping__308895;
                                                var G__309085 = in_word__308896;
                                                i__308889 = G__309078;
                                                mode__308890 = G__309079;
                                                openings__308891 = G__309080;
                                                start__308892 = G__309081;
                                                t__308893 = G__309082;
                                                families__308894 = G__309083;
                                                escaping__308895 = G__309084;
                                                in_word__308896 = G__309085;
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
  var vec__309091__309092 = subpar.core.get_info.call(null, cm);
  var cur__309093 = cljs.core.nth.call(null, vec__309091__309092, 0, null);
  var i__309094 = cljs.core.nth.call(null, vec__309091__309092, 1, null);
  var s__309095 = cljs.core.nth.call(null, vec__309091__309092, 2, null);
  if(cljs.core.truth_(subpar.core.in_string.call(null, s__309095, i__309094))) {
    cm.replaceRange(cljs.core.nth.call(null, pair, 0), cur__309093);
    return cm.setCursor(cur__309093.line, cur__309093.ch + 1)
  }else {
    return cm.compoundChange(function() {
      cm.replaceRange(pair, cur__309093);
      cm.setCursor(cur__309093.line, cur__309093.ch + 1);
      return cm.indentLine(cur__309093.line)
    })
  }
};
goog.exportSymbol("subpar.core.open_expression", subpar.core.open_expression);
subpar.core.forward_delete = function forward_delete(cm) {
  if(cljs.core.truth_(subpar.core.nothing_selected_QMARK_.call(null, cm))) {
    var vec__309113__309114 = subpar.core.get_info.call(null, cm);
    var cur__309115 = cljs.core.nth.call(null, vec__309113__309114, 0, null);
    var i__309116 = cljs.core.nth.call(null, vec__309113__309114, 1, null);
    var s__309117 = cljs.core.nth.call(null, vec__309113__309114, 2, null);
    var act__309118 = subpar.core.forward_delete_action.call(null, s__309117, i__309116);
    var s1__309119 = cm.posFromIndex(i__309116);
    var e1__309120 = cm.posFromIndex(i__309116 + 1);
    var s2__309121 = cm.posFromIndex(i__309116 - 1);
    var e2__309122 = e1__309120;
    var s3__309123 = s1__309119;
    var e3__309124 = cm.posFromIndex(i__309116 + 2);
    var pred__309125__309128 = cljs.core._EQ_;
    var expr__309126__309129 = act__309118;
    if(pred__309125__309128.call(null, 1, expr__309126__309129)) {
      return cm.replaceRange("", s1__309119, e1__309120)
    }else {
      if(pred__309125__309128.call(null, 2, expr__309126__309129)) {
        return cm.replaceRange("", s2__309121, e2__309122)
      }else {
        if(pred__309125__309128.call(null, 3, expr__309126__309129)) {
          return cm.replaceRange("", s3__309123, e3__309124)
        }else {
          if(pred__309125__309128.call(null, 4, expr__309126__309129)) {
            return cm.setCursor(e1__309120)
          }else {
            throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__309126__309129)].join(""));
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
    var vec__309147__309148 = subpar.core.get_info.call(null, cm);
    var cur__309149 = cljs.core.nth.call(null, vec__309147__309148, 0, null);
    var i__309150 = cljs.core.nth.call(null, vec__309147__309148, 1, null);
    var s__309151 = cljs.core.nth.call(null, vec__309147__309148, 2, null);
    var act__309152 = subpar.core.backward_delete_action.call(null, s__309151, i__309150);
    var s1__309153 = cm.posFromIndex(i__309150 - 1);
    var e1__309154 = cm.posFromIndex(i__309150);
    var s2__309155 = s1__309153;
    var e2__309156 = cm.posFromIndex(i__309150 + 1);
    var s3__309157 = cm.posFromIndex(i__309150 - 2);
    var e3__309158 = e1__309154;
    var pred__309159__309162 = cljs.core._EQ_;
    var expr__309160__309163 = act__309152;
    if(pred__309159__309162.call(null, 1, expr__309160__309163)) {
      return cm.replaceRange("", s1__309153, e1__309154)
    }else {
      if(pred__309159__309162.call(null, 2, expr__309160__309163)) {
        return cm.replaceRange("", s2__309155, e2__309156)
      }else {
        if(pred__309159__309162.call(null, 3, expr__309160__309163)) {
          return cm.replaceRange("", s3__309157, e3__309158)
        }else {
          if(pred__309159__309162.call(null, 4, expr__309160__309163)) {
            return cm.setCursor(s1__309153)
          }else {
            throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__309160__309163)].join(""));
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
  var vec__309175__309176 = subpar.core.get_info.call(null, cm);
  var cur__309177 = cljs.core.nth.call(null, vec__309175__309176, 0, null);
  var i__309178 = cljs.core.nth.call(null, vec__309175__309176, 1, null);
  var s__309179 = cljs.core.nth.call(null, vec__309175__309176, 2, null);
  var act__309180 = subpar.core.double_quote_action.call(null, s__309179, i__309178);
  var pred__309181__309184 = cljs.core._EQ_;
  var expr__309182__309185 = act__309180;
  if(pred__309181__309184.call(null, 0, expr__309182__309185)) {
    return subpar.core.open_expression.call(null, cm, '""')
  }else {
    if(pred__309181__309184.call(null, 1, expr__309182__309185)) {
      return cm.replaceRange('\\"', cur__309177)
    }else {
      if(pred__309181__309184.call(null, 2, expr__309182__309185)) {
        return subpar.core.go_to_index.call(null, cm, i__309178, i__309178 + 1)
      }else {
        if(pred__309181__309184.call(null, 3, expr__309182__309185)) {
          return cm.replaceRange('"', cur__309177)
        }else {
          throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__309182__309185)].join(""));
        }
      }
    }
  }
};
goog.exportSymbol("subpar.core.double_quote", subpar.core.double_quote);
subpar.core.close_expression = function close_expression(cm, c) {
  var vec__309198__309199 = subpar.core.get_info.call(null, cm);
  var cur__309200 = cljs.core.nth.call(null, vec__309198__309199, 0, null);
  var i__309201 = cljs.core.nth.call(null, vec__309198__309199, 1, null);
  var s__309202 = cljs.core.nth.call(null, vec__309198__309199, 2, null);
  var p__309203 = subpar.core.parse.call(null, s__309202);
  if(cljs.core.truth_(subpar.core.in_string_QMARK_.call(null, p__309203, i__309201))) {
    cm.replaceRange(c, cur__309200);
    return cm.setCursor(cur__309200.line, cur__309200.ch + 1)
  }else {
    var vec__309204__309205 = subpar.core.close_expression_vals.call(null, p__309203, i__309201);
    var del__309206 = cljs.core.nth.call(null, vec__309204__309205, 0, null);
    var beg__309207 = cljs.core.nth.call(null, vec__309204__309205, 1, null);
    var end__309208 = cljs.core.nth.call(null, vec__309204__309205, 2, null);
    var dst__309209 = cljs.core.nth.call(null, vec__309204__309205, 3, null);
    if(cljs.core.truth_(dst__309209)) {
      if(cljs.core.truth_(del__309206)) {
        cm.replaceRange("", cm.posFromIndex(beg__309207), cm.posFromIndex(end__309208))
      }else {
      }
      return subpar.core.go_to_index.call(null, cm, i__309201, dst__309209)
    }else {
      return null
    }
  }
};
goog.exportSymbol("subpar.core.close_expression", subpar.core.close_expression);
subpar.core.go = function go(cm, f) {
  var vec__309216__309217 = subpar.core.get_info.call(null, cm);
  var cur__309218 = cljs.core.nth.call(null, vec__309216__309217, 0, null);
  var i__309219 = cljs.core.nth.call(null, vec__309216__309217, 1, null);
  var s__309220 = cljs.core.nth.call(null, vec__309216__309217, 2, null);
  var j__309221 = f.call(null, s__309220, i__309219);
  return subpar.core.go_to_index.call(null, cm, i__309219, j__309221)
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
  var vec__309240__309242 = subpar.core.get_info.call(null, cm);
  var cur__309243 = cljs.core.nth.call(null, vec__309240__309242, 0, null);
  var i__309244 = cljs.core.nth.call(null, vec__309240__309242, 1, null);
  var s__309245 = cljs.core.nth.call(null, vec__309240__309242, 2, null);
  var vec__309241__309246 = subpar.core.forward_slurp_vals.call(null, s__309245, i__309244);
  var delimiter__309247 = cljs.core.nth.call(null, vec__309241__309246, 0, null);
  var si__309248 = cljs.core.nth.call(null, vec__309241__309246, 1, null);
  var di__309249 = cljs.core.nth.call(null, vec__309241__309246, 2, null);
  var ri__309250 = cljs.core.nth.call(null, vec__309241__309246, 3, null);
  if(cljs.core.truth_(ri__309250)) {
    var start__309251 = cm.posFromIndex(si__309248);
    var end__309252 = cm.posFromIndex(si__309248 + 1);
    var destination__309253 = cm.posFromIndex(di__309249);
    var line__309254 = start__309251.line;
    var update__309255 = function() {
      cm.replaceRange(delimiter__309247, destination__309253);
      cm.replaceRange("", start__309251, end__309252);
      return cljs.core.map.call(null, function(p1__309222_SHARP_) {
        return cm.indentLine(p1__309222_SHARP_)
      }, cljs.core.range.call(null, line__309254, line__309254 + ri__309250))
    };
    return cm.compoundChange(update__309255)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.forward_slurp", subpar.core.forward_slurp);
subpar.core.backward_slurp = function backward_slurp(cm) {
  var vec__309273__309275 = subpar.core.get_info.call(null, cm);
  var cur__309276 = cljs.core.nth.call(null, vec__309273__309275, 0, null);
  var i__309277 = cljs.core.nth.call(null, vec__309273__309275, 1, null);
  var s__309278 = cljs.core.nth.call(null, vec__309273__309275, 2, null);
  var vec__309274__309279 = subpar.core.backward_slurp_vals.call(null, s__309278, i__309277);
  var delimiter__309280 = cljs.core.nth.call(null, vec__309274__309279, 0, null);
  var si__309281 = cljs.core.nth.call(null, vec__309274__309279, 1, null);
  var di__309282 = cljs.core.nth.call(null, vec__309274__309279, 2, null);
  var ri__309283 = cljs.core.nth.call(null, vec__309274__309279, 3, null);
  if(cljs.core.truth_(ri__309283)) {
    var start__309284 = cm.posFromIndex(si__309281);
    var end__309285 = cm.posFromIndex(si__309281 + 1);
    var destination__309286 = cm.posFromIndex(di__309282);
    var line__309287 = start__309284.line;
    var update__309288 = function() {
      cm.replaceRange("", start__309284, end__309285);
      cm.replaceRange(delimiter__309280, destination__309286);
      return cljs.core.map.call(null, function(p1__309223_SHARP_) {
        return cm.indentLine(p1__309223_SHARP_)
      }, cljs.core.range.call(null, line__309287, line__309287 + ri__309283))
    };
    return cm.compoundChange(update__309288)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.backward_slurp", subpar.core.backward_slurp);
subpar.core.backward_barf = function backward_barf(cm) {
  var vec__309308__309310 = subpar.core.get_info.call(null, cm);
  var cur__309311 = cljs.core.nth.call(null, vec__309308__309310, 0, null);
  var i__309312 = cljs.core.nth.call(null, vec__309308__309310, 1, null);
  var s__309313 = cljs.core.nth.call(null, vec__309308__309310, 2, null);
  var vec__309309__309314 = subpar.core.backward_barf_vals.call(null, s__309313, i__309312);
  var delimiter__309315 = cljs.core.nth.call(null, vec__309309__309314, 0, null);
  var si__309316 = cljs.core.nth.call(null, vec__309309__309314, 1, null);
  var di__309317 = cljs.core.nth.call(null, vec__309309__309314, 2, null);
  var pad__309318 = cljs.core.nth.call(null, vec__309309__309314, 3, null);
  var ri__309319 = cljs.core.nth.call(null, vec__309309__309314, 4, null);
  if(cljs.core.truth_(ri__309319)) {
    var delimiter__309320 = cljs.core.truth_(pad__309318) ? [cljs.core.str(" "), cljs.core.str(delimiter__309315)].join("") : delimiter__309315;
    var destination__309321 = cm.posFromIndex(di__309317);
    var start__309322 = cm.posFromIndex(si__309316);
    var end__309323 = cm.posFromIndex(si__309316 + 1);
    var line__309324 = start__309322.line;
    var update__309325 = function() {
      cm.replaceRange(delimiter__309320, destination__309321);
      cm.replaceRange("", start__309322, end__309323);
      return cljs.core.map.call(null, function(p1__309256_SHARP_) {
        return cm.indentLine(p1__309256_SHARP_)
      }, cljs.core.range.call(null, line__309324, line__309324 + ri__309319))
    };
    return cm.compoundChange(update__309325)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.backward_barf", subpar.core.backward_barf);
subpar.core.forward_barf = function forward_barf(cm) {
  var vec__309346__309348 = subpar.core.get_info.call(null, cm);
  var cur__309349 = cljs.core.nth.call(null, vec__309346__309348, 0, null);
  var i__309350 = cljs.core.nth.call(null, vec__309346__309348, 1, null);
  var s__309351 = cljs.core.nth.call(null, vec__309346__309348, 2, null);
  var vec__309347__309352 = subpar.core.forward_barf_vals.call(null, s__309351, i__309350);
  var delimiter__309353 = cljs.core.nth.call(null, vec__309347__309352, 0, null);
  var si__309354 = cljs.core.nth.call(null, vec__309347__309352, 1, null);
  var di__309355 = cljs.core.nth.call(null, vec__309347__309352, 2, null);
  var pad__309356 = cljs.core.nth.call(null, vec__309347__309352, 3, null);
  var ri__309357 = cljs.core.nth.call(null, vec__309347__309352, 4, null);
  var i0__309358 = cljs.core.nth.call(null, vec__309347__309352, 5, null);
  if(cljs.core.truth_(ri__309357)) {
    var delimiter__309359 = cljs.core.truth_(pad__309356) ? [cljs.core.str(" "), cljs.core.str(delimiter__309353)].join("") : delimiter__309353;
    var destination__309360 = cm.posFromIndex(di__309355);
    var start__309361 = cm.posFromIndex(si__309354);
    var end__309362 = cm.posFromIndex(si__309354 + 1);
    var line__309363 = cm.posFromIndex(i0__309358).line;
    var update__309364 = function() {
      cm.replaceRange("", start__309361, end__309362);
      cm.replaceRange(delimiter__309359, destination__309360);
      return cljs.core.map.call(null, function(p1__309289_SHARP_) {
        return cm.indentLine(p1__309289_SHARP_)
      }, cljs.core.range.call(null, line__309363, line__309363 + ri__309357))
    };
    return cm.compoundChange(update__309364)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.forward_barf", subpar.core.forward_barf);
subpar.core.splice_delete_backward = function splice_delete_backward(cm) {
  var vec__309384__309386 = subpar.core.get_info.call(null, cm);
  var cur__309387 = cljs.core.nth.call(null, vec__309384__309386, 0, null);
  var i__309388 = cljs.core.nth.call(null, vec__309384__309386, 1, null);
  var s__309389 = cljs.core.nth.call(null, vec__309384__309386, 2, null);
  var vec__309385__309390 = subpar.core.splice_killing_backward.call(null, s__309389, i__309388);
  var start__309391 = cljs.core.nth.call(null, vec__309385__309390, 0, null);
  var end__309392 = cljs.core.nth.call(null, vec__309385__309390, 1, null);
  var closer__309393 = cljs.core.nth.call(null, vec__309385__309390, 2, null);
  var reindent__309394 = cljs.core.nth.call(null, vec__309385__309390, 3, null);
  var num__309395 = cljs.core.nth.call(null, vec__309385__309390, 4, null);
  if(cljs.core.truth_(reindent__309394)) {
    var line__309396 = cm.posFromIndex(reindent__309394).line;
    var c0__309397 = cm.posFromIndex(closer__309393);
    var c1__309398 = cm.posFromIndex(closer__309393 + 1);
    var s0__309399 = cm.posFromIndex(start__309391);
    var s1__309400 = cm.posFromIndex(end__309392);
    var update__309401 = function() {
      cm.replaceRange("", c0__309397, c1__309398);
      cm.replaceRange("", s0__309399, s1__309400);
      return cljs.core.map.call(null, function(p1__309326_SHARP_) {
        return cm.indentLine(p1__309326_SHARP_)
      }, cljs.core.range.call(null, line__309396, line__309396 + num__309395))
    };
    return cm.compoundChange(update__309401)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.splice_delete_backward", subpar.core.splice_delete_backward);
subpar.core.splice_delete_forward = function splice_delete_forward(cm) {
  var vec__309421__309423 = subpar.core.get_info.call(null, cm);
  var cur__309424 = cljs.core.nth.call(null, vec__309421__309423, 0, null);
  var i__309425 = cljs.core.nth.call(null, vec__309421__309423, 1, null);
  var s__309426 = cljs.core.nth.call(null, vec__309421__309423, 2, null);
  var vec__309422__309427 = subpar.core.splice_killing_forward.call(null, s__309426, i__309425);
  var opener__309428 = cljs.core.nth.call(null, vec__309422__309427, 0, null);
  var start__309429 = cljs.core.nth.call(null, vec__309422__309427, 1, null);
  var end__309430 = cljs.core.nth.call(null, vec__309422__309427, 2, null);
  var reindent__309431 = cljs.core.nth.call(null, vec__309422__309427, 3, null);
  var num__309432 = cljs.core.nth.call(null, vec__309422__309427, 4, null);
  if(cljs.core.truth_(reindent__309431)) {
    var line__309433 = cm.posFromIndex(reindent__309431).line;
    var o0__309434 = cm.posFromIndex(opener__309428);
    var o1__309435 = cm.posFromIndex(opener__309428 + 1);
    var s0__309436 = cm.posFromIndex(start__309429);
    var s1__309437 = cm.posFromIndex(end__309430);
    var update__309438 = function() {
      cm.replaceRange("", s0__309436, s1__309437);
      cm.replaceRange("", o0__309434, o1__309435);
      return cljs.core.map.call(null, function(p1__309365_SHARP_) {
        return cm.indentLine(p1__309365_SHARP_)
      }, cljs.core.range.call(null, line__309433, line__309433 + num__309432))
    };
    return cm.compoundChange(update__309438)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.splice_delete_forward", subpar.core.splice_delete_forward);
subpar.core.splice = function splice(cm) {
  var vec__309457__309459 = subpar.core.get_info.call(null, cm);
  var cur__309460 = cljs.core.nth.call(null, vec__309457__309459, 0, null);
  var i__309461 = cljs.core.nth.call(null, vec__309457__309459, 1, null);
  var s__309462 = cljs.core.nth.call(null, vec__309457__309459, 2, null);
  var vec__309458__309463 = subpar.core.splice_vals.call(null, s__309462, i__309461);
  var opener__309464 = cljs.core.nth.call(null, vec__309458__309463, 0, null);
  var closer__309465 = cljs.core.nth.call(null, vec__309458__309463, 1, null);
  var reindent__309466 = cljs.core.nth.call(null, vec__309458__309463, 2, null);
  var num__309467 = cljs.core.nth.call(null, vec__309458__309463, 3, null);
  if(cljs.core.truth_(reindent__309466)) {
    var line__309468 = cm.posFromIndex(reindent__309466).line;
    var o0__309469 = cm.posFromIndex(opener__309464);
    var o1__309470 = cm.posFromIndex(opener__309464 + 1);
    var c0__309471 = cm.posFromIndex(closer__309465);
    var c1__309472 = cm.posFromIndex(closer__309465 + 1);
    var update__309473 = function() {
      cm.replaceRange("", c0__309471, c1__309472);
      cm.replaceRange("", o0__309469, o1__309470);
      return cljs.core.map.call(null, function(p1__309402_SHARP_) {
        return cm.indentLine(p1__309402_SHARP_)
      }, cljs.core.range.call(null, line__309468, line__309468 + num__309467))
    };
    return cm.compoundChange(update__309473)
  }else {
    return null
  }
};
goog.exportSymbol("subpar.core.splice", subpar.core.splice);
subpar.core.indent_selection = function indent_selection(cm) {
  if(cljs.core.truth_(cm.somethingSelected())) {
    var start__309477 = cm.getCursor(true).line;
    var end__309478 = cm.getCursor(false).line;
    var f__309479 = function() {
      return cljs.core.map.call(null, function(p1__309439_SHARP_) {
        return cm.indentLine(p1__309439_SHARP_)
      }, cljs.core.range.call(null, start__309477, end__309478 + 1))
    };
    return cm.compoundChange(f__309479)
  }else {
    return cm.indentLine(cm.getCursor().line)
  }
};
goog.exportSymbol("subpar.core.indent_selection", subpar.core.indent_selection);
