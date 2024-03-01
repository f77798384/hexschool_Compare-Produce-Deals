const url =         //資料連結
'https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx?IsTransData=1&UnitId=037';
let num = 10;       //每頁顯示
let pageNow = 0;    //目前頁面
let pageNext = 1;   //目標頁面
let data = [];      //原始資料
let filterData = [];//分割後資料
let showlist=[];    //顯示資料
let type = '';      //種類名稱
let loading = true; //是否尚在loading
let sort = false;   //是否進行sort
let searchName = '';//搜尋關鍵字
//時間設定
let Today = new Date();
let Year = Today.getFullYear()-1911;
let Month = Today.getMonth()+1;
let Day = Today.getDate()+4;
//資料抓取
$.get(url, function (response) {
    data = response;
    let i =0
    while(
        (data.find(items => {
            let Date = items['交易日期'].split('.');
            return Date[0] == Year && Date[1] == Month && Date[2] == Day
        }) == undefined)
    ){
        i++;
        Today = new Date(`${Year+1911}.${Month}.${Day-1}`)
        Year = Today.getFullYear()-1911;
        Month = Today.getMonth()+1;
        Day = Today.getDate()
        if(i >7){
            break;
        }
    }
    Today = `${Year}.${Month < 10 ? '0'+Month : Month}.${Day < 10 ? '0'+Day : Day}`;
    $('.data-Date p').text(`資料日期：${Today}`);
    $('.filter-list tr td').text('請輸入並搜尋想比價的作物名稱^＿^');
    loading = false;
});
//資料分割
function LayoutData(pageNext,pageNow){
    if(isNaN(pageNext) || pageNext == pageNow){//頁籤沒有變動
        return;
    }else if(loading){//尚未讀取完成
        $('.filter-list').html('');
        $('.btn-group .active').removeClass('active');
        $('.pageArea').addClass('hide');
        $('.keywords').addClass('hide');
        $('.filter-list').html(`<tr><td colspan="7" class="">請等資料載入完畢</td></tr>`);
    }else{
        //先清空資料
        $('.filter-list').html('');
        $('.filter-list').html(`<tr><td colspan="7" class="">資料載入中......</td></tr>`);
        let str = '';
        let count =0;
        showlist = [];
        if(type){//搜尋類型確認
            filterData = data.filter(item => item['作物名稱'] != null && item['交易日期'] == Today && item['種類代碼'] == type);
            $('.keywords span').text($('.btn-group .active').text().trim()).attr('data-type',$('.btn-group .active').data('type')).removeAttr('data-searchname');
        }else if(searchName){
            filterData = data.filter(item => item['作物名稱'] != null && item['交易日期'] == Today && item['作物名稱'].includes(searchName));
            $('.keywords span').text(searchName.trim()).attr('data-searchname',searchName.trim()).removeAttr('data-type');
        }
        if(filterData.length<1){//無資料時的狀況
            $('.filter-list').html(`<tr><td colspan="7" class="">無相關資料</td><\tr>`);
        }else{
            filterData.forEach(function(item){
                str +=`<tr>
                <td class="crop-name">${item['作物名稱']}</td>
                <td class="market-name">${item['市場名稱']}</td>
                <td>${item['上價']}</td>
                <td>${item['中價']}</td>
                <td>${item['下價']}</td>
                <td>${item['平均價']}</td>
                <td>${item['交易量']}</td>
                </tr>
                `;
                count++;
                if (count % num == 0 || count == filterData.length) {
                    showlist.push(str);
                    str = '';
                }else{
                    return;
                }
            });
        }
    }
    type = '';
    searchName = '';
    $('.crop-input-box').val('');
}
//資料渲染{num:每頁顯示數量,pageNow:目前所在第幾頁}
function renderData(pageNext,pageNow){
    if(isNaN(pageNext) || pageNext == pageNow){//頁籤沒有變動
        return;
    }else if(filterData.length<1){//無資料收起頁籤區
        $('.pageArea').addClass('hide');
        return;
    }else{
        //清空table
        $('.filter-list').html('');
        pageNow = pageNext;
        //清空頁數標籤
        $('.pageArea li').remove('.page-num');
        //如果頁數<=3則從1開始，如果頁數+2大於等於總頁數則從總頁數-4開始，不然從頁數-2開始
        let count = pageNext-2 <= 1 ? 1 : pageNext +2 >= showlist.length ? showlist.length-4 : pageNext -2;
        //當頁籤滿五個或者長度與總頁數相等時就停止
        for(let i = 0 ; i < 5 && count <=showlist.length ; i++ ){
            $(`<li class="fa-solid page-num ${(count == pageNext ? ' active' :'')}" page-num="
            ${count}">${count}</li>`).insertBefore($('.pageArea .next'));
            count++;
        }
        //前後頁籤調整
        $('.pageArea .prev').attr('page-num',pageNext-1 <= 0 ? 1:pageNext-1);
        $('.pageArea .next').attr('page-num',pageNext+1 >= showlist.length ? showlist.length : pageNext+1);
        $('.filter-list').html(showlist[pageNow-1]);
        $('.pageArea .last').attr('page-num',showlist.length);
        //重新顯示搜尋提示、頁籤區域
        $('.pageArea').removeClass('hide');
        $('.keywords').removeClass('hide');
    }
    switch (pageNow) {//調整頁籤顯示狀態
        case 1:
            if(showlist.length == 1){
                $('.pageArea .first ,.pageArea .prev,.pageArea .next ,.pageArea .last').addClass('unactive');
                break;
            }else{
                $('.pageArea .first ,.pageArea .prev').addClass('unactive');
                $('.pageArea .next ,.pageArea .last').removeClass('unactive');
                break;
            }
        case showlist.length:
            $('.pageArea .first ,.pageArea .prev').removeClass('unactive');
            $('.pageArea .next ,.pageArea .last').addClass('unactive');
            break;
        default:
            $('.pageArea .first ,.pageArea .prev').removeClass('unactive');
            $('.pageArea .next ,.pageArea .last').removeClass('unactive');
            break;
    }
}
//btn-group觸發
$('.btn-group').click(function (e) { 
    searchName = '';
    $(e.target).addClass('active').siblings().removeClass('active');
    $('.sort-table th i.active').removeClass('active');
    type = ($('.btn-group').find('.active').attr('data-type') == '' ? '' : $('.btn-group').find('.active').attr('data-type'));
    if(type){
        LayoutData(1,0);
        renderData(1,0);
    }
});
//search觸發
$('.search-btn').click(function(e){
    $('.btn-group .btn').removeClass('active');
    $('.sort-table th i.active').removeClass('active');
    type = '';
    searchName = $('.crop-input-box').val().trim();
    LayoutData(1,0);
    renderData(1,0);
})
//Enter觸發search
$('.crop-input-box').keypress(function (e) { 
    if(e.key==="Enter"){
        e.preventDefault();
        $('.search-btn').click();
    }
    return;
});
//sort-option觸發
$('.sort-option').change(function(e){
    if(e.target.value){
        filterData = filterData.sort((a,b) => a[e.target.value]-b[e.target.value]);
    }
    LayoutData(1,0);
    renderData(1,0);
})
//num-option觸發
$('.num-option').change(function(e){
    num = e.target.value;
    LayoutData(1,0);
    renderData(1,0);
})
//pageSwitch
$('.pageArea').click(function(e){
    pageNext = parseInt(e.target.getAttribute('page-num'));
    renderData(pageNext,pageNow);
})
//sort-table觸發
$('.sort-table th').click(function (e) {
    let SortActive = $(this).find('i.active').data('sort');
    let SortItem = $(this).closest('th').text().trim();
    //移除所有active
    $('.sort-table th i.active').removeClass('active');
    switch (SortActive) {
        case 'Raising':
            $(this).find('i.sort-down').addClass('active');
            filterData = filterData.sort((a,b) => b[SortItem]-a[SortItem]);
            break;
        case 'Lowering':
            let key = $('.keywords span').attr('data-type') == undefined ? 'searchname' :'type';
            let value = $('.keywords span').attr('data-type') == undefined ? $('.keywords span').attr('data-searchname') :$('.keywords span').attr('data-type');
            switch (key) {
                case 'type':
                    type = value;
                    break;
                case 'searchname':
                    searchName = value;
                    break;
                default:
                    break;
            }
            break;
        default:
            $(this).find('i.sort-up').addClass('active')
            filterData = filterData.sort((a,b) => a[SortItem]-b[SortItem]);
            break;
    }
    LayoutData(1,0);
    renderData(1,0);
})