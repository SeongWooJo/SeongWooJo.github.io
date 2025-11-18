source "https://rubygems.org"

# GitHub Pages가 지원하는 Jekyll + 플러그인 세트
gem "github-pages", group: :jekyll_plugins

# 로컬에서 `bundle exec jekyll serve` 할 때 필요 (Ruby 3 이상)
gem "webrick", "~> 1.7"

# (옵션) Windows 환경용 성능 개선 + 타임존 관련
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]

gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]
