import "./index.scss";
import {app} from "./lib";
import swal from "sweetalert";

const searchBar = app.get(".searchBar");
const searchBtn = app.get(".searchBtn");
const header = app.get(".header");
const repoListContainer = app.get(".repolists");
let currentIdArr = [];

app.init = function(){
	window.addEventListener("scroll",()=>{
		app.evts.scrollPage();
		app.evts.chageSmallHeader();
	});
	searchBar.addEventListener("keydown",(e)=>{
		if(e.keyCode === 13 && app.disableRequest){
			swal("Rate Limit","Still not reset rate limit yet.","warning");
		}else	if(e.keyCode === 13 && searchBar.value && !app.disableRequest){
			app.searchRepos(searchBar.value,app.prevSearchValue);
		}else if(e.keyCode === 13 && !searchBar.value){
			swal("You need to type something for search");
		}
	});
	searchBtn.addEventListener("click",(e)=>{
		if(app.disableRequest){
			swal("Rate Limit","Still not reset rate limit yet.","warning");
		}else	if(searchBar.value && !app.disableRequest){
			app.searchRepos(searchBar.value,app.prevSearchValue);
		}else if(!searchBar.value){
			swal("You need to type something for search");
		}
	});
};

app.searchRepos = function (searchvalue,preveSearchvalue) {
	app.prevSearchValue = searchBar.value;
	if(searchvalue === preveSearchvalue) return;
	else if(searchvalue !== preveSearchvalue){			
		currentIdArr.length = 0;
		repoListContainer.innerHTML = "";
		app.sortRule = "";
		searchBar.disabled = true;
		app.dataLoading = true;
		app.getRepos(1,searchvalue).then(data=>{
			app.page = 1;
			app.maxPage = Math.ceil(data.total_count / 20);
			app.searchValue = searchBar.value;
			app.showRepos(data);
		}).catch(error=>{
			console.log(error);
		});
	}
};

app.evts.chageSmallHeader = function () {
	let y = window.pageYOffset;
	if(y >= 200 && !app.changeSmallHeader){
		header.className = "header smallHeader";
		app.changeSmallHeader = true;
	}else if(y < 200 && app.changeSmallHeader){
		header.className = "header";
		app.changeSmallHeader = false;
	}
};

app.evts.scrollPage = function(e){
	let lastRepo; 
	let lastRepoOffset; 
	let pageOffset; 
	let bottomOffset;
	if(app.pageLoading === true){ 
		return;
	}
	if(app.maxPage <= app.page) return;
	if(currentIdArr.length !== 0){
		lastRepo = document.querySelector("div.repolists > div:last-child");
		lastRepoOffset = lastRepo.offsetTop + lastRepo.clientHeight;
		pageOffset = window.pageYOffset + window.innerHeight;
		bottomOffset = 20;
	}

	if(pageOffset > lastRepoOffset - bottomOffset && app.disableRequest){
		swal("Rate Limit","Still not reset rate limit yet.","warning");
		window.scrollTo(0, lastRepoOffset - 2000);
	}else	if(pageOffset > lastRepoOffset - bottomOffset && !app.disableRequest){
		if(app.page < app.maxPage && !app.dataLoading){
			app.page = app.page + 1;
			app.pageLoading = true;
			app.getRepos(app.page,app.searchValue,app.sortOrder)
				.then(data=>{
					app.showRepos(data);
				})
				.catch(error=>{
					console.log(error);
				});
		}
	}
};

app.evts.sortSearch = function (e) {
	if(app.disableRequest){
		swal("Rate Limit","Still not reset rate limit yet.","warning");
		let selectContainer = app.get("select");
		if(app.sortRule){
			selectContainer.value = app.sortRule;
		}else{
			selectContainer.value = "bestMatch";
		}		
	}else if(!app.disableRequest){
		repoListContainer.innerHTML = "";
		app.page = 1;
		currentIdArr.length = 0;
		app.dataLoading = true;
		app.sortRule = e.target.value;
		switch (app.sortRule) {
		case "bestMatch":app.sortOrder =  "";
			break;
		case "starDesc":app.sortOrder = "&sort=stars&order=desc";
			break;
		case "starAsc":app.sortOrder = "&sort=stars&order=asc";
			break;
		case "forkDesc":app.sortOrder = "&sort=forks&order=desc";
			break;
		case "forkAsc":app.sortOrder = "&sort=forks&order=asc";
			break;
		default:sortOrder = "";
		}
		app.getRepos(app.page,app.searchValue,app.sortOrder)
			.then(data=>{
				app.showRepos(data);
			})
			.catch(error=>{
				console.log(error);
			});;
	}
};

app.getRepos = function (page,searchValue,sortOrder = "") {
	let refreshTime;
	let timeNow;
	let waitTime;
	let lastRepo;
	let lastRepoOffset;
	let pageOffset;
	let bottomOffset;
	let timeoutId;
	return fetch(`${app.cst.API_HOST}&page=${page}&per_page=20&q=${searchValue}${sortOrder}`, {
		method: "get",
		headers:{},
	})
		.then(response=> {
			searchBar.disabled = false;
			app.dataLoading = false;
			app.pageLoading = false;
			if(response.status !== 403){
				let remainLimit = response.headers.get("x-ratelimit-remaining");
				return response.json();
			}else if(response.status === 403 ){
				// avoid when error search value is equal to previous value
				if(currentIdArr.length === 0){
					app.prevSearchValue = "";
				}
				// set page to prevstate
				app.page = app.page - 1;
				refreshTime = new Date(response.headers.get("x-ratelimit-reset") * 1000);
				timeNow = new Date();
				waitTime = new Date(refreshTime - timeNow).getSeconds();
				if(currentIdArr.length !== 0){
					lastRepo = document.querySelector("div.repolists > div:last-child");
					lastRepoOffset = lastRepo.offsetTop + lastRepo.clientHeight;
					pageOffset = window.pageYOffset + window.innerHeight;
					bottomOffset = 20;
				}
				if(pageOffset > lastRepoOffset - bottomOffset){					
					window.scrollTo(0, lastRepoOffset - 2000);
				}
				if(!app.clearTimeOut && refreshTime > timeNow){
					timeoutId = setTimeout(() => {
						app.disableRequest = false;
						app.clearTimeOut = null;
						swal(`You can request data now`);
						//let scroll bar scroll up a little
						if(currentIdArr.length !== 0){
							lastRepo = document.querySelector("div.repolists > div:last-child");
							lastRepoOffset = lastRepo.offsetTop + lastRepo.clientHeight;
							pageOffset = window.pageYOffset + window.innerHeight;
							bottomOffset = 20;
						}
						if(pageOffset > lastRepoOffset - bottomOffset){
							window.scrollTo(0, lastRepoOffset - 2000);
						}
					}, waitTime * 1000);
					app.disableRequest = true;
					app.clearTimeOut = timeoutId;
					swal(`Rate Limit`,`You request too many times in one minute, please wait for ${waitTime} second(s) to reset`,"warning");
				}
				return response.json();
			}
		})
		.catch(error=> {
			console.log(error);
		});
};

app.showRepos = function(data){
	let container = app.get(".repolists");
	let reopItems = data.items;
	let newRpoIdArr = reopItems.map(repo=>{
		return repo["id"]; 
	});
	reopItems = reopItems.filter(repo=>{
		return !(currentIdArr.includes(repo["id"]));
	});
	currentIdArr = currentIdArr.concat(newRpoIdArr.filter(id=>{
		return !(currentIdArr.includes(id)); 
	}));

	if(reopItems.length === 0){
		app.createElement("h2", {
			atrs:{
				className:"no-result",
				textContent:`No Result for ${searchBar.value}`
			}
		}, container);
	}else{
		if(app.page === 1){
			let total_count = data.total_count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			let resultAmount = app.createElement("h2", {
				atrs:{
					className:"repoamount",
					textContent:`${total_count} repository results of ${searchBar.value}( 20 results per request )`
				}
			}, container);
			let selectContainer = app.createElement("select",{evts:{change:app.evts.sortSearch}},resultAmount);
			let bestMatch = app.createElement("option",{
				atrs:{
					value:"bestMatch",
					textContent:"Sort : Best match"
				}
			},selectContainer);
			let mostStar = app.createElement("option",{
				atrs:{
					value:"starDesc",
					textContent:"Sort: Most stars"
				}
			},selectContainer);
			let lessStar = app.createElement("option",{
				atrs:{
					value:"starAsc",
					textContent:"Sort: Less stars"
				}
			},selectContainer);
			let mostFork = app.createElement("option",{
				atrs:{
					value:"forkDesc",
					textContent:"Sort: Most forks "
				}
			},selectContainer);
			let lessFork = app.createElement("option",{
				atrs:{
					value:"forkAsc",
					textContent:"Sort: Less forks"
				}
			},selectContainer);
			if(app.sortRule){
				let selectOption = app.get(`select option[value=${app.sortRule}]`);
				selectOption.setAttribute("selected","selcted");
			}

		}	
		for(let i = 0;i < reopItems.length;i++){
			let repo = reopItems[i];
			let repoContainer = app.createElement("div", {atrs:{className:"repo"}}, container);
			let repoDetail = app.createElement("div", {atrs:{className:"repoDetail"}}, repoContainer);
			let repoLeft = app.createElement("div", {atrs:{className:"repoLeft"}}, repoDetail);
			let repoTitle = app.createElement("h3","",repoLeft);
			let repoLink = app.createElement("a",{
				atrs:{
					href:repo.html_url,
					textContent:`${repo.full_name}`
				}
			},repoTitle);
			let description = app.createElement("p",{atrs:{textContent:repo.description}},repoLeft);
			let descriptionStrong = app.createElement("strong",{atrs:{textContent:"Description: "}},description);
			description.insertAdjacentElement("afterbegin",descriptionStrong);
			let language = app.createElement("p",{atrs:{textContent:repo.language}},repoLeft);
			let languageStrong = app.createElement("strong",{atrs:{textContent:"Language: "}},language);
			language.insertAdjacentElement("afterbegin",languageStrong);
			let repoRight = app.createElement("div", {atrs:{className:"repoRight"}}, repoDetail);
			let starLink = app.createElement("a",{
				atrs:{
					className:"starLink",
					href:`${repo.html_url}/stargazers`
				}
			},repoRight);
			let statImage = app.createElement("span",{atrs:{className:"starimage"}},starLink);
			let starAmount = repo.stargazers_count >= 1000 ? Math.round(repo.stargazers_count / 1000 * 10) / 10  + "k" : repo.stargazers_count;
			let starAmounSpan = app.createElement("span",{
				atrs:{
					className:"staramount",
					textContent:starAmount
				}
			},starLink);
		}
	}
};

window.addEventListener("DOMContentLoaded", app.init);