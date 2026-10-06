import React from "react";

// Le paddock est affiché sauf si l'URL contient ?classic (retour à l'ancienne interface).
export function supportsPaddock() {
  try {
    return new URLSearchParams(window.location.search).get("classic") === null;
  } catch (e) {
    return true;
  }
}

// Si le paddock plante (image introuvable...), on retombe sur l'interface classique.
export class PaddockBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.error("Paddock indisponible :", err);
    if (this.props.onFail) this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
