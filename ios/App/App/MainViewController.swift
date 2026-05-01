import UIKit
import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController {

    private var loadOverlay: UIView?
    private var loadLabel: UILabel?
    private var didSuccessfullyLoad = false

    override func viewDidLoad() {
        super.viewDidLoad()
        showLoadOverlay()
    }

    private func showLoadOverlay() {
        let overlay = UIView()
        overlay.backgroundColor = UIColor(red: 0.039, green: 0.039, blue: 0.039, alpha: 1.0)
        overlay.translatesAutoresizingMaskIntoConstraints = false

        let symbol = UILabel()
        symbol.text = "✦"
        symbol.font = UIFont.systemFont(ofSize: 28, weight: .light)
        symbol.textColor = UIColor(red: 0.788, green: 0.659, blue: 0.298, alpha: 1.0)
        symbol.translatesAutoresizingMaskIntoConstraints = false

        let message = UILabel()
        message.text = "Loading Exclusive…"
        message.font = UIFont.systemFont(ofSize: 12, weight: .light)
        message.textColor = UIColor(red: 0.788, green: 0.659, blue: 0.298, alpha: 0.7)
        message.textAlignment = .center
        message.numberOfLines = 0
        message.translatesAutoresizingMaskIntoConstraints = false

        overlay.addSubview(symbol)
        overlay.addSubview(message)
        view.addSubview(overlay)

        NSLayoutConstraint.activate([
            overlay.topAnchor.constraint(equalTo: view.topAnchor),
            overlay.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            overlay.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            overlay.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            symbol.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
            symbol.centerYAnchor.constraint(equalTo: overlay.centerYAnchor, constant: -14),
            message.topAnchor.constraint(equalTo: symbol.bottomAnchor, constant: 12),
            message.leadingAnchor.constraint(equalTo: overlay.leadingAnchor, constant: 32),
            message.trailingAnchor.constraint(equalTo: overlay.trailingAnchor, constant: -32),
        ])

        loadOverlay = overlay
        loadLabel = message
    }

    private func hideLoadOverlay() {
        guard let overlay = loadOverlay else { return }
        didSuccessfullyLoad = true
        UIView.animate(withDuration: 0.25, animations: {
            overlay.alpha = 0
        }) { _ in
            overlay.removeFromSuperview()
            self.loadOverlay = nil
            self.loadLabel = nil
        }
    }

    private func showNetworkError() {
        guard !didSuccessfullyLoad, let label = loadLabel else { return }
        label.text = "Unable to load.\nPlease check your connection\nand reopen the app."
        label.textColor = UIColor(red: 0.788, green: 0.659, blue: 0.298, alpha: 1.0)
    }

    override func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        super.webView(webView, didFinish: navigation)
        hideLoadOverlay()
    }

    override func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        super.webView(webView, didFail: navigation, withError: error)
        showNetworkError()
    }

    override func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        super.webView(webView, didFailProvisionalNavigation: navigation, withError: error)
        showNetworkError()
    }
}
