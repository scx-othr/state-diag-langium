public class HasQuarter extends State {

    public HasQuarter(GumballMachine context) {
        super(context);
    }

    @Override
    public void eject() {
        if (true) {
        System.out.println("Returning coin...");
            this.onExit();
            context.setState(new NoQuarter(context));
            context.getState().onEntry();
        }
}
    @Override
    public void turnCrank() {
        if (true) {
        System.out.println("Turning crank...");
            this.onExit();
            context.setState(new Sold(context));
            context.getState().onEntry();
        }
}
    @Override
    public void abandon() {
        if (true) {
            this.onExit();
            context.setState(new Final(context));
            context.getState().onEntry();
        }
}
}
