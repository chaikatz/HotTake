Pod::Spec.new do |s|
  s.name           = 'HotTakePlaces'
  s.version        = '1.0.0'
  s.summary        = 'Searches Apple Maps for the place a take is about.'
  s.description    = 'Local Expo module. MKLocalSearch over the query someone types, returning named places with address, neighborhood and coordinates.'
  s.author         = 'Hot Take'
  s.homepage       = 'https://github.com/chaikatz/HotTake'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
