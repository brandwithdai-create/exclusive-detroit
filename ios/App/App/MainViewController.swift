import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        view.backgroundColor = UIColor(red: 0.039, green: 0.039, blue: 0.039, alpha: 1.0)
        super.viewDidLoad()

        if let wv = webView {
            wv.isOpaque = false
            wv.backgroundColor = UIColor.clear
            wv.scrollView.backgroundColor = UIColor.clear
        }

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    // When the app returns from background, if the WKWebView content process
    // was terminated by iOS (e.g. after opening an external link in Safari),
    // the page will be at about:blank. Reload the site URL so the user is
    // never left on a blank or stuck screen.
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
