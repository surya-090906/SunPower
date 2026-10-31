// Native React page. Data contract: portal/systems.
import { Fragment, cssStyle, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <h1>{"My systems and warranty"}</h1>
      {"\n"}
      <p className={"muted mb"}>
        {
          "Every unit installed at your property, with its serial number and warranty."
        }
      </p>
      {"\n"}
      <div className={"stack"}>
        {"\n"}
        {data.rows1?.length ? (
          data.rows1.map((row1, index) => (
            <Fragment key={index}>
              {"\n  "}
              <div className={"pcard"} style={cssStyle("padding:0")}>
                {"\n    "}
                <div
                  className={"spread"}
                  style={cssStyle(
                    "padding:1rem 1.1rem;border-bottom:1px solid var(--line)",
                  )}
                >
                  <div>
                    <b>{row1.v2}</b>
                    <div className={"small muted"}>
                      {row1.v3}
                      {" · "}
                      {row1.v4}
                    </div>
                  </div>
                  <a
                    className={"btn btn-line btn-sm"}
                    href={"/doc/warranty/" + text(row1.v5) + "/"}
                  >
                    {"Warranty card"}
                  </a>
                </div>
                {"\n    "}
                {row1.rows6?.length ? (
                  row1.rows6.map((row6, index) => (
                    <Fragment key={index}>
                      {"\n    "}
                      <div
                        style={cssStyle(
                          "padding:.8rem 1.1rem;border-bottom:1px solid var(--line)",
                        )}
                      >
                        {"\n      "}
                        <div className={"spread"}>
                          <b>{row6.v7}</b>
                          <span className={"badge " + text(row6.v8)}>
                            {row6.v9}
                          </span>
                        </div>
                        {"\n      "}
                        <div className={"small muted mono"}>{row6.v10}</div>
                        {"\n      "}
                        <div className={"spread small mt-s"}>
                          <span className={"muted"}>
                            {row6.choice11 === 0 ? (
                              <>
                                {"Delivered "}
                                {row6.v12}
                                {" · warranty until "}
                                <b>{row6.v13}</b>
                              </>
                            ) : null}
                          </span>
                          {"\n        "}
                          {row6.choice14 === 0 ? (
                            <>
                              <a
                                href={
                                  "/portal/requests/new/?serial=" +
                                  text(row6.v15)
                                }
                              >
                                {"Report a problem"}
                              </a>
                            </>
                          ) : null}
                        </div>
                        {"\n    "}
                      </div>
                      {"\n    "}
                    </Fragment>
                  ))
                ) : (
                  <></>
                )}
                {"\n  "}
              </div>
              {"\n"}
            </Fragment>
          ))
        ) : (
          <>
            {"\n  "}
            <div className={"pcard center"}>
              <p className={"muted"}>
                {"Your equipment will appear here once it has been delivered."}
              </p>
            </div>
            {"\n"}
          </>
        )}
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
