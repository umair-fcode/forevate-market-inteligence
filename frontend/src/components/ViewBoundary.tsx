import { Component, type ReactNode } from 'react'

/** Mirrors the original render() try/catch: a view that cannot be drawn from the data shows a message, not a blank page. */
export class ViewBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error) {
    console.error(error)
  }
  render() {
    if (this.state.error) {
      return <div className="empty">This view could not be drawn from the brand's data file: {this.state.error.message}</div>
    }
    return this.props.children
  }
}
