// ============================================
// Google Apps Script - 챌린지 참여자 수집
// ============================================
// 사용법:
// 1. Google 스프레드시트를 새로 만드세요
// 2. 첫 번째 행(A1:E1)에 헤더를 입력하세요: 이름 | 생년월일 | 전화번호 | 참여일 | 응모완료
// 3. 상단 메뉴 → 확장 프로그램 → Apps Script 클릭
// 4. 기존 코드를 모두 지우고 아래 코드를 붙여넣으세요
// 5. 저장 (Ctrl+S)
// 6. 배포 → 새 배포 → 유형: 웹 앱
//    - 실행 주체: 본인
//    - 액세스 권한: 모든 사용자
// 7. 배포 → URL 복사
// 8. 복사한 URL을 challenge.js의 SHEET_URL에 붙여넣기
// ============================================

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var action = e.parameter.action || 'register';

  if (action === 'apply') {
    // 응모완료 처리: 전화번호로 행 찾아서 E열에 O 기록
    var phone = e.parameter.phone || '';
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][2] === phone) {
        sheet.getRange(i + 1, 5).setValue('O');
        break;
      }
    }
  } else {
    // 신규 참여자 등록
    var name = e.parameter.name || '';
    var birth = e.parameter.birth || '';
    var phone = e.parameter.phone || '';
    var date = e.parameter.date || '';
    sheet.appendRow([name, birth, phone, date, '']);
  }

  return ContentService.createTextOutput('ok');
}

function doPost(e) {
  return doGet(e);
}
