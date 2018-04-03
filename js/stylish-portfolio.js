(function($) {
  "use strict"; // Start of use strict

  // Closes the sidebar menu
  $(".menu-toggle").click(function(e) {
    e.preventDefault();
    $("#sidebar-wrapper").toggleClass("active");
    $(".menu-toggle > .fa-bars, .menu-toggle > .fa-times").toggleClass("fa-bars fa-times");
    $(this).toggleClass("active");
  });

  // Smooth scrolling using jQuery easing
  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function() {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 1000, "easeInOutExpo");
        return false;
      }
    }
  });

  // Closes responsive menu when a scroll trigger link is clicked
  $('#sidebar-wrapper .js-scroll-trigger').click(function() {
    $("#sidebar-wrapper").removeClass("active");
    $(".menu-toggle").removeClass("active");
    $(".menu-toggle > .fa-bars, .menu-toggle > .fa-times").toggleClass("fa-bars fa-times");
  });

  // Scroll to top button appear
  $(document).scroll(function() {
    var scrollDistance = $(this).scrollTop();
    if (scrollDistance > 100) {
      $('.scroll-to-top').fadeIn();
    } else {
      $('.scroll-to-top').fadeOut();
    }
  });

  // 맵 변수 선언
  var headers = {};
  headers["appKey"]="2742f43e-b608-47b7-aa94-a951253c81d0";//실행을 위한 키 입니다. 발급받으신 AppKey를 입력하세요.

  var map, markerLayer, routeLayer;
  var marker_start, marker_end;
  window.start_position;
  window.end_position;
  var prtcl, xmlDoc;


  // map 생성함수 선언
  function initTmap(){
    // Tmap.map을 이용하여, 지도가 들어갈 div, 넓이, 높이를 설정합니다.
    map = new Tmap.Map({div:'tmap', // map을 표시해줄 div
                width:'100%',  // map의 width 설정
                height:'100%' // map의 height 설정
    }); 
    map.events.register("click", map, onClick);//map 클릭 이벤트를 등록합니다.

    markerLayer = new Tmap.Layer.Markers();//맵 레이어 생성
    map.addLayer(markerLayer);//map에 맵 레이어를 추가합니다


    routeLayer = new Tmap.Layer.Vector("route");//벡터 레이어 생성
    map.addLayer(routeLayer);//map에 벡터 레이어 추가
  } 

  function onClick(e){
    console.log("onclick");

    var lonlat = map.getLonLatFromViewPortPx(e.xy).transform("EPSG:3857", "EPSG:4326");//클릭 부분의 ViewPortPx를 LonLat 좌표로 변환합니다.
    var size = new Tmap.Size(24, 38);//아이콘 사이즈 설정
    var offset = new Tmap.Pixel(-(size.w/2), -(size.h));//아이콘 중심점 설정

    var icon;

    if (!marker_start) {
      icon = new Tmap.Icon('http://tmapapis.sktelecom.com/upload/tmap/marker/pin_r_m_s.png',size, offset);//마커 아이콘 설정
      marker_start = new Tmap.Marker(lonlat.transform("EPSG:4326", "EPSG:3857"), icon);//마커 생성
      markerLayer.addMarker(marker_start);//마커 레이어에 마커 추가
      window.start_position = lonlat;
      write_result("출발지가 선택되었습니다.");
    } else if (!marker_end ){
      icon = new Tmap.Icon('http://tmapapis.sktelecom.com/upload/tmap/marker/pin_r_m_e.png',size, offset);//마커 아이콘 설정
      marker_end = new Tmap.Marker(lonlat.transform("EPSG:4326", "EPSG:3857"), icon);//마커 생성
      markerLayer.addMarker(marker_end);//마커 레이어에 마커 추가
      write_result("도착지가 선택되었습니다.");
      window.end_position = lonlat;
    } else {
      write_result("출발지와 도착지가 이미 선택되었습니다. 새로 지정하시려면 초기화 버튼을 클릭해 주세요~!");
    }
  }


  // 결과 출
  function write_result(text) {
    var resultDiv = document.getElementById("result_box");
    resultDiv.innerHTML = text;
  }

  // 맵 생성 실행
  initTmap();


  $('#reset_btn').click(function() {
    markerLayer.removeMarker(marker_start); // 기존 마커 삭제;
    marker_start = null;
    window.start_position = null;
    markerLayer.removeMarker(marker_end); // 기존 마커 삭제;
    marker_end = null;
    window.end_position = null;
    routeLayer.removeAllFeatures();//레이어의 모든 도형을 지웁니다.
    write_result('초기화 되었습니다.');
  });

  $('#find_btn').click(function() {

    console.log("click");

    if (!marker_start) {
      write_result("출발지를 선택해주세요!");
      return;
    } else if (!marker_end ){
      write_result("출발지를 선택해주세요!");
      return;
    }

    $.ajax({
      method:"POST",
      headers : headers,
      url:"https://api2.sktelecom.com/tmap/routes?version=1&format=xml",//자동차 경로안내 api 요청 url입니다.
      async:false,
      data:{
        //출발지 위경도 좌표입니다.
        startX : window.start_position.lon,
        startY : window.start_position.lat,
        //목적지 위경도 좌표입니다.
        endX : window.end_position.lon,
        endY : window.end_position.lat,
        //출발지, 경유지, 목적지 좌표계 유형을 지정합니다.
        reqCoordType : "EPSG3857",
        resCoordType : "EPSG3857",
        //각도입니다.
        angle : "172",
        //경로 탐색 옵션 입니다.
        searchOption : 0
      },
      //데이터 로드가 성공적으로 완료되었을 때 발생하는 함수입니다.
      success:function(response){

        if (!response) {
          write_result('길찾기 검색을 실패하였습니다.');
          return;
        }

        prtcl = response;

        // 결과 출력
        var innerHtml ="";
        var prtclString = new XMLSerializer().serializeToString(prtcl);//xml to String
        var xmlDoc = $.parseXML( prtclString );
        var xml = $( xmlDoc );
        var intRate = xml.find("Document");

        var tDistance = "총 거리 : "+(intRate[0].getElementsByTagName("tmap:totalDistance")[0].childNodes[0].nodeValue/1000).toFixed(1)+"km \n";
        var tTime = " 총 시간 : "+(intRate[0].getElementsByTagName("tmap:totalTime")[0].childNodes[0].nodeValue/60).toFixed(0)+"분 \n ";
        var tFare = " 총 요금 : "+intRate[0].getElementsByTagName("tmap:totalFare")[0].childNodes[0].nodeValue+"원 \n";
        var taxiFare = " 예상 택시 요금 : "+intRate[0].getElementsByTagName("tmap:taxiFare")[0].childNodes[0].nodeValue+"원 ";

        $("#result_box").text(tDistance+tTime+tFare+taxiFare);
        prtcl = new Tmap.Format.KML({extractStyles:true, extractAttributes:true}).read(prtcl);//데이터(prtcl)를 읽고, 벡터 도형(feature) 목록을 리턴합니다.
        routeLayer.removeAllFeatures();//레이어의 모든 도형을 지웁니다.

        //표준 데이터 포맷인 KML을 Read/Write 하는 클래스 입니다.
        //벡터 도형(Feature)이 추가되기 직전에 이벤트가 발생합니다.
        routeLayer.events.register("beforefeatureadded", routeLayer, onBeforeFeatureAdded);
                function onBeforeFeatureAdded(e) {
                    var style = {};
                    switch (e.feature.attributes.styleUrl) {
                    case "#pointStyle":
                      style.externalGraphic = "http://topopen.tmap.co.kr/imgs/point.png"; //렌더링 포인트에 사용될 외부 이미지 파일의 url입니다.
                      style.graphicHeight = 16; //외부 이미지 파일의 크기 설정을 위한 픽셀 높이입니다.
                      style.graphicOpacity = 1; //외부 이미지 파일의 투명도 (0-1)입니다.
                      style.graphicWidth = 16; //외부 이미지 파일의 크기 설정을 위한 픽셀 폭입니다.
                    break;
                    default:
                      style.strokeColor = "#ff0000";//stroke에 적용될 16진수 color
                      style.strokeOpacity = "1";//stroke의 투명도(0~1)
                      style.strokeWidth = "5";//stroke의 넓이(pixel 단위)
                    };
                  e.feature.style = style;
                }

        routeLayer.addFeatures(prtcl); //레이어에 도형을 등록합니다.
        map.zoomToExtent(routeLayer.getDataExtent());//map의 zoom을 routeLayer의 영역에 맞게 변경합니다.
      },
      //요청 실패시 콘솔창에서 에러 내용을 확인할 수 있습니다.
      error:function(request,status,error){
        console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error);
      }
    });
  });

})(jQuery); // End of use strict
