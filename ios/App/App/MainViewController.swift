import UIKit
import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController {

    private var loadOverlay: UIView?
    private var loadLabel: UILabel?
    private var didSuccessfullyLoad = false
    private var failsafeItem: DispatchWorkItem?
    private var progressObserver: NSKeyValueObservation?
    private var urlObserver: NSKeyValueObservation?

    private static let appBg   = UIColor(red: 0.039, green: 0.039, blue: 0.039, alpha: 1.0)
    private static let appGold = UIColor(red: 0.788, green: 0.659, blue: 0.298, alpha: 1.0)

    override func viewDidLoad() {
        view.backgroundColor = MainViewController.appBg
        super.viewDidLoad()

        if let wv = webView {
            // Transparent WKWebView prevents white flash before the page paints.
            wv.isOpaque = false
            wv.backgroundColor = UIColor.clear
            wv.scrollView.backgroundColor = UIColor.clear

            // Hide overlay once the page finishes loading.
            progressObserver = wv.observe(\.estimatedProgress, options: [.new]) { [weak self] webView, change in
                guard let self = self, !self.didSuccessfullyLoad else { return }
                guard let progress = change.newValue, progress >= 1.0 else { return }
                guard let url = webView.url,
                      !url.absoluteString.isEmpty,
                      url.absoluteString != "about:blank" else { return }
                DispatchQueue.main.async { self.hideLoadOverlay() }
            }

            // When WKWebView URL moves to a real URL, extend the failsafe clock so a
            // slow connection gets more time before the error screen appears.
            urlObserver = wv.observe(\.url, options: [.new]) { [weak self] _, _ in
                guard let self = self, !self.didSuccessfullyLoad else { return }
                guard let url = self.webView?.url,
                      !url.absoluteString.isEmpty,
                      url.absoluteString != "about:blank" else { return }
                DispatchQueue.main.async { self.startFailsafe(delay: 30) }
            }
        }

        showLoadOverlay()
        startFailsafe(delay: 20)
    }

    deinit {
        progressObserver?.invalidate()
        urlObserver?.invalidate()
    }

    // MARK: - Overlay

    private func showLoadOverlay() {
        let overlay = UIView()
        overlay.backgroundColor = MainViewController.appBg
        overlay.translatesAutoresizingMaskIntoConstraints = false

        let title = UILabel()
        title.text = "EXCLUSIVE"
        title.font = UIFont.systemFont(ofSize: 15, weight: .thin)
        title.textColor = MainViewController.appGold
        title.textAlignment = .center
        title.letterSpacing(spacing: 6)
        title.translatesAutoresizingMaskIntoConstraints = false

        let message = UILabel()
        message.text = "Loading..."
        message.font = UIFont.systemFont(ofSize: 11, weight: .light)
        message.textColor = MainViewController.appGold.withAlphaComponent(0.6)
        message.textAlignment = .center
        message.numberOfLines = 0
        message.translatesAutoresizingMaskIntoConstraints = false

        overlay.addSubview(title)
        overlay.addSubview(message)
        view.addSubview(overlay)

        NSLayoutConstraint.activate([
            overlay.topAnchor.constraint(equalTo: view.topAnchor),
            overlay.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            overlay.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            overlay.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            title.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
            title.centerYAnchor.constraint(equalTo: overlay.centerYAnchor, constant: -10),
            message.topAnchor.constraint(equalTo: title.bottomAnchor, constant: 12),
            message.leadingAnchor.constraint(equalTo: overlay.leadingAnchor, constant: 32),
            message.trailingAnchor.constraint(equalTo: overlay.trailingAnchor, constant: -32),
        ])

        loadOverlay = overlay
        loadLabel = message
    }

    private func hideLoadOverlay() {
        failsafeItem?.cancel()
        failsafeItem = nil
        progressObserver?.invalidate()
        progressObserver = nil
        urlObserver?.invalidate()
        urlObserver = nil
        guard !didSuccessfullyLoad, let overlay = loadOverlay else { return }
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
        failsafeItem?.cancel()
        failsafeItem = nil
        guard !didSuccessfullyLoad, let label = loadLabel else { return }
        label.text = "Unable to load.\nPlease check your connection\nand reopen the app."
        label.textColor = MainViewController.appGold
    }

    // MARK: - Failsafe

    private func startFailsafe(delay: Double) {
        failsafeItem?.cancel()
        let item = DispatchWorkItem { [weak self] in
            guard let self = self, !self.didSuccessfullyLoad else { return }
            // If the WKWebView has a real URL the page loaded; the progress observer
            // may have missed it — hide the overlay cleanly without showing an error.
            if let url = self.webView?.url,
               !url.absoluteString.isEmpty,
               url.absoluteString != "about:blank" {
                self.hideLoadOverlay()
            } else {
                self.showNetworkError()
            }
        }
        failsafeItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: item)
    }
}

private extension UILabel {
    func letterSpacing(spacing: CGFloat) {
        guard let text = self.text else { return }
        let attributed = NSMutableAttributedString(string: text)
        attributed.addAttribute(.kern, value: spacing, range: NSRange(location: 0, length: text.count))
        self.attributedText = attributed
    }
}
