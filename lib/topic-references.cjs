'use strict';

// 고객이 찾는 상품·서비스 대신 홍보 영상 제작법을 판매하는 검색 결과를 걸러냅니다.
function isCustomerReference(title) {
  return Boolean(title) && !/(릴스|쇼츠)\s*(광고|제작|찍는\s*법|필수\s*치트키)|맛집\s*광고|홍보\s*(릴스|영상)|마케팅\s*(강의|홍보)|메타\s*광고|플레이스\s*대문\s*영상/.test(title);
}

module.exports = { isCustomerReference };
