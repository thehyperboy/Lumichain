function he(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var W={exports:{}},o={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var w=Symbol.for("react.element"),ye=Symbol.for("react.portal"),pe=Symbol.for("react.fragment"),ke=Symbol.for("react.strict_mode"),me=Symbol.for("react.profiler"),ve=Symbol.for("react.provider"),_e=Symbol.for("react.context"),we=Symbol.for("react.forward_ref"),ge=Symbol.for("react.suspense"),be=Symbol.for("react.memo"),xe=Symbol.for("react.lazy"),P=Symbol.iterator;function Ce(e){return e===null||typeof e!="object"?null:(e=P&&e[P]||e["@@iterator"],typeof e=="function"?e:null)}var q={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},V=Object.assign,B={};function v(e,t,r){this.props=e,this.context=t,this.refs=B,this.updater=r||q}v.prototype.isReactComponent={};v.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};v.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function T(){}T.prototype=v.prototype;function j(e,t,r){this.props=e,this.context=t,this.refs=B,this.updater=r||q}var D=j.prototype=new T;D.constructor=j;V(D,v.prototype);D.isPureReactComponent=!0;var O=Array.isArray,F=Object.prototype.hasOwnProperty,N={current:null},U={key:!0,ref:!0,__self:!0,__source:!0};function H(e,t,r){var n,i={},c=null,a=null;if(t!=null)for(n in t.ref!==void 0&&(a=t.ref),t.key!==void 0&&(c=""+t.key),t)F.call(t,n)&&!U.hasOwnProperty(n)&&(i[n]=t[n]);var u=arguments.length-2;if(u===1)i.children=r;else if(1<u){for(var s=Array(u),l=0;l<u;l++)s[l]=arguments[l+2];i.children=s}if(e&&e.defaultProps)for(n in u=e.defaultProps,u)i[n]===void 0&&(i[n]=u[n]);return{$$typeof:w,type:e,key:c,ref:a,props:i,_owner:N.current}}function Se(e,t){return{$$typeof:w,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function L(e){return typeof e=="object"&&e!==null&&e.$$typeof===w}function ze(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(r){return t[r]})}var I=/\/+/g;function A(e,t){return typeof e=="object"&&e!==null&&e.key!=null?ze(""+e.key):t.toString(36)}function S(e,t,r,n,i){var c=typeof e;(c==="undefined"||c==="boolean")&&(e=null);var a=!1;if(e===null)a=!0;else switch(c){case"string":case"number":a=!0;break;case"object":switch(e.$$typeof){case w:case ye:a=!0}}if(a)return a=e,i=i(a),e=n===""?"."+A(a,0):n,O(i)?(r="",e!=null&&(r=e.replace(I,"$&/")+"/"),S(i,t,r,"",function(l){return l})):i!=null&&(L(i)&&(i=Se(i,r+(!i.key||a&&a.key===i.key?"":(""+i.key).replace(I,"$&/")+"/")+e)),t.push(i)),1;if(a=0,n=n===""?".":n+":",O(e))for(var u=0;u<e.length;u++){c=e[u];var s=n+A(c,u);a+=S(c,t,r,s,i)}else if(s=Ce(e),typeof s=="function")for(e=s.call(e),u=0;!(c=e.next()).done;)c=c.value,s=n+A(c,u++),a+=S(c,t,r,s,i);else if(c==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return a}function C(e,t,r){if(e==null)return e;var n=[],i=0;return S(e,n,"","",function(c){return t.call(r,c,i++)}),n}function $e(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(r){(e._status===0||e._status===-1)&&(e._status=1,e._result=r)},function(r){(e._status===0||e._status===-1)&&(e._status=2,e._result=r)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var f={current:null},z={transition:null},Me={ReactCurrentDispatcher:f,ReactCurrentBatchConfig:z,ReactCurrentOwner:N};function Z(){throw Error("act(...) is not supported in production builds of React.")}o.Children={map:C,forEach:function(e,t,r){C(e,function(){t.apply(this,arguments)},r)},count:function(e){var t=0;return C(e,function(){t++}),t},toArray:function(e){return C(e,function(t){return t})||[]},only:function(e){if(!L(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};o.Component=v;o.Fragment=pe;o.Profiler=me;o.PureComponent=j;o.StrictMode=ke;o.Suspense=ge;o.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Me;o.act=Z;o.cloneElement=function(e,t,r){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var n=V({},e.props),i=e.key,c=e.ref,a=e._owner;if(t!=null){if(t.ref!==void 0&&(c=t.ref,a=N.current),t.key!==void 0&&(i=""+t.key),e.type&&e.type.defaultProps)var u=e.type.defaultProps;for(s in t)F.call(t,s)&&!U.hasOwnProperty(s)&&(n[s]=t[s]===void 0&&u!==void 0?u[s]:t[s])}var s=arguments.length-2;if(s===1)n.children=r;else if(1<s){u=Array(s);for(var l=0;l<s;l++)u[l]=arguments[l+2];n.children=u}return{$$typeof:w,type:e.type,key:i,ref:c,props:n,_owner:a}};o.createContext=function(e){return e={$$typeof:_e,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:ve,_context:e},e.Consumer=e};o.createElement=H;o.createFactory=function(e){var t=H.bind(null,e);return t.type=e,t};o.createRef=function(){return{current:null}};o.forwardRef=function(e){return{$$typeof:we,render:e}};o.isValidElement=L;o.lazy=function(e){return{$$typeof:xe,_payload:{_status:-1,_result:e},_init:$e}};o.memo=function(e,t){return{$$typeof:be,type:e,compare:t===void 0?null:t}};o.startTransition=function(e){var t=z.transition;z.transition={};try{e()}finally{z.transition=t}};o.unstable_act=Z;o.useCallback=function(e,t){return f.current.useCallback(e,t)};o.useContext=function(e){return f.current.useContext(e)};o.useDebugValue=function(){};o.useDeferredValue=function(e){return f.current.useDeferredValue(e)};o.useEffect=function(e,t){return f.current.useEffect(e,t)};o.useId=function(){return f.current.useId()};o.useImperativeHandle=function(e,t,r){return f.current.useImperativeHandle(e,t,r)};o.useInsertionEffect=function(e,t){return f.current.useInsertionEffect(e,t)};o.useLayoutEffect=function(e,t){return f.current.useLayoutEffect(e,t)};o.useMemo=function(e,t){return f.current.useMemo(e,t)};o.useReducer=function(e,t,r){return f.current.useReducer(e,t,r)};o.useRef=function(e){return f.current.useRef(e)};o.useState=function(e){return f.current.useState(e)};o.useSyncExternalStore=function(e,t,r){return f.current.useSyncExternalStore(e,t,r)};o.useTransition=function(){return f.current.useTransition()};o.version="18.3.1";W.exports=o;var y=W.exports;const We=he(y);/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae=e=>e==null?void 0:e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function Ee(e,t,r=[]){if(t==null)throw new Error("[lucide]: iconNode is required when icon name is used");return{name:Ae(e),size:24,node:t,...r.length>0?{aliases:r}:{}}}/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Re=e=>{let t="",r=!1;for(const n of e){if(n==="-"||n==="_"||n<=" "){r=t.length>0;continue}t.length===0?t+=n.toLowerCase():t+=r?n.toUpperCase():n,r=!1}return t};/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const je=e=>{const t=Re(e);return t.charAt(0).toUpperCase()+t.slice(1)};/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=(...e)=>e.filter((t,r,n)=>!!t&&t.trim()!==""&&n.indexOf(t)===r).join(" ").trim();/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function E(e){return e!=null}function De(e,t={}){var g,_;const r=t.attributeNames??{},n=d=>r[d]??d,i=e.size??e.width??p.width,c=e.size??e.height??p.height,a=((g=e.aliases)==null?void 0:g.filter(d=>typeof d=="string"&&d.trim()!=="").map(d=>`lucide-${d}`))??[],u=[...e.name?[`lucide-${e.name}`]:[],...a],s=((_=t.className)==null?void 0:_.split(" ").filter(Boolean))??[],l=t.includeDefaultClasses===!1?R(...s):R("lucide",...u,...s),$=t.absoluteStrokeWidth?Number(t.strokeWidth??p["stroke-width"])*Number(e.size??e.width??p.width)/Number(t.size??t.width??p.width):t.strokeWidth??p["stroke-width"];return["svg",{...Object.entries(p).reduce((d,[k,m])=>(d[n(k)]=m,d),{}),..."color"in t&&t.color&&{[n("stroke")]:t.color},..."size"in t&&E(t.size)&&{[n("width")]:t.size,[n("height")]:t.size},..."width"in t&&E(t.width)&&{[n("width")]:t.width},..."height"in t&&E(t.height)&&{[n("height")]:t.height},[n("stroke-width")]:$,...l&&{[n("class")]:l},[n("viewBox")]:`0 0 ${i} ${c}`,...t.hasA11yProp===!1?{[n("aria-hidden")]:"true"}:{},..."attributes"in t&&t.attributes},e.node.map(d=>{const[k,m,b]=d,x=t.nonScalingStroke?{[n("vector-effect")]:"non-scaling-stroke",...m}:m;return b?[k,x,b]:[k,x]})]}/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function Ne(e,t={}){return De(e,{...t,attributeNames:{...t.attributeNames,class:"className","stroke-width":"strokeWidth","stroke-linecap":"strokeLinecap","stroke-linejoin":"strokeLinejoin","vector-effect":"vectorEffect"}})}/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Le=e=>{for(const t in e)if(t.startsWith("aria-")||t==="role"||t==="title")return!0;return!1},Pe=y.createContext({}),Oe=()=>y.useContext(Pe),Ie=y.forwardRef(({color:e,size:t,width:r,height:n,strokeWidth:i,absoluteStrokeWidth:c,nonScalingStroke:a,className:u="",children:s,iconNode:l=[],icon:$={node:l,aliases:[],size:24},...M},g)=>{const{size:_=24,strokeWidth:d=2,absoluteStrokeWidth:k=!1,nonScalingStroke:m=!1,color:b="currentColor",className:x=""}=Oe()??{},ce=!!s||Le(M),[ue,ae,le=[]]=Ne($,{color:e??b,width:r??t??_,height:n??t??_,strokeWidth:i??d,absoluteStrokeWidth:c??k,nonScalingStroke:a??m,className:R(x,u),hasA11yProp:ce,attributes:M});return y.createElement(ue,{ref:g,...ae},[...le.map(([fe,de])=>y.createElement(fe,de)),...Array.isArray(s)?s:[s]])});/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function h(e,t=[],r=[]){const n=typeof e=="string"?Ee(e,t,r):e,i=y.forwardRef(({className:c,...a},u)=>y.createElement(Ie,{ref:u,icon:n,className:c,...a}));return n.name&&(i.displayName=je(n.name)),i}/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K={name:"activity",size:24,node:[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]]};K.node;const qe=h(K);/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G={name:"arrow-right",size:24,node:[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]};G.node;const Ve=h(G);/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J={name:"circle-check",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m16 9-5.5 5.5L8 12",key:"xofnsj"}]],aliases:["check-circle-2"]};J.node;const Be=h(J);/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q={name:"cpu",size:24,node:[["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M17 20v2",key:"1rnc9c"}],["path",{d:"M17 2v2",key:"11trls"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M2 17h2",key:"7oei6x"}],["path",{d:"M2 7h2",key:"asdhe0"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"M20 17h2",key:"1fpfkl"}],["path",{d:"M20 7h2",key:"1o8tra"}],["path",{d:"M7 20v2",key:"4gnj0m"}],["path",{d:"M7 2v2",key:"1i4yhu"}],["rect",{x:"4",y:"4",width:"16",height:"16",rx:"2",key:"1vbyd7"}],["rect",{x:"8",y:"8",width:"8",height:"8",rx:"1",key:"z9xiuo"}]]};Q.node;const Te=h(Q);/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const X={name:"database",size:24,node:[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]};X.node;const Fe=h(X);/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Y={name:"map",size:24,node:[["path",{d:"M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z",key:"169xi5"}],["path",{d:"M15 5.764v15",key:"1pn4in"}],["path",{d:"M9 3.236v15",key:"1uimfh"}]]};Y.node;const Ue=h(Y);/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee={name:"octagon-alert",size:24,node:[["path",{d:"M12 16h.01",key:"1drbdi"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z",key:"1fd625"}]],aliases:["alert-octagon"]};ee.node;const He=h(ee);/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const te={name:"refresh-cw",size:24,node:[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]};te.node;const Ze=h(te);/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ne={name:"server",size:24,node:[["rect",{width:"20",height:"8",x:"2",y:"2",rx:"2",ry:"2",key:"ngkwjq"}],["rect",{width:"20",height:"8",x:"2",y:"14",rx:"2",ry:"2",key:"iecqi9"}],["line",{x1:"6",x2:"6.01",y1:"6",y2:"6",key:"16zg32"}],["line",{x1:"6",x2:"6.01",y1:"18",y2:"18",key:"nzw8ys"}]]};ne.node;const Ke=h(ne);/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re={name:"shield-check",size:24,node:[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]};re.node;const Ge=h(re);/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oe={name:"triangle-alert",size:24,node:[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],aliases:["alert-triangle"]};oe.node;const Je=h(oe);/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ie={name:"wrench",size:24,node:[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",key:"1ngwbx"}]]};ie.node;const Qe=h(ie);/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se={name:"zap",size:24,node:[["path",{d:"M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z",key:"1v7up4"}]]};se.node;const Xe=h(se);export{qe as A,Te as C,Fe as D,Ue as M,He as O,Ze as R,Ge as S,Je as T,Qe as W,Xe as Z,Ke as a,Be as b,Ve as c,We as d,y as r};
