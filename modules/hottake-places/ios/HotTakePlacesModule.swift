import ExpoModulesCore
import Foundation
import MapKit

/// Finds the place a take is about, with Apple Maps.
///
/// Two searches run for every query and are merged, completions first: the
/// completer (what Maps itself types ahead with, so "torr" already offers
/// Torrisi) and a full natural-language search. Results are biased toward the
/// point given (the phone's location, or New York), not restricted to it.
public class HotTakePlacesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("HotTakePlaces")

    AsyncFunction("search") { (query: String, lat: Double?, lng: Double?, promise: Promise) in
      let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
      if trimmed.count < 2 {
        promise.resolve([[String: Any]]())
        return
      }
      var center = CLLocationCoordinate2D(latitude: 40.7306, longitude: -73.9866)
      if let lat = lat, let lng = lng {
        center = CLLocationCoordinate2D(latitude: lat, longitude: lng)
      }
      DispatchQueue.main.async {
        PlaceFinder(query: trimmed, center: center).run { results in promise.resolve(results) }
      }
    }
  }

  /// One result, in the shape the picker draws.
  static func describe(_ item: MKMapItem) -> [String: Any]? {
    let placemark = item.placemark
    let coordinate = placemark.coordinate
    guard CLLocationCoordinate2DIsValid(coordinate) else { return nil }
    let name = item.name ?? placemark.name ?? ""
    if name.isEmpty { return nil }

    var street = ""
    if let number = placemark.subThoroughfare, !number.isEmpty {
      street = number
    }
    if let road = placemark.thoroughfare, !road.isEmpty {
      street = street.isEmpty ? road : street + " " + road
    }

    var identifier = String(format: "apple:%.5f,%.5f:%@", coordinate.latitude, coordinate.longitude, name)
    if #available(iOS 18.0, *) {
      if let id = item.identifier?.rawValue, !id.isEmpty {
        identifier = "apple:" + id
      }
    }

    return [
      "id": String(identifier.prefix(200)),
      "name": name,
      "address": street,
      "neighborhood": placemark.subLocality ?? "",
      "city": placemark.locality ?? placemark.subAdministrativeArea ?? "",
      "lat": coordinate.latitude,
      "lng": coordinate.longitude,
      "category": item.pointOfInterestCategory?.rawValue ?? ""
    ]
  }
}

/// One query's two searches, merged. Lives on the main thread (the
/// completer's delegate requires it) and keeps itself alive until done.
private final class PlaceFinder: NSObject, MKLocalSearchCompleterDelegate {
  private let query: String
  private let region: MKCoordinateRegion
  private let completer = MKLocalSearchCompleter()
  private var completions: [MKMapItem] = []
  private var fullSearch: [MKMapItem] = []
  private var completionsDone = false
  private var fullSearchDone = false
  private var finished = false
  private var done: (([[String: Any]]) -> Void)?
  private var keepAlive: PlaceFinder?

  private static let completionsResolved = 6

  init(query: String, center: CLLocationCoordinate2D) {
    self.query = query
    self.region = MKCoordinateRegion(center: center, latitudinalMeters: 30_000, longitudinalMeters: 30_000)
    super.init()
    keepAlive = self
  }

  func run(_ done: @escaping ([[String: Any]]) -> Void) {
    self.done = done

    let request = MKLocalSearch.Request()
    request.naturalLanguageQuery = query
    request.region = region
    request.resultTypes = [.pointOfInterest, .address]
    MKLocalSearch(request: request).start { [weak self] response, _ in
      self?.fullSearch = response?.mapItems ?? []
      self?.fullSearchDone = true
      self?.finishIfReady()
    }

    completer.delegate = self
    completer.region = region
    completer.resultTypes = [.pointOfInterest, .address]
    completer.queryFragment = query

    DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) { [weak self] in
      self?.completionsDone = true
      self?.fullSearchDone = true
      self?.finishIfReady()
    }
  }

  func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
    resolve(Array(completer.results.prefix(PlaceFinder.completionsResolved)))
  }

  func completer(_ completer: MKLocalSearchCompleter, didFailWithError error: Error) {
    completionsDone = true
    finishIfReady()
  }

  private func resolve(_ results: [MKLocalSearchCompletion]) {
    if results.isEmpty {
      completionsDone = true
      finishIfReady()
      return
    }
    var slots = [MKMapItem?](repeating: nil, count: results.count)
    let group = DispatchGroup()
    for (i, completion) in results.enumerated() {
      group.enter()
      MKLocalSearch(request: MKLocalSearch.Request(completion: completion)).start { response, _ in
        slots[i] = response?.mapItems.first
        group.leave()
      }
    }
    group.notify(queue: .main) { [weak self] in
      self?.completions = slots.compactMap { $0 }
      self?.completionsDone = true
      self?.finishIfReady()
    }
  }

  private func finishIfReady() {
    guard !finished, completionsDone, fullSearchDone else { return }
    finished = true
    var seen = Set<String>()
    var out: [[String: Any]] = []
    for item in completions + fullSearch {
      guard let described = HotTakePlacesModule.describe(item), let id = described["id"] as? String else { continue }
      let key = id + "|" + ((described["name"] as? String) ?? "").lowercased()
      if seen.contains(key) { continue }
      seen.insert(key)
      out.append(described)
      if out.count >= 15 { break }
    }
    done?(out)
    done = nil
    keepAlive = nil
  }
}
