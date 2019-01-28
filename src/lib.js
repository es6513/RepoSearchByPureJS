let app = {
	state:{},
	page:0,
	maxPage:0,
	prevSearchValue:null,
	sortRule:"",
	sortOrder:"",
	searchValue:null,
	dataLoading:false,
	pageLoading:false,
	changeSmallHeader:false,
	disableRequest:false,
	clearTimeOut:null,
	evts:{},
	cst:{API_HOST:"https://api.github.com/search/repositories?"}
};

app.get = function(selector){
	return document.querySelector(selector);
};

app.setAttributes = function(obj,attributes){
	for(let name in attributes){
		obj[name] = attributes[name];
	}
	return obj;
};

app.setEventHandlers = function(obj,eventHandlers){
	for(let name in eventHandlers){
		if(eventHandlers[name] instanceof Array){
			for(let i = 0;i < eventHandlers[name].length;i++){
				obj.addEventListener(name,eventHandlers[name][i]);
			}
		}else{
			obj.addEventListener(name,eventHandlers[name]);
		}
	}
	return obj;
};

app.createElement = function(tagName,settings,parentElement){
	let obj = document.createElement(tagName);
	if(settings.atrs){app.setAttributes(obj,settings.atrs);}
	if(settings.evts){app.setEventHandlers(obj,settings.evts);}
	if(parentElement instanceof Element){parentElement.appendChild(obj);}
	return obj;
};

export {app};