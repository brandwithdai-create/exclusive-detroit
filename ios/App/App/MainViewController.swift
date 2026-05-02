import UIKit
import Capacitor
import Network

class MainViewController: CAPBridgeViewController {

    private var pathMonitor: NWPathMonitor?
    private var progressObserver: NSKeyValueObservation?
    private var hasLoaded = false

    override func viewDidLoad() {
        view.backgroundColor = UIColor(red: 0.039, green: 0.039, blue: 0.039, alpha: 1.0)
        super.viewDidLoad()

        if let wv = webView {
            wv.isOpaque = false
            wv.backgroundColor = UIColor.clear
            wv.scrollView.backgroundColor = UIColor.clear

            // Mark load complete when estimatedProgress reaches 1.0.
            // This is the signal used by the path monitor to skip unnecessary reloads.
            progressObserver = wv.observe(\.estimatedProgress, options: [.new]) { [weak self] _, change in
                if let progress = change.newValue, progress >= 1.0 {
                    self?.hasLoaded = true
                }
            }
        }

        // When the device regains connectivity and the page never fully loaded
        // (e.g. launched in airplane mode), silently reload once.
        let monitor = NWPathMonitor()
        monitor.pathUpdateHandler = { [weak self] path in
            guard let self, !self.hasLoaded, path.status == .satisfied else { return }
            DispatchQueue.main.async {
                guard let wv = self.webView,
                      let serverURL = self.bridge?.config.serverURL else { return }
                wv.load(URLRequest(url: serverURL))
            }
        }
        monitor.start(queue: DispatchQueue.global(qos: .background))
        pathMonitor = monitor

        // When the app returns from background, if the WKWebView content process
        // was terminated by iOS (e.g. after opening an external link in Safari),
        // the page will be at about:blank. Reload the site URL so the user is
        // never left on a blank or stuck screen.
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    deinit {
        progressObserver?.invalidate()
        pathMonitor?.cancel()
    }

    @objc private func appDidBecomeActive() {
        guard let wv = webView else { return }
        let url = wv.url?.absoluteString ?? ""
        if url.isEmpty || url == "about:blank" {
            if let serverURL = bridge?.config.serverURL {
                wv.load(URLRequest(url: serverURL))
            }
        }
    }
}
