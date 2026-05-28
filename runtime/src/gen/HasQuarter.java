import javax.swing.plaf.nimbus.State;

public class HasQuarter extends State {

    public HasQuarter(GumballMachine context) {
        super(context);
    }

    @Override
    public void eject() {
        if (true) {
            this.onExit();
            System.out.println("Returning coin..."); 
            context.setState(new NoQuarter(context));
            context.getState().onEntry();
        }
}
    @Override
    public void turnCrank() {
        if (true) {
            this.onExit();
            System.out.println("Turning crank...");
            context.setState(new Sold(context));
            context.getState().onEntry();
        }
}
    @Override
    public void abandon() {
        if (true) {
            this.onExit();
            context.setState(new TheEnd(context));
            context.getState().onEntry();
        }
}
}
