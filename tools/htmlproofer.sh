#!/bin/bash
# HTMLProofer 테스트 스크립트
# 워크플로우와 동일한 옵션으로 로컬에서 테스트

bundle exec htmlproofer "_site" \
  --disable-external \
  --ignore-urls "/^http:\/\/127\.0\.0\.1/,/^http:\/\/0\.0\.0\.0/,/^http:\/\/localhost/,/^https:\/\/fonts\.googleapis\.com/,/^https:\/\/fonts\.gstatic\.com/,/^https:\/\/www\.linkedin\.com/,/^https:\/\/pythontogo\.github\.io\/admin/,/#/,/^\/$/,/^mailto:/" \
  --allow-hash-href \
  --ignore-empty-alt \
  --http-status-ignore "0,404,999"
