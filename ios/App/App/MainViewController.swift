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

        // Static brand labels — visible on the dark background while the
        // WKWebView surface is blank (offline or loading). Once the page
        // renders its own #0A0A0A background they are naturally covered.
        let symbol = UILabel()
        symbol.text = "✦"
        symbol.font = UIFont.systemFont(ofSize: 28, weight: .light)
        symbol.textColor = UIColor(red: 0.788, green: 0.659, blue: 0.298, alpha: 1.0)
        symbol.translatesAutoresizingMaskIntoConstraints = false

        let message = UILabel()
        message.text = "EXCLUSIVE / Loading…"
        message.font = UIFont.systemFont(ofSize: 12, weight: .light)
        message.textColor = UIColor(red: 0.788, green: 0.659, blue: 0.298, alpha: 0.7)
        message.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(symbol)
        view.addSubview(message)

        NSLayoutConstraint.activate([
            symbol.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            symbol.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -14),
            message.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            message.topAnchor.constraint(equalTo: symbol.bottomAnchor, constant: 12),
        ])

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
