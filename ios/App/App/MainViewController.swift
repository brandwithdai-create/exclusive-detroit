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
        let gold = UIColor(red: 0.788, green: 0.659, blue: 0.298, alpha: 1.0)

        let title = UILabel()
        title.attributedText = NSAttributedString(
            string: "EXCLUSIVE",
            attributes: [
                .font: UIFont.systemFont(ofSize: 15, weight: .thin),
                .foregroundColor: gold,
                .kern: 4.0
            ]
        )
        title.translatesAutoresizingMaskIntoConstraints = false

        let subtitle = UILabel()
        subtitle.attributedText = NSAttributedString(
            string: "Loading...",
            attributes: [
                .font: UIFont.systemFont(ofSize: 11, weight: .light),
                .foregroundColor: gold.withAlphaComponent(0.7),
                .kern: 1.5
            ]
        )
        subtitle.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(title)
        view.addSubview(subtitle)

        NSLayoutConstraint.activate([
            title.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            title.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -12),
            subtitle.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            subtitle.topAnchor.constraint(equalTo: title.bottomAnchor, constant: 10),
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
